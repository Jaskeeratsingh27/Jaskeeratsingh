import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { readEvents } from "./telemetry.mjs";
import { reconstructTasks, quantile, median, backtest, rawPrediction } from "./usage-intelligence.mjs";

const HERE=path.dirname(fileURLToPath(import.meta.url));
const CONFIG=JSON.parse(fs.readFileSync(path.join(HERE,"..","config","adaptive-routing.json"),"utf8"));
const ROUTES=JSON.parse(fs.readFileSync(path.join(HERE,"..","config","route-templates.json"),"utf8"));
const APPROVALS=JSON.parse(fs.readFileSync(path.join(HERE,"..","config","adaptive-routing-approvals.json"),"utf8"));
const MANIFEST=JSON.parse(fs.readFileSync(path.join(HERE,"..","manifest.json"),"utf8"));

const VALID={
  task_kind:new Set(["discovery","implementation","review","architecture","mixed","unknown"]),
  complexity:new Set(["MICRO","SMALL","MEDIUM","LARGE"]),
  risk:new Set(["LOW","MEDIUM","HIGH","CRITICAL"]),
  profile:new Set(["economy","balanced","quality-critical"])
};
const ALLOWED={
  recommend:new Set(["task-kind","complexity","risk","profile","days","json"]),
  analyze:new Set(["days","json"]),
  shadow:new Set(["days","json"]),
  export:new Set(["days","out"])
};

