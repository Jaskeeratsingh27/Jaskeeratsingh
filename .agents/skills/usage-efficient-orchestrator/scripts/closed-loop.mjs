import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import { readEvents, emit, projectId } from "./telemetry.mjs";
import { reconstructTasks, finalPrediction } from "./usage-intelligence.mjs";
import { recommend, baselineRoute } from "./adaptive-routing.mjs";

const HERE=path.dirname(fileURLToPath(import.meta.url));
const ROOT=path.resolve(HERE,"..");
const CONFIG=JSON.parse(fs.readFileSync(path.join(ROOT,"config","closed-loop.json"),"utf8"));
const ROUTES=JSON.parse(fs.readFileSync(path.join(ROOT,"config","route-templates.json"),"utf8"));
const MANIFEST=JSON.parse(fs.readFileSync(path.join(ROOT,"manifest.json"),"utf8"));
const CAP_TEXT=fs.readFileSync(path.join(ROOT,"config","capabilities.toml"),"utf8");
const BUDGET_TEXT=fs.readFileSync(path.join(ROOT,"config","budget-profiles.toml"),"utf8");

const VALID={
  task_kind:new Set(["discovery","implementation","review","architecture","mixed"]),
  complexity:new Set(["MICRO","SMALL","MEDIUM","LARGE"]),
  risk:new Set(["LOW","MEDIUM","HIGH","CRITICAL"]),
  profile:new Set(["economy","balanced","quality-critical"]),
  source:new Set(["user","status"]),
  status:new Set(["complete","blocked","failed","cancelled","stopped"]),
  failure_class:new Set(["none","information","tooling_environment","test_fixture","implementation","architecture","permission_security"]),
  validation_status:new Set(["passed","failed"])
};

const ARGS={
  preflight:new Set(["task-id","task-kind","complexity","risk","profile","baseline","source","cycle","json"]),
  checkpoint:new Set(["task-id","remaining","source","cycle","json"]),
  status:new Set(["task-id","json"]),
  finalize:new Set(["task-id","status","failure-class","duration-ms","remaining","source","cycle","files-inspected","files-touched","tests-run","retries","validation-status","check-count","failed-count","json"])
};

function die(message){ console.error("ERROR: "+message); process.exit(2); }

function parseArgs(argv){
  const out={_:[]};
  for(let i=0;i<argv.length;i++){
    const t=argv[i];
    if(!t.startsWith("--")){ out._.push(t); continue; }
    const key=t.slice(2);
    const next=argv[i+1];
    if(next && !next.startsWith("--")){ out[key]=next; i++; }
    else out[key]=true;
  }
  return out;
}

function ensureAllowed(command,args){
  const allowed=ARGS[command];
  if(!allowed) die("command required: preflight|checkpoint|status|finalize");
  for(const key of Object.keys(args)){
    if(key==="_") continue;
    if(!allowed.has(key)) die("unsupported argument --"+key+"; closed-loop metadata is intentionally bounded");
  }
}

function required(args,key){
  const v=args[key];
  if(v===undefined||v===true||v==="") die("--"+key+" is required");
  return String(v);
}
function enumArg(args,key,set,requiredFlag=false){
  if(args[key]===undefined){
    if(requiredFlag) die("--"+key+" is required");
    return undefined;
  }
  const v=String(args[key]);
  if(!set.has(v)) die("invalid --"+key+": "+v);
  return v;
}
function intArg(args,key){
  if(args[key]===undefined) return undefined;
  const n=Number(args[key]);
  if(!Number.isInteger(n)||n<0) die("--"+key+" must be a non-negative integer");
  return n;
}
function pctArg(args,key){
  if(args[key]===undefined) return undefined;
  const n=Number(args[key]);
  if(!Number.isFinite(n)||n<0||n>100) die("--"+key+" must be between 0 and 100");
  return Number(n.toFixed(4));
}
function safeId(v){
  if(!/^[A-Za-z0-9._:-]{1,80}$/.test(v)) die("invalid task id");
  return v;
}
function cycleArg(args){
  if(args.cycle===undefined) return undefined;
  const v=String(args.cycle);
  if(!/^[A-Za-z0-9._:-]{1,80}$/.test(v)) die("invalid --cycle");
  return v;
}
function newTaskId(){
  return "uo2_"+Date.now().toString(36)+"_"+crypto.randomBytes(4).toString("hex");
}

