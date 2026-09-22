import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { reconstructTasks } from "../.agents/skills/usage-efficient-orchestrator/scripts/usage-intelligence.mjs";
import { recommend } from "../.agents/skills/usage-efficient-orchestrator/scripts/adaptive-routing.mjs";

const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const compatibility=JSON.parse(fs.readFileSync(path.join(ROOT,".agents/skills/usage-efficient-orchestrator/config/compatibility.json"),"utf8"));
const checks=[];
const check=(name,ok,detail="")=>checks.push({name,ok,detail});

let seq=0;
function ev(version,type,taskId,offset,extra={}){
  seq++;
  return {
    schema_version:"1.0",
    ...(version?{orchestrator_version:version}:{}),
    event_id:"compat_"+String(seq).padStart(4,"0"),
    timestamp:new Date(Date.now()+offset).toISOString(),
    event_type:type,task_id:taskId,project_id:"0123456789abcdef0123",
    ...extra
  };
}
function legacyTask(version,id,burn,offset){
  return [
    ev(version,"task_started",id,offset,{
      status:"started",profile:"balanced",complexity:"SMALL",risk:"LOW",
      remaining_pct:80,usage_source:"user",usage_cycle_id:"C1"
    }),
    ev(version,"route_selected",id,offset+1000,{work_unit:"W1",role:"standard_engineer",access:"workspace-write"}),
    ev(version,"task_finished",id,offset+2000,{
      status:"complete",remaining_pct:80-burn,usage_source:"user",usage_cycle_id:"C1",duration_ms:1000
    })
  ];
}

const events=[
  ...legacyTask("1.3.0","v13",2,-12000),
  ...legacyTask("1.4.0","v14",2.2,-9000),
  ...legacyTask("1.5.0","v15",2.1,-6000)
];
events.push(
  ev("1.5.0","task_started","v15kind",-3000,{
    status:"started",profile:"balanced",task_kind:"implementation",complexity:"SMALL",risk:"LOW",
    remaining_pct:80,usage_source:"user",usage_cycle_id:"C1"
  }),
  ev("1.5.0","route_selected","v15kind",-2000,{work_unit:"W1",role:"standard_engineer",access:"workspace-write"}),
  ev("1.5.0","task_finished","v15kind",-1000,{
    status:"complete",remaining_pct:78,usage_source:"user",usage_cycle_id:"C1",duration_ms:1000
  })
);

const tasks=reconstructTasks(events,56);
check("all legacy generations reconstruct",tasks.length===4,String(tasks.length));
const v13=tasks.find(t=>t.task_id==="v13");
const v14=tasks.find(t=>t.task_id==="v14");
const v15=tasks.find(t=>t.task_id==="v15kind");
check("v1.3 missing task kind maps unknown",v13?.task_kind==="unknown",v13?.task_kind);
check("v1.4 missing task kind maps unknown",v14?.task_kind==="unknown",v14?.task_kind);
check("v1.5 explicit task kind preserved",v15?.task_kind==="implementation",v15?.task_kind);
check("legacy measured burn preserved",tasks.filter(t=>t.measurement.measured).length===4);
check("legacy version metadata preserved",v13?.orchestrator_version==="1.3.0"&&v14?.orchestrator_version==="1.4.0");

const unknownDecision=recommend({task_kind:"unknown",complexity:"SMALL",risk:"LOW",profile:"balanced"},tasks);
check("legacy-only evidence cannot activate adaptive route",unknownDecision.active_eligible===false,JSON.stringify(unknownDecision));
check("legacy-only sparse route evidence fails closed",["insufficient_data","insufficient_baseline","no_qualified_candidate","quality_floor","risk_floor"].includes(unknownDecision.decision),unknownDecision.decision);

check("minimum supported version documented",compatibility.minimum_supported_orchestrator_version==="1.3.0");
check("telemetry schema remains compatible",compatibility.telemetry_schema_version==="1.0");
check("migration is non-destructive",compatibility.migration_policy==="non_destructive_read_compatibility");
check("rollback floor is v1.5.0",compatibility.rollback_minimum_version==="1.5.0");

const failed=checks.filter(c=>!c.ok);
for(const c of checks) console.log((c.ok?"PASS":"FAIL")+" | "+c.name+(c.detail?" | "+c.detail:""));
console.log("\nSUMMARY: "+(checks.length-failed.length)+"/"+checks.length+" compatibility checks passed");
if(failed.length) process.exit(1);
