import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const telemetry=path.join(ROOT,".agents","skills","usage-efficient-orchestrator","scripts","telemetry.mjs");
const intelligence=path.join(ROOT,".agents","skills","usage-efficient-orchestrator","scripts","usage-intelligence.mjs");
const adaptive=path.join(ROOT,".agents","skills","usage-efficient-orchestrator","scripts","adaptive-routing.mjs");
const tmp=fs.mkdtempSync(path.join(os.tmpdir(),"orchestrator-fault-"));
const dataDir=path.join(tmp,"telemetry");
fs.mkdirSync(dataDir,{recursive:true,mode:0o700});
const ledger=path.join(dataDir,"events.jsonl");
const env={...process.env,ORCHESTRATOR_DATA_DIR:dataDir};
const checks=[];
const check=(name,ok,detail="")=>checks.push({name,ok,detail});

function run(script,args,expect=0){
  const r=spawnSync(process.execPath,[script,...args],{cwd:ROOT,env,encoding:"utf8"});
  check("exit "+path.basename(script)+" "+args.join(" "),r.status===expect,"status="+r.status+" stderr="+r.stderr.trim());
  return r;
}

const start=run(telemetry,["start","--task-id","fault_good","--profile","balanced","--task-kind","implementation","--complexity","SMALL","--risk","LOW","--baseline","70","--cycle","C1"]);
run(telemetry,["finish","--task-id","fault_good","--status","complete","--remaining","68","--cycle","C1"]);

let raw=fs.readFileSync(ledger,"utf8");
raw += "{this is malformed json\n";
raw += JSON.stringify({
  schema_version:"9.9",
  orchestrator_version:"99.0.0",
  event_id:"foreign-event",
  timestamp:new Date().toISOString(),
  event_type:"task_started",
  task_id:"foreign",
  project_id:"abcdef0123456789abcd",
  profile:"balanced",task_kind:"implementation",complexity:"SMALL",risk:"LOW",remaining_pct:50
})+"\n";
raw += JSON.stringify({
  schema_version:"1.0",
  orchestrator_version:"1.3.0",
  event_id:"legacy-reset-start",
  timestamp:new Date(Date.now()-4000).toISOString(),
  event_type:"task_started",
  task_id:"legacy_reset",
  project_id:"abcdef0123456789abcd",
  profile:"balanced",complexity:"SMALL",risk:"LOW",remaining_pct:20,usage_cycle_id:"OLD"
})+"\n";
raw += JSON.stringify({
  schema_version:"1.0",
  orchestrator_version:"1.3.0",
  event_id:"legacy-reset-finish",
  timestamp:new Date(Date.now()-3000).toISOString(),
  event_type:"task_finished",
  task_id:"legacy_reset",
  project_id:"abcdef0123456789abcd",
  status:"complete",remaining_pct:100,usage_cycle_id:"OLD"
})+"\n";
raw += JSON.stringify({
  schema_version:"1.0",
  orchestrator_version:"1.4.0",
  event_id:"cycle-start",
  timestamp:new Date(Date.now()-2000).toISOString(),
  event_type:"task_started",
  task_id:"cycle_mismatch",
  project_id:"abcdef0123456789abcd",
  profile:"economy",complexity:"SMALL",risk:"LOW",remaining_pct:80,usage_cycle_id:"A"
})+"\n";
raw += JSON.stringify({
  schema_version:"1.0",
  orchestrator_version:"1.4.0",
  event_id:"cycle-finish",
  timestamp:new Date(Date.now()-1000).toISOString(),
  event_type:"task_finished",
  task_id:"cycle_mismatch",
  project_id:"abcdef0123456789abcd",
  status:"complete",remaining_pct:78,usage_cycle_id:"B"
})+"\n";
raw += JSON.stringify({
  schema_version:"1.0",
  orchestrator_version:"1.5.0",
  event_id:"incomplete-start",
  timestamp:new Date().toISOString(),
  event_type:"task_started",
  task_id:"incomplete",
  project_id:"abcdef0123456789abcd",
  profile:"balanced",task_kind:"implementation",complexity:"MEDIUM",risk:"MEDIUM"
})+"\n";
fs.writeFileSync(ledger,raw,{mode:0o600});

const report=run(telemetry,["report","--days","7","--json"]);
const parsed=JSON.parse(report.stdout);
check("malformed line does not abort report",parsed.summary.tasks_started>=4,JSON.stringify(parsed.summary));
check("foreign schema ignored",!report.stdout.includes("foreign-event")&&!report.stdout.includes("99.0.0"));
check("only valid compatible burn measured",parsed.summary.measured_tasks===1,JSON.stringify(parsed.summary));
check("reset/cycle mismatches stay unmeasured",parsed.summary.reset_or_invalid_pairs>=2,JSON.stringify(parsed.summary));

const intelligenceResult=run(intelligence,["analyze","--days","7","--json"]);
const intel=JSON.parse(intelligenceResult.stdout);
check("intelligence survives damaged ledger",intel.measurement.eligible_measured_tasks===1,JSON.stringify(intel.measurement));
check("unmeasured faults excluded",intel.measurement.excluded_unmeasured_or_invalid>=3,JSON.stringify(intel.measurement));

const adaptiveResult=run(adaptive,["recommend","--task-kind","implementation","--complexity","SMALL","--risk","LOW","--profile","balanced","--json"]);
const adapt=JSON.parse(adaptiveResult.stdout);
check("adaptive fails closed with sparse damaged history",["insufficient_data","insufficient_baseline"].includes(adapt.decision),JSON.stringify(adapt));

const badTelemetry=run(telemetry,["start","--profile","balanced","--task-kind","implementation","--complexity","SMALL","--risk","LOW","--prompt","secret"],2);
check("free-text telemetry injection rejected",badTelemetry.stderr.includes("free-text telemetry is intentionally rejected"));

const badAdaptive=run(adaptive,["recommend","--task-kind","implementation","--complexity","SMALL","--risk","LOW","--profile","balanced","--rationale","trust me"],2);
check("free-text adaptive injection rejected",badAdaptive.stderr.includes("unsupported argument --rationale"));

const ledgerText=fs.readFileSync(ledger,"utf8");
check("fault test did not add supplied free text",!ledgerText.includes("secret")&&!ledgerText.includes("trust me"));

const failed=checks.filter(c=>!c.ok);
for(const c of checks) console.log((c.ok?"PASS":"FAIL")+" | "+c.name+(c.detail?" | "+c.detail:""));
console.log("\nSUMMARY: "+(checks.length-failed.length)+"/"+checks.length+" fault-injection checks passed");
fs.rmSync(tmp,{recursive:true,force:true});
if(failed.length) process.exit(1);