function parseScalar(raw){
  const v=raw.trim();
  if((v.startsWith('"')&&v.endsWith('"'))||(v.startsWith("'")&&v.endsWith("'"))) return v.slice(1,-1);
  if(v==="true") return true;
  if(v==="false") return false;
  const n=Number(v);
  if(Number.isFinite(n)) return n;
  return v;
}
function parseTomlSections(text){
  const sections={};
  let current=null;
  for(const rawLine of text.split(/\r?\n/)){
    const line=rawLine.trim();
    if(!line||line.startsWith("#")) continue;
    const sm=line.match(/^\[([^\]]+)\]$/);
    if(sm){ current=sm[1]; sections[current]={}; continue; }
    if(!current) continue;
    const m=line.match(/^([A-Za-z0-9_.-]+)\s*=\s*(.+)$/);
    if(!m) continue;
    sections[current][m[1]]=parseScalar(m[2]);
  }
  return sections;
}
const CAP_SECTIONS=parseTomlSections(CAP_TEXT);
const BUDGET_SECTIONS=parseTomlSections(BUDGET_TEXT);
const CAPS=Object.fromEntries(Object.entries(CAP_SECTIONS).filter(([k])=>k.startsWith("roles.")).map(([k,v])=>[k.slice(6),v]));
const BUDGETS=Object.fromEntries(Object.entries(BUDGET_SECTIONS).filter(([k])=>k.startsWith("profiles.")).map(([k,v])=>[k.slice(9),v]));

function taskEvents(id){ return readEvents().filter(e=>e.task_id===id).sort((a,b)=>Date.parse(a.timestamp)-Date.parse(b.timestamp)); }
function startEvent(id){
  const e=taskEvents(id).find(x=>x.event_type==="task_started");
  if(!e) die("task not found or missing task_started: "+id);
  return e;
}
function preflightEvent(id){
  return taskEvents(id).find(x=>x.event_type==="preflight_decision")||null;
}
function budgetFor(profile){
  const b=BUDGETS[profile];
  if(!b) die("budget profile not configured: "+profile);
  return b;
}
function capabilityFor(role){
  const c=CAPS[role];
  if(!c) die("capability role not configured: "+role);
  return c;
}
function delegationFor(routeId){
  const route=ROUTES.routes[routeId];
  if(!route) die("unknown route: "+routeId);
  return route.roles.map((role,index)=>{
    const c=capabilityFor(role);
    return {
      work_unit:"W"+(index+1),
      role,
      model:c.model,
      reasoning:c.reasoning,
      access:c.write_allowed?"workspace-write":"read-only",
      purpose:c.purpose
    };
  });
}
function usageAction(gate){
  if(gate==="plan_only") return "plan_only";
  if(gate==="split_required") return "split_required";
  if(gate==="approval_required") return "approval_required";
  if(gate==="proxy_only"||gate==="proceed_with_proxy_guards") return "execute_with_proxy_guards";
  return "execute";
}
function compact(obj){ return Object.fromEntries(Object.entries(obj).filter(([,v])=>v!==undefined&&v!==null)); }

function proxyState(id){
  const events=taskEvents(id);
  const start=events.find(e=>e.event_type==="task_started");
  if(!start) die("task not found: "+id);
  const budget=budgetFor(start.profile||"balanced");
  const routes=events.filter(e=>e.event_type==="route_selected");
  const workers=events.filter(e=>e.event_type==="worker_finished");
  const validations=events.filter(e=>e.event_type==="validation");

  const counts={
    agent_spawns:routes.length,
    broad_discovery_passes:routes.filter(e=>e.role==="cheap_reader").length,
    write_phases:routes.filter(e=>CAPS[e.role]?.write_allowed===true).length,
    failed_implementation_attempts:workers.filter(e=>["standard_engineer","senior_specialist"].includes(e.role)&&e.status==="failed").length,
    test_cycles:validations.length,
    senior_escalations:routes.filter(e=>e.role==="senior_specialist").length
  };
  const mapping={
    agent_spawns:"max_agent_spawns",
    broad_discovery_passes:"max_broad_discovery_passes",
    write_phases:"max_write_phases",
    failed_implementation_attempts:"max_failed_implementation_attempts",
    test_cycles:"max_test_cycles",
    senior_escalations:"max_senior_escalations"
  };
  const limits={};
  const blocked_next_actions=[];
  const exceeded=[];
  for(const [counter,key] of Object.entries(mapping)){
    const max=Number(budget[key]);
    const current=counts[counter];
    const remaining=Math.max(0,max-current);
    limits[counter]={current,max,remaining};
    if(current>=max) blocked_next_actions.push(counter);
    if(current>max) exceeded.push(counter);
  }
  return {
    task_id:id,
    profile:start.profile,
    counts,
    limits,
    blocked_next_actions,
    exceeded,
    control_action:exceeded.length?"stop_proxy_limit":"execute_with_proxy_guards"
  };
}