function die(message){ console.error("ERROR: "+message); process.exit(2); }
function parseArgs(argv){
  const out={_:[]};
  for(let i=0;i<argv.length;i++){
    const token=argv[i];
    if(!token.startsWith("--")){ out._.push(token); continue; }
    const key=token.slice(2), next=argv[i+1];
    if(next && !next.startsWith("--")){ out[key]=next; i++; } else out[key]=true;
  }
  return out;
}
function ensureAllowed(command,args){
  const allowed=ALLOWED[command];
  if(!allowed) die("command required: recommend|analyze|shadow|export");
  for(const key of Object.keys(args)){
    if(key==="_") continue;
    if(!allowed.has(key)) die("unsupported argument --"+key);
  }
}
function requiredEnum(args,key,set){
  const value=args[key];
  if(typeof value!=="string" || !set.has(value)) die("invalid or missing --"+key);
  return value;
}
function daysArg(args){ const n=args.days===undefined?CONFIG.history_days:Number(args.days); if(!Number.isInteger(n)||n<1) die("--days must be a positive integer"); return n; }
function signatureForRoute(routeId){ return ROUTES.routes[routeId]?.roles?.join(">") || null; }
function routeIdForSignature(signature){
  for(const [id,route] of Object.entries(ROUTES.routes)){
    if(route.roles.join(">")===signature) return id;
  }
  return null;
}
function baselineRoute(query){
  for(const rule of ROUTES.baseline_rules){
    const fields=["task_kind","complexity","risk","profile"];
    if(fields.every(f=>rule[f]===undefined || rule[f]===query[f])) return rule.route;
  }
  return null;
}
function routeAllowed(routeId,query){
  const route=ROUTES.routes[routeId];
  if(!route) return {allowed:false,reason:"unknown_route"};
  if(route.initial_candidate===false || route.escalation_only) return {allowed:false,reason:"escalation_only"};
  if(query.task_kind!=="unknown" && Array.isArray(route.task_kinds) && !route.task_kinds.includes(query.task_kind)) return {allowed:false,reason:"task_kind"};
  if(CONFIG.safety.senior_specialist_never_initial_candidate && route.roles.includes("senior_specialist")) return {allowed:false,reason:"senior_initial"};
  if(CONFIG.safety.high_risk_requires_reviewer && query.risk==="HIGH" && !route.roles.includes("reviewer")) return {allowed:false,reason:"high_risk_review"};
  if(query.risk==="CRITICAL" || query.complexity==="LARGE") {
    if(!route.plan_only) return {allowed:false,reason:"plan_only_floor"};
  }
  return {allowed:true};
}
function outcomeStats(tasks){
  const completed=tasks.filter(t=>t.outcome==="complete").length;
  const failed=tasks.filter(t=>["failed","blocked","stopped","cancelled"].includes(t.outcome)).length;
  const successRate=tasks.length?completed/tasks.length:0;
  const validationObserved=tasks.filter(t=>(t.validation_passes||0)+(t.validation_failures||0)>0);
  const validationPassed=validationObserved.filter(t=>(t.validation_failures||0)===0 && (t.validation_passes||0)>0).length;
  const validationPassRate=validationObserved.length?validationPassed/validationObserved.length:null;
  return {
    tasks:tasks.length,
    complete:completed,
    failed,
    success_rate:Number(successRate.toFixed(4)),
    validation_observations:validationObserved.length,
    validation_pass_rate:validationPassRate===null?null:Number(validationPassRate.toFixed(4))
  };
}
function routeStats(tasks,routeId){
  const signature=signatureForRoute(routeId);
  const items=tasks.filter(t=>t.route_signature===signature);
  const measured=items.filter(t=>t.measurement.measured);
  const burns=measured.map(t=>t.measurement.burn);
  const durations=items.map(t=>t.duration_ms).filter(Number.isFinite);
  return {
    route:routeId,
    signature,
    ...outcomeStats(items),
    measured_tasks:measured.length,
    p50_burn:burns.length?median(burns):null,
    p90_burn:burns.length?quantile(burns,0.9):null,
    median_duration_ms:durations.length?median(durations):null
  };
}
function cohortMatches(task,query,fields){ return fields.every(f=>task[f]===query[f]); }
function selectComparisonCohort(tasks,query){
  const finished=tasks.filter(t=>t.outcome!=="unfinished");
  for(const level of CONFIG.candidate_hierarchy){
    const cohort=finished.filter(t=>cohortMatches(t,query,level.fields));
    const routeIds=[...new Set(cohort.map(t=>routeIdForSignature(t.route_signature)).filter(Boolean))];
    const qualifiedRouteCount=routeIds.filter(id=>{
      const s=routeStats(cohort,id);
      return s.tasks>=level.min_tasks_per_route && s.measured_tasks>=level.min_measured_per_route;
    }).length;
    if(qualifiedRouteCount>=1){
      return {basis:level.name,fields:level.fields,min_tasks_per_route:level.min_tasks_per_route,min_measured_per_route:level.min_measured_per_route,cohort};
    }
  }
  return null;
}
function qualityQualified(stats,baseline){
  const q=CONFIG.quality_floor;
  if(stats.success_rate<q.minimum_success_rate) return {ok:false,reason:"success_floor"};
  if(stats.validation_pass_rate!==null && stats.validation_pass_rate<q.minimum_validation_pass_rate) return {ok:false,reason:"validation_floor"};
  if(baseline){
    if(stats.success_rate < baseline.success_rate-q.maximum_success_rate_drop) return {ok:false,reason:"success_regression"};
    if(stats.validation_pass_rate!==null && baseline.validation_pass_rate!==null &&
       stats.validation_pass_rate < baseline.validation_pass_rate-q.maximum_validation_pass_rate_drop) return {ok:false,reason:"validation_regression"};
  }
  return {ok:true};
}
function efficiencyQualified(candidate,baseline){
  if(candidate.p90_burn===null || baseline.p90_burn===null) return {ok:false,reason:"missing_burn"};
  const absolute=baseline.p90_burn-candidate.p90_burn;
  const relative=absolute/Math.max(baseline.p90_burn,0.01);
  const ok=absolute>=CONFIG.efficiency.minimum_absolute_p90_improvement_points &&
    relative>=CONFIG.efficiency.minimum_relative_p90_improvement;
  return {ok,absolute:Number(absolute.toFixed(4)),relative:Number(relative.toFixed(4))};
}
function approvalKey(query,basis,route){
  return [query.task_kind,query.complexity,query.risk,query.profile,basis,route].join("|");
}
function hasApproval(query,basis,route){
  const key=approvalKey(query,basis,route);
  return APPROVALS.approvals.some(a=>a.key===key && a.route===route && a.approved===true);
}
function chooseBest(candidates){
  return [...candidates].sort((a,b)=>{
    if(a.stats.p90_burn!==b.stats.p90_burn) return a.stats.p90_burn-b.stats.p90_burn;
    if(a.stats.p50_burn!==b.stats.p50_burn) return a.stats.p50_burn-b.stats.p50_burn;
    return (a.stats.median_duration_ms??Infinity)-(b.stats.median_duration_ms??Infinity);
  })[0] || null;
}
function recommend(query,tasks){
  const baselineId=baselineRoute(query);
  const baselineSignature=signatureForRoute(baselineId);
  const usage=rawPrediction({complexity:query.complexity,risk:query.risk,profile:query.profile},tasks);
  const calibration=backtest(tasks);

  if(query.risk==="CRITICAL" || query.complexity==="LARGE"){
    return {
      schema_version:CONFIG.schema_version,orchestrator_version:MANIFEST.version,mode:CONFIG.mode,
      query,baseline_route:baselineId,baseline_signature:baselineSignature,
      decision:"risk_floor",candidate_route:null,active_eligible:false,
      reason:"CRITICAL/LARGE work remains plan-only and is not adaptively downgraded."
    };
  }

  const selected=selectComparisonCohort(tasks,query);
  if(!selected){
    return {
      schema_version:CONFIG.schema_version,orchestrator_version:MANIFEST.version,mode:CONFIG.mode,
      query,baseline_route:baselineId,baseline_signature:baselineSignature,
      decision:"insufficient_data",candidate_route:null,active_eligible:false,
      reason:"No comparison cohort has enough route-level measured evidence."
    };
  }

  const baseline=routeStats(selected.cohort,baselineId);
  if(baseline.tasks<selected.min_tasks_per_route || baseline.measured_tasks<selected.min_measured_per_route || baseline.p90_burn===null){
    return {
      schema_version:CONFIG.schema_version,orchestrator_version:MANIFEST.version,mode:CONFIG.mode,
      query,basis:selected.basis,baseline_route:baselineId,baseline,
      decision:"insufficient_baseline",candidate_route:null,active_eligible:false,
      reason:"The canonical baseline route lacks enough measured evidence for a safe comparison."
    };
  }

  if(CONFIG.stability.suppress_on_drift && usage.status==="estimated" && usage.drift?.detected){
    return {
      schema_version:CONFIG.schema_version,orchestrator_version:MANIFEST.version,mode:CONFIG.mode,
      query,basis:selected.basis,baseline_route:baselineId,baseline,
      decision:"drift_suppressed",candidate_route:null,active_eligible:false,
      usage_drift:usage.drift,
      reason:"Usage history is drifting; adaptation is suppressed until the cohort stabilizes."
    };
  }

  const candidates=[];
  const rejections=[];
  for(const routeId of Object.keys(ROUTES.routes)){
    if(routeId===baselineId) continue;
    const allowed=routeAllowed(routeId,query);
    if(!allowed.allowed){ rejections.push({route:routeId,reason:allowed.reason}); continue; }
    const stats=routeStats(selected.cohort,routeId);
    if(stats.tasks<selected.min_tasks_per_route || stats.measured_tasks<selected.min_measured_per_route){
      rejections.push({route:routeId,reason:"insufficient_samples"}); continue;
    }
    const quality=qualityQualified(stats,baseline);
    if(!quality.ok){ rejections.push({route:routeId,reason:quality.reason}); continue; }
    const efficiency=efficiencyQualified(stats,baseline);
    if(!efficiency.ok){ rejections.push({route:routeId,reason:efficiency.reason}); continue; }
    candidates.push({route:routeId,stats,quality,efficiency});
  }

  const best=chooseBest(candidates);
  if(!best){
    const hasQualityReject=rejections.some(r=>["success_floor","validation_floor","success_regression","validation_regression"].includes(r.reason));
    const hasRiskReject=rejections.some(r=>["high_risk_review","plan_only_floor","senior_initial","escalation_only"].includes(r.reason));
    return {
      schema_version:CONFIG.schema_version,orchestrator_version:MANIFEST.version,mode:CONFIG.mode,
      query,basis:selected.basis,baseline_route:baselineId,baseline,
      decision:hasQualityReject?"quality_floor":hasRiskReject?"risk_floor":"no_qualified_candidate",
      candidate_route:null,active_eligible:false,rejections,
      reason:"No cheaper route cleared all evidence, quality, risk, and efficiency gates."
    };
  }

  const approved=hasApproval(query,selected.basis,best.route);
  const calibrationOk=calibration.status==="acceptable";
  const qualityCritical=query.profile==="quality-critical";
  const activeEligible=CONFIG.mode==="active" && calibrationOk && approved &&
    !(qualityCritical && CONFIG.safety.quality_critical_active_change_requires_user_approval && !approved);

  let decision="candidate_lower_burn";
  if(CONFIG.mode==="active" && !approved) decision="manual_approval_required";
  else if(CONFIG.mode==="active" && CONFIG.stability.require_acceptable_usage_calibration_for_active && !calibrationOk) decision="calibration_suppressed";

  return {
    schema_version:CONFIG.schema_version,
    orchestrator_version:MANIFEST.version,
    mode:CONFIG.mode,
    query,
    basis:selected.basis,
    cohort_tasks:selected.cohort.length,
    baseline_route:baselineId,
    baseline,
    candidate_route:best.route,
    candidate:best.stats,
    estimated_p90_savings_points:best.efficiency.absolute,
    estimated_p90_savings_ratio:best.efficiency.relative,
    decision,
    active_eligible:activeEligible,
    canonical_approval:approved,
    calibration,
    evidence_samples:Math.min(baseline.measured_tasks,best.stats.measured_tasks),
    rejections,
    caveat:"Historical route comparisons are observational and do not prove causal superiority."
  };
}
function classKey(t){ return [t.task_kind,t.complexity,t.risk,t.profile].join("|"); }
function shadowReport(tasks){
  const classes=new Map();
  for(const t of tasks){
    if(t.task_kind==="unknown" || !t.complexity || !t.risk || !t.profile) continue;
    const key=classKey(t);
    if(!classes.has(key)) classes.set(key,{task_kind:t.task_kind,complexity:t.complexity,risk:t.risk,profile:t.profile});
  }
  const decisions=[];
  for(const query of classes.values()) decisions.push(recommend(query,tasks));
  const recommended=decisions.filter(d=>d.candidate_route).length;
  return {
    schema_version:CONFIG.schema_version,orchestrator_version:MANIFEST.version,mode:CONFIG.mode,
    generated_at:new Date().toISOString(),
    classes_evaluated:decisions.length,
    candidate_recommendations:recommended,
    decisions
  };
}
function analysis(tasks){
  const byRoute={};
  for(const [id] of Object.entries(ROUTES.routes)){
    const stats=routeStats(tasks,id);
    if(stats.tasks>0) byRoute[id]=stats;
  }
  return {
    schema_version:CONFIG.schema_version,orchestrator_version:MANIFEST.version,
    generated_at:new Date().toISOString(),mode:CONFIG.mode,
    total_tasks:tasks.length,
    known_task_kind_tasks:tasks.filter(t=>t.task_kind!=="unknown").length,
    by_route:byRoute,
    shadow:shadowReport(tasks)
  };
}
function privateExport(report){
  return {
    schema_version:report.schema_version,
    generated_at:report.generated_at,
    mode:report.mode,
    total_tasks:report.total_tasks,
    known_task_kind_tasks:report.known_task_kind_tasks,
    by_route:report.by_route,
    shadow_summary:{
      classes_evaluated:report.shadow.classes_evaluated,
      candidate_recommendations:report.shadow.candidate_recommendations,
      decisions:report.shadow.decisions.map(d=>({
        query:d.query,basis:d.basis??null,baseline_route:d.baseline_route,
        candidate_route:d.candidate_route,decision:d.decision,
        estimated_p90_savings_points:d.estimated_p90_savings_points??null,
        active_eligible:d.active_eligible
      }))
    }
  };
}
function printResult(value,json){
  if(json) return console.log(JSON.stringify(value,null,2));
  if(value.query){
    console.log("Adaptive routing v"+value.orchestrator_version+" ["+value.mode+"]");
    console.log("Decision: "+value.decision);
    console.log("Baseline: "+value.baseline_route);
    console.log("Candidate: "+(value.candidate_route||"none"));
    if(value.estimated_p90_savings_points!==undefined) console.log("Estimated historical p90 savings: "+value.estimated_p90_savings_points.toFixed(2)+" points");
    console.log("Active eligible: "+Boolean(value.active_eligible));
    console.log(value.reason||value.caveat||"");
    return;
  }
  console.log(JSON.stringify(value,null,2));
}
function main(){
  const args=parseArgs(process.argv.slice(2));
  const command=args._[0];
  ensureAllowed(command,args);
  const days=daysArg(args);
  const tasks=reconstructTasks(readEvents(),days);

  if(command==="recommend"){
    const query={
      task_kind:requiredEnum(args,"task-kind",VALID.task_kind),
      complexity:requiredEnum(args,"complexity",VALID.complexity),
      risk:requiredEnum(args,"risk",VALID.risk),
      profile:requiredEnum(args,"profile",VALID.profile)
    };
    printResult(recommend(query,tasks),Boolean(args.json));
    return;
  }
  if(command==="shadow"){
    printResult(shadowReport(tasks),Boolean(args.json)); return;
  }
  if(command==="analyze"){
    printResult(analysis(tasks),Boolean(args.json)); return;
  }
  if(command==="export"){
    const out=args.out;
    if(typeof out!=="string"||!out) die("--out is required");
    const payload=privateExport(analysis(tasks));
    const resolved=path.resolve(out);
    fs.mkdirSync(path.dirname(resolved),{recursive:true});
    fs.writeFileSync(resolved,JSON.stringify(payload,null,2)+"\n",{mode:0o600});
    try{fs.chmodSync(resolved,0o600);}catch{}
    console.log(resolved);
  }
}
if(process.argv[1] && path.resolve(process.argv[1])===path.resolve(fileURLToPath(import.meta.url))) main();

export { recommend, analysis, shadowReport, privateExport, routeStats, baselineRoute, routeIdForSignature };
