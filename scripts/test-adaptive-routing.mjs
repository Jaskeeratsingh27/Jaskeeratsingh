import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const cli=path.join(ROOT,".agents","skills","usage-efficient-orchestrator","scripts","adaptive-routing.mjs");
const tmp=fs.mkdtempSync(path.join(os.tmpdir(),"orchestrator-adaptive-"));
const dataDir=path.join(tmp,"telemetry");
fs.mkdirSync(dataDir,{recursive:true,mode:0o700});
const ledger=path.join(dataDir,"events.jsonl");
const env={...process.env,ORCHESTRATOR_DATA_DIR:dataDir};
const checks=[];
const check=(name,ok,detail="")=>checks.push({name,ok,detail});

const now=Date.now();
let seq=0;
const events=[];
function e(base){
  seq++;
  return {
    schema_version:"1.0",
    orchestrator_version:"1.5.0",
    event_id:"evt_"+String(seq).padStart(6,"0"),
    project_id:"abcdef0123456789abcd",
    ...base
  };
}
function addTask({id,daysAgo,profile,taskKind,complexity,risk,burn,roles,outcome="complete",validation="passed"}){
  const start=new Date(now-daysAgo*86400000).toISOString();
  const finish=new Date(now-daysAgo*86400000+20*60000).toISOString();
  const baseline=80;
  const cycle="W_"+Math.floor(daysAgo/7);
  events.push(e({
    timestamp:start,event_type:"task_started",task_id:id,status:"started",
    profile,task_kind:taskKind,complexity,risk,
    remaining_pct:baseline,usage_source:"user",usage_cycle_id:cycle
  }));
  roles.forEach((role,index)=>{
    events.push(e({
      timestamp:new Date(Date.parse(start)+(index+1)*60000).toISOString(),
      event_type:"route_selected",task_id:id,work_unit:"W"+(index+1),role,
      model:role==="cheap_reader"?"gpt-5.6-luna":role==="reviewer"?"gpt-5.6-terra":role==="architect"?"primary":"gpt-5.6-terra",
      reasoning:role==="cheap_reader"?"low":"medium",
      access:["cheap_reader","reviewer","architect"].includes(role)?"read-only":"workspace-write"
    }));
    events.push(e({
      timestamp:new Date(Date.parse(start)+(index+2)*60000).toISOString(),
      event_type:"worker_finished",task_id:id,work_unit:"W"+(index+1),role,
      status:outcome==="complete"?"complete":"failed",
      duration_ms:800+index*100,
      files_inspected:role==="cheap_reader"?3:1,
      files_touched:role==="standard_engineer"?1:0,
      tests_run:role==="reviewer"?1:0,
      retries:0
    }));
  });
  if(validation!=="none"){
    events.push(e({
      timestamp:new Date(Date.parse(finish)-60000).toISOString(),
      event_type:"validation",task_id:id,
      status:validation==="passed"?"passed":"failed",
      check_count:1,failed_count:validation==="passed"?0:1
    }));
  }
  events.push(e({
    timestamp:finish,event_type:"task_finished",task_id:id,status:outcome,
    duration_ms:5000,remaining_pct:Number((baseline-burn).toFixed(4)),
    usage_source:"user",usage_cycle_id:cycle
  }));
}

// A01: SMALL/LOW/economy. Baseline direct_standard is materially more expensive than scout_standard.
// Interleave the routes in time so the usage cohort itself is stable rather than falsely drifting.
const aBase=[2.5,2.6,2.7,2.8,2.9,3.0,3.1,3.2];
const aCand=[1.1,1.2,1.3,1.4,1.5,1.6,1.7,1.8];
aBase.forEach((burn,i)=>addTask({
  id:"a_base_"+i,daysAgo:44-i*4,profile:"economy",taskKind:"implementation",complexity:"SMALL",risk:"LOW",
  burn,roles:["standard_engineer"]
}));
aCand.forEach((burn,i)=>addTask({
  id:"a_cand_"+i,daysAgo:42-i*4,profile:"economy",taskKind:"implementation",complexity:"SMALL",risk:"LOW",
  burn,roles:["cheap_reader","standard_engineer"]
}));

// A02: MEDIUM/MEDIUM/balanced. Candidate is cheaper but has poor success/validation quality.
for(let i=0;i<10;i++){
  addTask({
    id:"q_base_"+i,daysAgo:43-i*3,profile:"balanced",taskKind:"implementation",complexity:"MEDIUM",risk:"MEDIUM",
    burn:4.4+i*0.08,roles:["standard_engineer","reviewer"]
  });
  addTask({
    id:"q_cand_"+i,daysAgo:42-i*3,profile:"balanced",taskKind:"implementation",complexity:"MEDIUM",risk:"MEDIUM",
    burn:2.6+i*0.05,roles:["cheap_reader","standard_engineer","reviewer"],
    outcome:i<7?"complete":"failed",validation:i<7?"passed":"failed"
  });
}

// A03: HIGH risk. Cheaper historical scout+writer route lacks mandatory reviewer.
for(let i=0;i<8;i++){
  addTask({
    id:"r_base_"+i,daysAgo:41-i*4,profile:"balanced",taskKind:"implementation",complexity:"SMALL",risk:"HIGH",
    burn:4.8+i*0.06,roles:["standard_engineer","reviewer"]
  });
  addTask({
    id:"r_unsafe_"+i,daysAgo:39-i*4,profile:"balanced",taskKind:"implementation",complexity:"SMALL",risk:"HIGH",
    burn:2.0+i*0.05,roles:["cheap_reader","standard_engineer"]
  });
}

