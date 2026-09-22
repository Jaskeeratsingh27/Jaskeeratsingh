import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const loop=path.join(ROOT,".agents","skills","usage-efficient-orchestrator","scripts","closed-loop.mjs");
const telemetry=path.join(ROOT,".agents","skills","usage-efficient-orchestrator","scripts","telemetry.mjs");
const tmp=fs.mkdtempSync(path.join(os.tmpdir(),"orchestrator-v2-loop-"));
const dataDir=path.join(tmp,"telemetry");
fs.mkdirSync(dataDir,{recursive:true,mode:0o700});
const ledger=path.join(dataDir,"events.jsonl");
const env={...process.env,ORCHESTRATOR_DATA_DIR:dataDir};
const checks=[];
const check=(name,ok,detail="")=>checks.push({name,ok,detail});

let seq=0;
const now=Date.now();
function event(base){
  seq++;
  return {
    schema_version:"1.0",
    orchestrator_version:"2.0.0",
    event_id:"hist_"+String(seq).padStart(6,"0"),
    project_id:"0123456789abcdef0123",
    ...base
  };
}
function addHistory({id,daysAgo,burn,roles}){
  const start=new Date(now-daysAgo*86400000).toISOString();
  const finish=new Date(now-daysAgo*86400000+10*60000).toISOString();
  const cycle="H"+Math.floor(daysAgo/7);
  const out=[
    event({timestamp:start,event_type:"task_started",task_id:id,status:"started",profile:"economy",task_kind:"implementation",complexity:"SMALL",risk:"LOW",remaining_pct:80,usage_source:"user",usage_cycle_id:cycle})
  ];
  roles.forEach((role,i)=>{
    out.push(event({
      timestamp:new Date(Date.parse(start)+(i+1)*60000).toISOString(),
      event_type:"route_selected",task_id:id,work_unit:"W"+(i+1),role,
      model:role==="cheap_reader"?"gpt-5.6-luna":"gpt-5.6-terra",
      reasoning:role==="cheap_reader"?"low":"medium",
      access:role==="cheap_reader"?"read-only":"workspace-write"
    }));
    out.push(event({
      timestamp:new Date(Date.parse(start)+(i+2)*60000).toISOString(),
      event_type:"worker_finished",task_id:id,work_unit:"W"+(i+1),role,status:"complete",duration_ms:500,files_inspected:1,files_touched:role==="standard_engineer"?1:0,tests_run:0,retries:0
    }));
  });
  out.push(event({timestamp:new Date(Date.parse(finish)-30000).toISOString(),event_type:"validation",task_id:id,status:"passed",check_count:1,failed_count:0}));
  out.push(event({timestamp:finish,event_type:"task_finished",task_id:id,status:"complete",duration_ms:1500,remaining_pct:80-burn,usage_source:"user",usage_cycle_id:cycle}));
  return out;
}

const history=[];
for(let i=0;i<8;i++){
  history.push(...addHistory({id:"base_"+i,daysAgo:42-i*4,burn:2.8+i*0.03,roles:["standard_engineer"]}));
  history.push(...addHistory({id:"cand_"+i,daysAgo:40-i*4,burn:1.1+i*0.03,roles:["cheap_reader","standard_engineer"]}));
}
history.sort((a,b)=>Date.parse(a.timestamp)-Date.parse(b.timestamp));
fs.writeFileSync(ledger,history.map(e=>JSON.stringify(e)).join("\n")+"\n",{mode:0o600});

function run(script,args,expect=0){
  const r=spawnSync(process.execPath,[script,...args],{cwd:ROOT,env,encoding:"utf8"});
  check("exit "+path.basename(script)+" "+args[0],r.status===expect,"status="+r.status+" stderr="+r.stderr.trim());
  return r;
}
function jsonRun(script,args){
  const r=run(script,args);
  return JSON.parse(r.stdout);
}

const pre=jsonRun(loop,["preflight","--task-id","loop_main","--task-kind","implementation","--complexity","SMALL","--risk","LOW","--profile","economy","--baseline","60","--cycle","W1","--json"]);
check("C01 preflight task/control",pre.task_id==="loop_main"&&["execute","execute_with_proxy_guards"].includes(pre.control_action),JSON.stringify(pre));
check("C02 adaptive candidate observed",pre.adaptive.candidate_route==="scout_standard",JSON.stringify(pre.adaptive));
check("C03 baseline remains execution route",pre.execution_route==="direct_standard"&&pre.execution_route!==pre.adaptive.candidate_route,JSON.stringify({execution:pre.execution_route,candidate:pre.adaptive.candidate_route}));
check("C04 delegation mapped",pre.delegation_plan.length===1&&pre.delegation_plan[0].role==="standard_engineer"&&pre.delegation_plan[0].model==="gpt-5.6-terra"&&pre.delegation_plan[0].access==="workspace-write",JSON.stringify(pre.delegation_plan));