function preflight(args){
  const query={
    task_kind:enumArg(args,"task-kind",VALID.task_kind,true),
    complexity:enumArg(args,"complexity",VALID.complexity,true),
    risk:enumArg(args,"risk",VALID.risk,true),
    profile:enumArg(args,"profile",VALID.profile,false)||"balanced"
  };
  const id=args["task-id"]===undefined?newTaskId():safeId(String(args["task-id"]));
  if(taskEvents(id).length) die("task id already exists: "+id);
  const pid=projectId({});
  const baseline=pctArg(args,"baseline");
  const source=baseline!==undefined?(enumArg(args,"source",VALID.source,false)||"user"):undefined;
  const cycle=cycleArg(args);

  emit("task_started",id,pid,compact({
    status:"started",
    profile:query.profile,
    task_kind:query.task_kind,
    complexity:query.complexity,
    risk:query.risk,
    remaining_pct:baseline,
    usage_source:source,
    usage_cycle_id:cycle
  }));

  const tasks=reconstructTasks(readEvents(),56);
  const usage=finalPrediction({complexity:query.complexity,risk:query.risk,profile:query.profile},tasks,baseline);
  const adaptive=recommend(query,tasks);
  const baselineId=adaptive.baseline_route||baselineRoute(query);
  const route=ROUTES.routes[baselineId];
  if(!route) die("baseline route unresolved");

  let controlAction=usageAction(usage.gate);
  if(route.plan_only===true) controlAction="plan_only";

  const budget=budgetFor(query.profile);
  const delegation=delegationFor(baselineId);

  emit("routing_recommendation",id,pid,compact({
    baseline_route:baselineId,
    candidate_route:adaptive.candidate_route||undefined,
    decision_mode:"shadow",
    route_decision:adaptive.decision,
    evidence_samples:adaptive.evidence_samples,
    estimated_savings_p90:adaptive.estimated_p90_savings_points
  }));

  emit("preflight_decision",id,pid,compact({
    loop_mode:CONFIG.mode,
    control_action:controlAction,
    selected_route:baselineId,
    baseline_route:baselineId,
    candidate_route:adaptive.candidate_route||undefined,
    usage_gate:usage.gate,
    predicted_typical_points:usage.estimate?.typical_points,
    predicted_upper_points:usage.estimate?.upper_points,
    prediction_confidence:usage.estimate?.confidence||"none",
    calibration_status:usage.calibration?.status||"insufficient",
    target_points:Number(budget.target_weekly_percentage_points),
    ceiling_points:Number(budget.ceiling_weekly_percentage_points)
  }));

  return {
    schema_version:CONFIG.schema_version,
    orchestrator_version:MANIFEST.version,
    task_id:id,
    mode:CONFIG.mode,
    query,
    control_action:controlAction,
    execution_route:baselineId,
    delegation_plan:delegation,
    usage,
    adaptive,
    proxy_limits:{
      max_agent_spawns:budget.max_agent_spawns,
      max_broad_discovery_passes:budget.max_broad_discovery_passes,
      max_write_phases:budget.max_write_phases,
      max_failed_implementation_attempts:budget.max_failed_implementation_attempts,
      max_test_cycles:budget.max_test_cycles,
      max_full_suite_runs:budget.max_full_suite_runs,
      max_senior_escalations:budget.max_senior_escalations
    }
  };
}