// A06: stable route evidence exists, but total usage pattern has a strong newer-half shift.
for(let i=0;i<6;i++){
  addTask({
    id:"d_old_"+i,daysAgo:40-i*2,profile:"balanced",taskKind:"mixed",complexity:"SMALL",risk:"MEDIUM",
    burn:1.0+i*0.05,roles:i%2===0?["cheap_reader","standard_engineer"]:["cheap_reader","standard_engineer","reviewer"]
  });
}
for(let i=0;i<6;i++){
  addTask({
    id:"d_new_"+i,daysAgo:16-i*2,profile:"balanced",taskKind:"mixed",complexity:"SMALL",risk:"MEDIUM",
    burn:4.0+i*0.05,roles:i%2===0?["cheap_reader","standard_engineer"]:["cheap_reader","standard_engineer","reviewer"]
  });
}

// Legacy/unrecognized role sequence: enough events to be visible, never a known candidate.
for(let i=0;i<6;i++){
  addTask({
    id:"legacy_"+i,daysAgo:20-i,profile:"balanced",taskKind:"unknown",complexity:"MICRO",risk:"LOW",
    burn:0.5,roles:["architect","standard_engineer"]
  });
}

events.sort((a,b)=>Date.parse(a.timestamp)-Date.parse(b.timestamp));
fs.writeFileSync(ledger,events.map(x=>JSON.stringify(x)).join("\n")+"\n",{mode:0o600});

function run(args,expect=0){
  const r=spawnSync(process.execPath,[cli,...args],{cwd:ROOT,env,encoding:"utf8"});
  check("exit "+args.join(" "),r.status===expect,"status="+r.status+" stderr="+r.stderr.trim());
  return r;
}
function rec(taskKind,complexity,risk,profile,extra=[]){
  const r=run(["recommend","--task-kind",taskKind,"--complexity",complexity,"--risk",risk,"--profile",profile,"--json",...extra]);
  if(r.status!==0) return null;
  return JSON.parse(r.stdout);
}

const a1=rec("implementation","SMALL","LOW","economy");
check("A01 candidate lower burn",a1?.decision==="candidate_lower_burn",JSON.stringify(a1));
check("A01 candidate route scout_standard",a1?.candidate_route==="scout_standard",a1?.candidate_route);
check("A01 savings positive",a1?.estimated_p90_savings_points>=0.5,String(a1?.estimated_p90_savings_points));
check("A07 shadow candidate not active",a1?.active_eligible===false && a1?.mode==="shadow",JSON.stringify(a1));

const a2=rec("implementation","MEDIUM","MEDIUM","balanced");
check("A02 quality floor rejects cheap unreliable route",a2?.decision==="quality_floor",JSON.stringify(a2));
check("A02 no candidate promoted",a2?.candidate_route===null);

const a3=rec("implementation","SMALL","HIGH","balanced");
check("A03 high-risk reviewer floor",a3?.decision==="risk_floor",JSON.stringify(a3));
check("A03 unsafe route not selected",a3?.candidate_route===null);

const a4=rec("implementation","SMALL","CRITICAL","balanced");
check("A04 critical risk floor",a4?.decision==="risk_floor" && a4?.active_eligible===false,JSON.stringify(a4));

const a5=rec("review","SMALL","LOW","economy");
check("A05 insufficient evidence",a5?.decision==="insufficient_data" && a5?.candidate_route===null,JSON.stringify(a5));

const a6=rec("mixed","SMALL","MEDIUM","balanced");
check("A06 drift suppresses adaptation",a6?.decision==="drift_suppressed",JSON.stringify(a6));

const deterministic1=rec("implementation","SMALL","LOW","economy");
const deterministic2=rec("implementation","SMALL","LOW","economy");
check("A08 deterministic route decision",
  deterministic1?.baseline_route===deterministic2?.baseline_route &&
  deterministic1?.candidate_route===deterministic2?.candidate_route &&
  deterministic1?.decision===deterministic2?.decision);

const legacy=rec("unknown","MICRO","LOW","balanced");
check("A09 legacy unknown task kind not adaptively promoted",legacy?.candidate_route===null,JSON.stringify(legacy));

const shadow=JSON.parse(run(["shadow","--days","56","--json"]).stdout);
check("A10 shadow evaluates multiple classes",shadow.classes_evaluated>=4 && shadow.candidate_recommendations>=1,JSON.stringify(shadow));

const exportPath=path.join(tmp,"adaptive-export.json");
run(["export","--days","56","--out",exportPath]);
const exported=JSON.parse(fs.readFileSync(exportPath,"utf8"));
const exportText=JSON.stringify(exported);
check("A11 export omits task ids",!exportText.includes("a_base_0")&&!exportText.includes("project_id"));
check("A11 export keeps aggregate decisions",exported.shadow_summary?.candidate_recommendations>=1);

const bad=run(["recommend","--task-kind","implementation","--complexity","SMALL","--risk","LOW","--profile","economy","--note","free text"],2);
check("A12 free-text argument rejected",bad.stderr.includes("unsupported argument --note"));

const failed=checks.filter(c=>!c.ok);
for(const c of checks) console.log((c.ok?"PASS":"FAIL")+" | "+c.name+(c.detail?" | "+c.detail:""));
console.log("\nSUMMARY: "+(checks.length-failed.length)+"/"+checks.length+" adaptive-routing checks passed");
fs.rmSync(tmp,{recursive:true,force:true});
if(failed.length) process.exit(1);