run(telemetry,["route","--task-id","loop_main","--work-unit","W1","--role","standard_engineer","--model","gpt-5.6-terra","--reasoning","medium","--access","workspace-write"]);
const stat=jsonRun(loop,["status","--task-id","loop_main","--json"]);
check("C05 proxy counters",stat.proxy.counts.agent_spawns===1&&stat.proxy.counts.write_phases===1&&stat.proxy.blocked_next_actions.includes("write_phases"),JSON.stringify(stat.proxy));

const cp1=jsonRun(loop,["checkpoint","--task-id","loop_main","--remaining","57.1","--cycle","W1","--json"]);
check("C06 below target continues",cp1.measured===true&&cp1.measured_burn_points===2.9&&cp1.control_action==="execute",JSON.stringify(cp1));

const cp2=jsonRun(loop,["checkpoint","--task-id","loop_main","--remaining","57","--cycle","W1","--json"]);
check("C07 at economy target stops",cp2.measured_burn_points===3&&cp2.control_action==="stop_target",JSON.stringify(cp2));

run(telemetry,["worker","--task-id","loop_main","--work-unit","W1","--role","standard_engineer","--model","gpt-5.6-terra","--reasoning","medium","--access","workspace-write","--status","complete","--files-touched","1","--tests-run","1"]);
const fin=jsonRun(loop,["finalize","--task-id","loop_main","--status","complete","--remaining","57","--cycle","W1","--validation-status","passed","--check-count","1","--failed-count","0","--json"]);
check("C09 finalize measured learning",fin.measurement.measured===true&&fin.measurement.burn===3&&fin.learning.eligible===true,JSON.stringify(fin));
check("C10 prediction error recorded",typeof fin.prediction.absolute_error_points==="number"&&fin.prediction.absolute_error_points>=0,JSON.stringify(fin.prediction));

const ceilPre=jsonRun(loop,["preflight","--task-id","loop_ceiling","--task-kind","implementation","--complexity","SMALL","--risk","LOW","--profile","economy","--baseline","80","--cycle","W2","--json"]);
const cpCeil=jsonRun(loop,["checkpoint","--task-id","loop_ceiling","--remaining","74.9","--cycle","W2","--json"]);
check("C08 above ceiling stops",cpCeil.measured_burn_points===5.1&&cpCeil.control_action==="stop_ceiling",JSON.stringify(cpCeil));
jsonRun(loop,["finalize","--task-id","loop_ceiling","--status","stopped","--remaining","74.9","--cycle","W2","--json"]);

const critical=jsonRun(loop,["preflight","--task-id","loop_critical","--task-kind","implementation","--complexity","SMALL","--risk","CRITICAL","--profile","balanced","--json"]);
check("C11 critical plan-only",critical.control_action==="plan_only"&&critical.execution_route==="architect_review",JSON.stringify(critical));

const large=jsonRun(loop,["preflight","--task-id","loop_large","--task-kind","mixed","--complexity","LARGE","--risk","LOW","--profile","balanced","--json"]);
check("C12 large plan-only",large.control_action==="plan_only"&&large.execution_route==="architect_review",JSON.stringify(large));

const emptyEnv={...process.env,ORCHESTRATOR_DATA_DIR:path.join(tmp,"empty-telemetry")};
const noHistRun=spawnSync(process.execPath,[loop,"preflight","--task-id","loop_review","--task-kind","review","--complexity","SMALL","--risk","LOW","--profile","balanced","--json"],{cwd:ROOT,env:emptyEnv,encoding:"utf8"});
check("exit isolated no-history preflight",noHistRun.status===0,"status="+noHistRun.status+" stderr="+noHistRun.stderr.trim());
const noHist=JSON.parse(noHistRun.stdout);
check("C13 no-history no fabricated usage",noHist.usage.status==="insufficient_data"&&noHist.usage.estimate===null&&noHist.control_action==="execute_with_proxy_guards",JSON.stringify(noHist.usage));

const bad=run(loop,["preflight","--task-kind","implementation","--complexity","SMALL","--risk","LOW","--profile","balanced","--goal","secret prompt"],2);
check("C14 free-text rejected",bad.stderr.includes("unsupported argument --goal"),bad.stderr);

const lines=fs.readFileSync(ledger,"utf8").trim().split("\n").map(JSON.parse);
const mainEvents=lines.filter(e=>e.task_id==="loop_main");
check("preflight decision event exists",mainEvents.some(e=>e.event_type==="preflight_decision"&&e.selected_route==="direct_standard"));
check("post-task evaluation exists",mainEvents.some(e=>e.event_type==="post_task_evaluation"&&e.learning_eligible===true&&e.actual_burn_points===3));
const ledgerText=fs.readFileSync(ledger,"utf8");
check("C15 privacy ledger excludes rejected free text",!ledgerText.includes("secret prompt")&&!ledgerText.includes('"goal"'));

const failed=checks.filter(c=>!c.ok);
for(const c of checks) console.log((c.ok?"PASS":"FAIL")+" | "+c.name+(c.detail?" | "+c.detail:""));
console.log("\nSUMMARY: "+(checks.length-failed.length)+"/"+checks.length+" closed-loop checks passed");
fs.rmSync(tmp,{recursive:true,force:true});
if(failed.length) process.exit(1);