function checkpoint(args){
  const id=safeId(required(args,"task-id"));
  const remaining=pctArg(args,"remaining");
  if(remaining===undefined) die("--remaining is required");
  const source=enumArg(args,"source",VALID.source,false)||"user";
  const cycle=cycleArg(args);
  const start=startEvent(id);
  const pid=projectId({});

  emit("usage_checkpoint",id,pid,compact({
    remaining_pct:remaining,
    usage_source:source,
    usage_cycle_id:cycle
  }));

  const budget=budgetFor(start.profile||"balanced");
  const baseline=start.remaining_pct;
  const startCycle=start.usage_cycle_id;
  const compatible=typeof baseline==="number" && (!startCycle||!cycle||startCycle===cycle) && remaining<=baseline;

  let measured=false, burn=null, action="execute_with_proxy_guards", reason="No compatible authoritative baseline is available.";
  if(compatible){
    measured=true;
    burn=Number((baseline-remaining).toFixed(4));
    const target=Number(budget.target_weekly_percentage_points);
    const ceiling=Number(budget.ceiling_weekly_percentage_points);
    if(burn>=ceiling){
      action="stop_ceiling";
      reason="Measured burn reached or exceeded the absolute profile ceiling.";
    }else if(burn>=target){
      action="stop_target";
      reason="Measured burn reached or exceeded the profile target.";
    }else{
      action="execute";
      reason="Measured burn remains below the profile target.";
    }

    if(action==="stop_target"||action==="stop_ceiling"){
      const already=taskEvents(id).some(e=>e.event_type==="budget_stop"&&["budget_target","budget_ceiling"].includes(e.stop_reason));
      if(!already){
        emit("budget_stop",id,pid,{
          status:"stopped",
          stop_reason:action==="stop_ceiling"?"budget_ceiling":"budget_target",
          failure_class:"none"
        });
      }
    }
  }

  return {
    schema_version:CONFIG.schema_version,
    orchestrator_version:MANIFEST.version,
    task_id:id,
    measured,
    baseline_remaining_pct:typeof baseline==="number"?baseline:null,
    current_remaining_pct:remaining,
    measured_burn_points:burn,
    target_points:Number(budget.target_weekly_percentage_points),
    ceiling_points:Number(budget.ceiling_weekly_percentage_points),
    control_action:action,
    reason,
    proxy:proxyState(id)
  };
}

function status(args){
  const id=safeId(required(args,"task-id"));
  const start=startEvent(id);
  const pre=preflightEvent(id);
  const proxy=proxyState(id);
  const checkpoints=taskEvents(id).filter(e=>e.event_type==="usage_checkpoint");
  const last=checkpoints[checkpoints.length-1]||null;
  return {
    schema_version:CONFIG.schema_version,
    orchestrator_version:MANIFEST.version,
    task_id:id,
    profile:start.profile,
    task_kind:start.task_kind,
    complexity:start.complexity,
    risk:start.risk,
    preflight_control_action:pre?.control_action||null,
    selected_route:pre?.selected_route||null,
    latest_remaining_pct:last?.remaining_pct??start.remaining_pct??null,
    proxy
  };
}

