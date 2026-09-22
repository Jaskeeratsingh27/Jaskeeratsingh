import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const cli=path.join(ROOT,".agents","skills","usage-efficient-orchestrator","scripts","telemetry.mjs");
const tmp=fs.mkdtempSync(path.join(os.tmpdir(),"orchestrator-observability-"));
const env={...process.env,ORCHESTRATOR_DATA_DIR:path.join(tmp,"telemetry")};
const checks=[];
const check=(name,ok,detail="")=>checks.push({name,ok,detail});

function run(args, expect=0){
  const r=spawnSync(process.execPath,[cli,...args],{cwd:ROOT,env,encoding:"utf8"});
  check(`command exit ${args[0]} ${args.join(" ")}`,r.status===expect,`status=${r.status} stderr=${r.stderr.trim()}`);
  return r;
}

const start=run(["start","--profile","balanced","--task-kind","implementation","--complexity","MEDIUM","--risk","MEDIUM","--baseline","64","--source","user","--cycle","W1"]);
const taskId=start.stdout.trim();
check("generated task id",/^uo_[A-Za-z0-9_]+$/.test(taskId),taskId);

run(["recommendation","--task-id",taskId,"--baseline-route","standard_review","--candidate-route","scout_standard_review","--decision-mode","shadow","--decision","candidate_lower_burn","--evidence-samples","8","--estimated-savings-p90","1.2"]);
run(["route","--task-id",taskId,"--work-unit","W1","--role","cheap_reader","--model","gpt-5.6-luna","--reasoning","low","--access","read-only"]);
run(["worker","--task-id",taskId,"--work-unit","W1","--role","cheap_reader","--model","gpt-5.6-luna","--reasoning","low","--access","read-only","--status","complete","--duration-ms","1200","--files-inspected","4"]);
run(["route","--task-id",taskId,"--work-unit","W2","--role","standard_engineer","--model","gpt-5.6-terra","--reasoning","medium","--access","workspace-write"]);
run(["worker","--task-id",taskId,"--work-unit","W2","--role","standard_engineer","--status","complete","--duration-ms","2200","--files-touched","2","--tests-run","1"]);
run(["validate","--task-id",taskId,"--status","passed","--check-count","3","--failed-count","0"]);
run(["checkpoint","--task-id",taskId,"--remaining","61","--source","user","--cycle","W1"]);
run(["finish","--task-id",taskId,"--status","complete","--duration-ms","5000","--remaining","61","--source","user","--cycle","W1","--files-inspected","4","--files-touched","2","--tests-run","1"]);

const noMeasure=run(["start","--profile","economy","--complexity","SMALL","--risk","LOW"]);
const noMeasureId=noMeasure.stdout.trim();
run(["finish","--task-id",noMeasureId,"--status","complete","--duration-ms","1000"]);

const reset=run(["start","--profile","balanced","--complexity","SMALL","--risk","LOW","--baseline","20","--cycle","W2"]);
const resetId=reset.stdout.trim();
run(["finish","--task-id",resetId,"--status","complete","--remaining","100","--cycle","W2"]);

const cycle=run(["start","--profile","balanced","--complexity","SMALL","--risk","LOW","--baseline","70","--cycle","A"]);
const cycleId=cycle.stdout.trim();
run(["finish","--task-id",cycleId,"--status","complete","--remaining","68","--cycle","B"]);

const rejected=run(["checkpoint","--task-id",taskId,"--remaining","60","--note","do not store this free text"],2);
check("unknown/free-text argument rejected",rejected.stderr.includes("free-text telemetry is intentionally rejected"));

const report=run(["report","--days","7","--json"]);
const parsed=JSON.parse(report.stdout);
check("measured task count",parsed.summary.measured_tasks===1,JSON.stringify(parsed.summary));
check("measured burn is 3 points",parsed.summary.total_measured_burn_points===3,JSON.stringify(parsed.summary));
check("unmeasured tasks separated",parsed.summary.unmeasured_tasks>=3,JSON.stringify(parsed.summary));
check("reset/invalid detected",parsed.summary.reset_or_invalid_pairs>=2,JSON.stringify(parsed.summary));
check("role counts captured",parsed.by_role.cheap_reader===1 && parsed.by_role.standard_engineer===1,JSON.stringify(parsed.by_role));

const exportPath=path.join(tmp,"export.json");
run(["export","--days","7","--out",exportPath]);
const exported=JSON.parse(fs.readFileSync(exportPath,"utf8"));
const exportText=JSON.stringify(exported);
check("aggregate export omits task ids",!exportText.includes(taskId) && !("by_model" in exported));
check("aggregate export schema",exported.schema_version==="1.0" && exported.summary.total_measured_burn_points===3);

const ledger=path.join(env.ORCHESTRATOR_DATA_DIR,"events.jsonl");
const lines=fs.readFileSync(ledger,"utf8").trim().split("\n").map(JSON.parse);
check("project id hashed",lines.every(e=>/^[a-f0-9]{20}$/.test(e.project_id)));
check("orchestrator version stamped",lines.every(e=>e.orchestrator_version==="2.0.0"));
check("task kind captured",lines.some(e=>e.event_type==="task_started" && e.task_id===taskId && e.task_kind==="implementation"));
check("adaptive recommendation captured",lines.some(e=>e.event_type==="routing_recommendation" && e.task_id===taskId && e.baseline_route==="standard_review" && e.candidate_route==="scout_standard_review" && e.route_decision==="candidate_lower_burn"));
check("ledger contains no cwd",!fs.readFileSync(ledger,"utf8").includes(ROOT));
check("ledger contains no prompt/source fields",lines.every(e=>!("prompt" in e)&&!("source_code" in e)&&!("file_contents" in e)&&!("raw_tool_output" in e)));

if(process.platform!=="win32"){
  const dirMode=fs.statSync(env.ORCHESTRATOR_DATA_DIR).mode & 0o777;
  const fileMode=fs.statSync(ledger).mode & 0o777;
  check("directory permissions 0700",dirMode===0o700,dirMode.toString(8));
  check("ledger permissions 0600",fileMode===0o600,fileMode.toString(8));
}

// Insert an old valid event directly to exercise retention pruning.
const old={...lines[0],event_id:"old-event-0001",timestamp:"2020-01-01T00:00:00.000Z",task_id:"old_task"};
fs.appendFileSync(ledger,JSON.stringify(old)+"\n");
const prune=run(["prune","--days","90"]);
const pruneResult=JSON.parse(prune.stdout);
check("prune removes expired event",pruneResult.removed>=1,JSON.stringify(pruneResult));

const failed=checks.filter(c=>!c.ok);
for(const c of checks) console.log(`${c.ok?"PASS":"FAIL"} | ${c.name}${c.detail?" | "+c.detail:""}`);
console.log(`\nSUMMARY: ${checks.length-failed.length}/${checks.length} observability checks passed`);
fs.rmSync(tmp,{recursive:true,force:true});
if(failed.length) process.exit(1);
