
function adminKey(): string {
  const raw = Deno.env.get("SUPABASE_SECRET_KEYS");
  if (raw) {
    const keys = JSON.parse(raw);
    if (keys.default) return keys.default;
  }
  const legacy = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (legacy) return legacy;
  throw new Error("Supabase admin key unavailable");
}
async function db(path: string, init: RequestInit = {}) {
  const base = Deno.env.get("SUPABASE_URL")!;
  const headers = new Headers(init.headers || {});
  headers.set("apikey", adminKey());
  headers.set("content-type", "application/json");
  headers.set("accept", "application/json");
  return await fetch(`${base}/rest/v1/${path}`, { ...init, headers });
}
async function sha256Hex(text:string):Promise<string>{
  const d=new Uint8Array(await crypto.subtle.digest("SHA-256",new TextEncoder().encode(text)));
  return [...d].map(b=>b.toString(16).padStart(2,"0")).join("");
}
function safeEqual(a:string,b:string):boolean{
  if(a.length!==b.length)return false; let x=0;
  for(let i=0;i<a.length;i++)x|=a.charCodeAt(i)^b.charCodeAt(i);
  return x===0;
}
async function authorized(req:Request):Promise<boolean>{
  const token=req.headers.get("x-gjm-cron-token")||"";
  if(!token)return false;
  const r=await db("gjm_runtime_config?config_key=eq.cron_token_sha256&select=config_value");
  if(!r.ok)return false;
  const rows=await r.json();
  if(!rows[0])return false;
  return safeEqual(await sha256Hex(token),rows[0].config_value);
}
function jiraConfig(){
  const base=Deno.env.get("JIRA_BASE_URL")?.replace(/\/$/,"");
  const email=Deno.env.get("JIRA_EMAIL");
  const token=Deno.env.get("JIRA_API_TOKEN");
  if(!base||!email||!token)return null;
  return {base,email,token};
}
class JiraError extends Error {
  status:number; retryable:boolean;
  constructor(message:string,status:number,retryable:boolean){super(message);this.status=status;this.retryable=retryable;}
}
async function jira(path:string,init:RequestInit={}){
  const c=jiraConfig(); if(!c)throw new Error("Jira credentials unavailable");
  const headers=new Headers(init.headers||{});
  headers.set("authorization","Basic "+btoa(c.email+":"+c.token));
  headers.set("accept","application/json");
  if(init.body)headers.set("content-type","application/json");
  const r=await fetch(c.base+path,{...init,headers});
  if(!r.ok){
    const text=(await r.text()).slice(0,500);
    throw new JiraError(`Jira ${r.status}: ${text}`,r.status,r.status===429||r.status===408||r.status>=500);
  }
  if(r.status===204)return null;
  const t=await r.text(); return t?JSON.parse(t):null;
}
async function currentIssue(issue:string){
  return await jira(`/rest/api/3/issue/${encodeURIComponent(issue)}?fields=status,labels`);
}
async function executeOperation(op:any){
  const p=op.payload||{};
  if(op.operation==="jira.transition"){
    const issue=p.issue_key, target=String(p.target_status||"");
    const current=await currentIssue(issue);
    if(String(current?.fields?.status?.name||"").toLowerCase()===target.toLowerCase())return {already:true};
    const data=await jira(`/rest/api/3/issue/${encodeURIComponent(issue)}/transitions`);
    const match=(data?.transitions||[]).find((t:any)=>String(t.name).toLowerCase()===target.toLowerCase());
    if(!match)throw new JiraError(`Transition '${target}' is not available for ${issue}`,422,false);
    await jira(`/rest/api/3/issue/${encodeURIComponent(issue)}/transitions`,{
      method:"POST",body:JSON.stringify({transition:{id:match.id}})
    });
    return {transition:target};
  }
  if(op.operation==="jira.add_label"||op.operation==="jira.remove_label"){
    const issue=p.issue_key,label=String(p.label||"");
    const current=await currentIssue(issue);
    const labels:Array<string>=current?.fields?.labels||[];
    const wantsAdd=op.operation==="jira.add_label";
    const has=labels.includes(label);
    if((wantsAdd&&has)||(!wantsAdd&&!has))return {already:true};
    await jira(`/rest/api/3/issue/${encodeURIComponent(issue)}`,{
      method:"PUT",
      body:JSON.stringify({update:{labels:[wantsAdd?{add:label}:{remove:label}]}})
    });
    return {label,action:wantsAdd?"added":"removed"};
  }
  throw new JiraError("Unsupported operation: "+op.operation,422,false);
}
async function mark(op:any,status:string,error:string|null,nextAttempt:string|null){
  await db(`gjm_outbox?operation_id=eq.${encodeURIComponent(op.operation_id)}`,{
    method:"PATCH",
    body:JSON.stringify({status,last_error:error,next_attempt_at:nextAttempt,updated_at:new Date().toISOString()})
  });
}
async function audit(op:any,action:string,detail:any){
  await db("gjm_audit_log",{method:"POST",body:JSON.stringify({
    work_item_id:op.payload?.issue_key||null,event_id:op.event_id,operation_id:op.operation_id,
    actor:"reconcile-worker",action,detail
  })});
}
async function activity(op:any,summary:string,detail:string){
  await db("gjm_project_activity?on_conflict=dedupe_key",{
    method:"POST",headers:{Prefer:"resolution=ignore-duplicates"},
    body:JSON.stringify({project_key:"github-jira-manager",source:"worker",summary,detail,dedupe_key:op.operation_id+":"+summary})
  });
}

Deno.serve(async(req:Request)=>{
  if(req.method!=="POST")return new Response("method not allowed",{status:405});
  if(!(await authorized(req)))return new Response("unauthorized",{status:401});

  if(!jiraConfig()){
    return Response.json({ok:false,ready:false,credential_gate:["JIRA_BASE_URL","JIRA_EMAIL","JIRA_API_TOKEN"]},{status:503});
  }

  const claim=await db("rpc/gjm_claim_outbox",{method:"POST",body:JSON.stringify({p_limit:10})});
  if(!claim.ok)return Response.json({ok:false,error:"claim failed"},{status:500});
  const ops=await claim.json();
  let completed=0,failed=0,dead=0;
  for(const op of ops){
    try{
      const result=await executeOperation(op);
      await mark(op,"COMPLETE",null,null);
      await audit(op,"operation_complete",{operation:op.operation,result});
      await activity(op,`${op.payload?.issue_key||"Work item"} updated`,`${op.operation} completed successfully.`);
      completed++;
    }catch(err){
      const retryable=err instanceof JiraError ? err.retryable : true;
      const attempts=Number(op.attempts||1);
      const isDead=!retryable||attempts>=5;
      const delay=Math.min(3600,60*Math.pow(2,Math.max(0,attempts-1)));
      const next=isDead?null:new Date(Date.now()+delay*1000).toISOString();
      await mark(op,isDead?"DEAD_LETTER":"FAILED",String(err),next);
      await audit(op,isDead?"operation_dead_lettered":"operation_failed",{operation:op.operation,error:String(err),retryable,attempts});
      if(isDead)dead++; else failed++;
    }
  }
  return Response.json({ok:true,ready:true,claimed:ops.length,completed,failed,dead_lettered:dead});
});