function finalize(args){
  const id=safeId(required(args,"task-id"));
  const eventsBefore=taskEvents(id);
  const start=eventsBefore.find(e=>e.event_type==="task_started");
  if(!start) die("task not found: "+id);
  if(eventsBefore.some(e=>e.event_type==="task_finished")) die("task already finalized: "+id);

  const statusValue=enumArg(args,"status",VALID.status,true);
  const failureClass=enumArg(args,"failure-class",VALID.failure_class,false)||"none";
  const remaining=pctArg(args,"remaining");
  const source=remaining!==undefined?(enumArg(args,"source",VALID.source,false)||"user"):undefined;
  const cycle=cycleArg(args);
  const validationStatus=enumArg(args,"validation-status",VALID.validation_status,false);
  const pid=projectId({});

  if(validationStatus){
    emit("validation",id,pid,{
      status:validationStatus,
      check_count:intArg(args,"check-count")??1,
      failed_count:intArg(args,"failed-count")??(validationStatus==="failed"?1:0)
    });
  }

  emit("task_finished",id,pid,compact({
    status:statusValue,
    failure_class:failureClass,
    duration_ms:intArg(args,"duration-ms"),
    remaining_pct:remaining,
    usage_source:source,
    usage_cycle_id:cycle,
    files_inspected:intArg(args,"files-inspected"),
    files_touched:intArg(args,"files-touched"),
    tests_run:intArg(args,"tests-run"),
    retries:intArg(args,"retries")
  }));

  const tasks=reconstructTasks(readEvents(),56);
  const task=tasks.find(t=>t.task_id===id);
  if(!task) die("unable to reconstruct finalized task");
  const pre=preflightEvent(id);
  const budget=budgetFor(start.profile||"balanced");
  const target=Number(budget.target_weekly_percentage_points);
  const ceiling=Number(budget.ceiling_weekly_percentage_points);

  let budgetOutcome="unmeasured";
  if(task.measurement?.measured){
    if(task.measurement.burn>ceiling) budgetOutcome="above_ceiling";
    else if(task.measurement.burn>target) budgetOutcome="above_target";
    else budgetOutcome="within_target";
  }

  const validations=taskEvents(id).filter(e=>e.event_type==="validation");
  const hasValidationFailure=validations.some(v=>v.status==="failed");
  let qualityOutcome="unknown";
  if(statusValue==="complete"&&!hasValidationFailure) qualityOutcome="passed";
  else if(statusValue==="failed"||hasValidationFailure) qualityOutcome="failed";
  else if(statusValue==="blocked") qualityOutcome="blocked";
  else if(statusValue==="stopped") qualityOutcome="stopped";
  else if(statusValue==="cancelled") qualityOutcome="cancelled";

  const typical=pre?.predicted_typical_points;
  const actual=task.measurement?.measured?task.measurement.burn:null;
  const error=typeof typical==="number"&&typeof actual==="number"
    ? Number(Math.abs(actual-typical).toFixed(4))
    : null;

  let learningStatus="unmeasured";
  if(task.measurement?.measured) learningStatus="measured_eligible";
  else if(task.measurement?.reason&&task.measurement.reason!=="insufficient_checkpoints") learningStatus="invalid";

  const learningEligible=learningStatus==="measured_eligible";
  emit("post_task_evaluation",id,pid,compact({
    loop_mode:CONFIG.mode,
    actual_burn_points:actual,
    prediction_abs_error_points:error,
    target_points:target,
    ceiling_points:ceiling,
    budget_outcome:budgetOutcome,
    quality_outcome:qualityOutcome,
    learning_status:learningStatus,
    learning_eligible:learningEligible,
    selected_route:pre?.selected_route,
    predicted_typical_points:typical,
    predicted_upper_points:pre?.predicted_upper_points
  }));

  return {
    schema_version:CONFIG.schema_version,
    orchestrator_version:MANIFEST.version,
    task_id:id,
    status:statusValue,
    measurement:task.measurement,
    budget_outcome:budgetOutcome,
    quality_outcome:qualityOutcome,
    prediction:{
      typical_points:typical??null,
      upper_points:pre?.predicted_upper_points??null,
      absolute_error_points:error
    },
    learning:{
      status:learningStatus,
      eligible:learningEligible,
      effect:"New structured task evidence is available to future usage-intelligence and shadow-routing runs."
    },
    proxy:proxyState(id)
  };
}

function print(value,json){
  if(json) return console.log(JSON.stringify(value,null,2));
  if(value.task_id) console.log("Task: "+value.task_id);
  if(value.control_action) console.log("Control action: "+value.control_action);
  if(value.execution_route) console.log("Execution route: "+value.execution_route);
  if(value.budget_outcome) console.log("Budget outcome: "+value.budget_outcome);
  if(value.quality_outcome) console.log("Quality outcome: "+value.quality_outcome);
}

function main(){
  const args=parseArgs(process.argv.slice(2));
  const command=args._[0];
  ensureAllowed(command,args);
  let result;
  if(command==="preflight") result=preflight(args);
  else if(command==="checkpoint") result=checkpoint(args);
  else if(command==="status") result=status(args);
  else if(command==="finalize") result=finalize(args);
  else die("unsupported closed-loop command");
  print(result,Boolean(args.json));
}

if(process.argv[1]&&path.resolve(process.argv[1])===path.resolve(fileURLToPath(import.meta.url))) main();

export { preflight, checkpoint, status, finalize, proxyState, delegationFor };
