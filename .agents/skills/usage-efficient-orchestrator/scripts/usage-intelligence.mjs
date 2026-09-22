import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { readEvents } from "./telemetry.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const CONFIG = JSON.parse(fs.readFileSync(path.join(HERE, "..", "config", "usage-intelligence.json"), "utf8"));
const MANIFEST = JSON.parse(fs.readFileSync(path.join(HERE, "..", "manifest.json"), "utf8"));

const VALID = {
  complexity: new Set(["MICRO","SMALL","MEDIUM","LARGE"]),
  risk: new Set(["LOW","MEDIUM","HIGH","CRITICAL"]),
  profile: new Set(["economy","balanced","quality-critical"])
};

const ALLOWED_ARGS = {
  predict: new Set(["complexity","risk","profile","baseline","days","json"]),
  analyze: new Set(["days","json"]),
  backtest: new Set(["days","json"]),
  export: new Set(["days","out"])
};

function die(message) {
  console.error(`ERROR: ${message}`);
  process.exit(2);
}

function parseArgs(argv) {
  const args = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const token = argv[i];
    if (!token.startsWith("--")) {
      args._.push(token);
      continue;
    }
    const key = token.slice(2);
    const next = argv[i + 1];
    if (next && !next.startsWith("--")) {
      args[key] = next;
      i++;
    } else {
      args[key] = true;
    }
  }
  return args;
}

function ensureAllowed(command, args) {
  const allowed = ALLOWED_ARGS[command];
  if (!allowed) die("command required: predict|analyze|backtest|export");
  for (const key of Object.keys(args)) {
    if (key === "_") continue;
    if (!allowed.has(key)) die(`unsupported argument --${key}`);
  }
}

function requiredEnum(args, key, set) {
  const value = args[key];
  if (typeof value !== "string" || !set.has(value)) die(`invalid or missing --${key}`);
  return value;
}

function optionalInt(args, key, fallback) {
  if (args[key] === undefined) return fallback;
  const value = Number(args[key]);
  if (!Number.isInteger(value) || value < 1) die(`--${key} must be a positive integer`);
  return value;
}

function optionalPct(args, key) {
  if (args[key] === undefined) return undefined;
  const value = Number(args[key]);
  if (!Number.isFinite(value) || value < 0 || value > 100) die(`--${key} must be between 0 and 100`);
  return Number(value.toFixed(4));
}

function quantile(values, q) {
  if (!values.length) return null;
  const sorted = [...values].sort((a,b)=>a-b);
  if (sorted.length === 1) return sorted[0];
  const pos = (sorted.length - 1) * q;
  const lo = Math.floor(pos), hi = Math.ceil(pos);
  const weight = pos - lo;
  return Number((sorted[lo] * (1 - weight) + sorted[hi] * weight).toFixed(4));
}

function median(values) {
  return quantile(values, 0.5);
}

function mad(values) {
  if (!values.length) return null;
  const m = median(values);
  return median(values.map(v => Math.abs(v - m)));
}

function mean(values) {
  if (!values.length) return null;
  return Number((values.reduce((a,b)=>a+b,0) / values.length).toFixed(4));
}

function measurementForTask(task) {
  const points = [];
  if (task.start && typeof task.start.remaining_pct === "number") {
    points.push({remaining:task.start.remaining_pct,cycle:task.start.usage_cycle_id,ts:task.start.timestamp,kind:"start"});
  }
  for (const cp of task.checkpoints) {
    if (typeof cp.remaining_pct === "number") {
      points.push({remaining:cp.remaining_pct,cycle:cp.usage_cycle_id,ts:cp.timestamp,kind:"checkpoint"});
    }
  }
  if (task.finish && typeof task.finish.remaining_pct === "number") {
    points.push({remaining:task.finish.remaining_pct,cycle:task.finish.usage_cycle_id,ts:task.finish.timestamp,kind:"finish"});
  }
  points.sort((a,b)=>Date.parse(a.ts)-Date.parse(b.ts));
  if (points.length < 2) return {measured:false,reason:"insufficient_checkpoints"};

  const first = points[0];
  const last = points[points.length-1];
  const cycleCompatible = !first.cycle || !last.cycle || first.cycle === last.cycle;
  if (!cycleCompatible) return {measured:false,reason:"cycle_mismatch"};
  if (last.remaining > first.remaining) return {measured:false,reason:"reset_or_invalid"};

  return {
    measured:true,
    burn:Number((first.remaining-last.remaining).toFixed(4)),
    baseline:first.remaining,
    final:last.remaining,
    cycle:first.cycle || last.cycle || null
  };
}

function reconstructTasks(events, days = CONFIG.history_days) {
  const cutoff = Date.now() - days * 86400000;
  const groups = new Map();

  for (const e of events) {
    const ts = Date.parse(e.timestamp);
    if (!Number.isFinite(ts) || ts < cutoff) continue;
    if (!groups.has(e.task_id)) {
      groups.set(e.task_id, {task_id:e.task_id,events:[],routes:[],workers:[],validations:[],checkpoints:[],budget_stops:[]});
    }
    const t = groups.get(e.task_id);
    t.events.push(e);
    if (e.event_type === "task_started") {
      if (!t.start || Date.parse(e.timestamp) < Date.parse(t.start.timestamp)) t.start = e;
    } else if (e.event_type === "task_finished") {
      if (!t.finish || Date.parse(e.timestamp) > Date.parse(t.finish.timestamp)) t.finish = e;
    } else if (e.event_type === "route_selected") t.routes.push(e);
    else if (e.event_type === "worker_finished") t.workers.push(e);
    else if (e.event_type === "validation") t.validations.push(e);
    else if (e.event_type === "usage_checkpoint") t.checkpoints.push(e);
    else if (e.event_type === "budget_stop") t.budget_stops.push(e);
  }

  const tasks = [];
  for (const t of groups.values()) {
    if (!t.start) continue;
    t.routes.sort((a,b)=>Date.parse(a.timestamp)-Date.parse(b.timestamp));
    t.workers.sort((a,b)=>Date.parse(a.timestamp)-Date.parse(b.timestamp));
    t.checkpoints.sort((a,b)=>Date.parse(a.timestamp)-Date.parse(b.timestamp));

    const roleCounts = {};
    const modelCounts = {};
    for (const r of t.routes) {
      if (r.role) roleCounts[r.role] = (roleCounts[r.role] || 0) + 1;
      if (r.model) modelCounts[r.model] = (modelCounts[r.model] || 0) + 1;
    }

    const sumField = field => t.workers.reduce((sum,w)=>sum+(Number.isInteger(w[field])?w[field]:0),0);
    const measurement = measurementForTask(t);

    tasks.push({
      task_id:t.task_id,
      timestamp:t.start.timestamp,
      orchestrator_version:t.start.orchestrator_version || null,
      profile:t.start.profile,
      complexity:t.start.complexity,
      risk:t.start.risk,
      outcome:t.finish?.status || "unfinished",
      failure_class:t.finish?.failure_class || "none",
      route_signature:t.routes.map(r=>r.role).filter(Boolean).join(">") || "direct",
      role_counts:roleCounts,
      model_counts:modelCounts,
      worker_count:t.workers.length,
      senior_escalations:roleCounts.senior_specialist || 0,
      files_inspected:sumField("files_inspected"),
      files_touched:sumField("files_touched"),
      tests_run:sumField("tests_run"),
      retries:sumField("retries"),
      duration_ms:Number.isInteger(t.finish?.duration_ms)
        ? t.finish.duration_ms
        : t.workers.reduce((sum,w)=>sum+(Number.isInteger(w.duration_ms)?w.duration_ms:0),0),
      budget_stops:t.budget_stops.length,
      measurement
    });
  }
  return tasks.sort((a,b)=>Date.parse(a.timestamp)-Date.parse(b.timestamp));
}

function cohortMatches(task, query, fields) {
  return fields.every(field => task[field] === query[field]);
}

function selectCohort(tasks, query, excludeTaskId = null) {
  const measured = tasks.filter(t => t.measurement.measured && t.task_id !== excludeTaskId);
  for (const level of CONFIG.hierarchy) {
    const cohort = measured.filter(t => cohortMatches(t, query, level.fields));
    if (cohort.length >= level.min_samples) {
      return {basis:level.name,fields:level.fields,min_samples:level.min_samples,cohort};
    }
  }
  return null;
}

function detectDrift(cohort) {
  const n = cohort.length;
  const minSide = CONFIG.drift.min_samples_each_side;
  if (n < minSide * 2) return {detected:false,reason:"insufficient_samples"};
  const sorted=[...cohort].sort((a,b)=>Date.parse(a.timestamp)-Date.parse(b.timestamp));
  const split=Math.floor(n/2);
  const older=sorted.slice(0,split).map(t=>t.measurement.burn);
  const newer=sorted.slice(split).map(t=>t.measurement.burn);
  if (older.length < minSide || newer.length < minSide) return {detected:false,reason:"insufficient_samples"};
  const oldMedian=median(older), newMedian=median(newer);
  const shiftRatio=Math.abs(newMedian-oldMedian)/Math.max(oldMedian,0.5);
  return {
    detected:shiftRatio >= CONFIG.drift.median_shift_ratio,
    older_median:oldMedian,
    newer_median:newMedian,
    shift_ratio:Number(shiftRatio.toFixed(4))
  };
}

function statsForCohort(cohort) {
  const burns=cohort.map(t=>t.measurement.burn);
  const lower=quantile(burns,CONFIG.quantiles.lower);
  const typical=quantile(burns,CONFIG.quantiles.typical);
  const upper=quantile(burns,CONFIG.quantiles.upper);
  const spread=Math.max(0,upper-lower);
  const relativeSpread=spread/Math.max(typical,0.5);
  const drift=detectDrift(cohort);

  let confidence="low";
  if (cohort.length >= CONFIG.confidence.high_min_samples &&
      relativeSpread <= CONFIG.confidence.max_relative_spread_for_high &&
      !drift.detected) {
    confidence="high";
  } else if (cohort.length >= CONFIG.confidence.medium_min_samples && !drift.detected) {
    confidence="medium";
  }
  if (drift.detected) confidence="low";

  return {
    samples:cohort.length,
    lower_points:lower,
    typical_points:typical,
    upper_points:upper,
    mean_points:mean(burns),
    mad_points:mad(burns),
    relative_spread:Number(relativeSpread.toFixed(4)),
    confidence,
    drift
  };
}

function rawPrediction(query, tasks, excludeTaskId = null) {
  const selected=selectCohort(tasks,query,excludeTaskId);
  if (!selected) return {status:"insufficient_data"};
  return {
    status:"estimated",
    basis:selected.basis,
    cohort_fields:selected.fields,
    minimum_samples:selected.min_samples,
    ...statsForCohort(selected.cohort)
  };
}

function backtest(tasks) {
  const measured=tasks.filter(t=>t.measurement.measured);
  const results=[];
  for (const t of measured) {
    const query={complexity:t.complexity,risk:t.risk,profile:t.profile};
    const p=rawPrediction(query,tasks,t.task_id);
    if (p.status!=="estimated") continue;
    const actual=t.measurement.burn;
    results.push({
      actual,
      predicted:p.typical_points,
      upper:p.upper_points,
      abs_error:Math.abs(actual-p.typical_points),
      covered:actual<=p.upper_points
    });
  }

  if (!results.length) {
    return {status:"insufficient",predictions:0,mae:null,median_absolute_error:null,upper_coverage:null};
  }

  const errors=results.map(r=>r.abs_error);
  const coverage=results.filter(r=>r.covered).length/results.length;
  const mae=mean(errors);
  const medianError=median(errors);
  let status="insufficient";
  if (results.length >= CONFIG.backtest.min_predictions_for_calibration) {
    status=(coverage >= CONFIG.backtest.minimum_upper_coverage &&
            mae <= CONFIG.backtest.maximum_mae_for_acceptable) ? "acceptable" : "weak";
  }

  return {
    status,
    predictions:results.length,
    mae:Number(mae.toFixed(4)),
    median_absolute_error:Number(medianError.toFixed(4)),
    upper_coverage:Number(coverage.toFixed(4)),
    minimum_predictions_required:CONFIG.backtest.min_predictions_for_calibration,
    acceptable_thresholds:{
      minimum_upper_coverage:CONFIG.backtest.minimum_upper_coverage,
      maximum_mae:CONFIG.backtest.maximum_mae_for_acceptable
    }
  };
}

function finalPrediction(query, tasks, baseline) {
  const estimate=rawPrediction(query,tasks);
  const profileCfg=CONFIG.profiles[query.profile];
  const calibration=backtest(tasks);

  if (estimate.status!=="estimated") {
    return {
      schema_version:CONFIG.schema_version,
      orchestrator_version:MANIFEST.version,
      status:"insufficient_data",
      gate:(query.complexity==="LARGE"||query.risk==="CRITICAL")?"plan_only":"proxy_only",
      query,
      budget:profileCfg,
      calibration,
      estimate:null,
      reason:"No eligible cohort met the minimum measured-sample threshold. Use proxy controls; do not invent a burn estimate."
    };
  }

  let confidence=estimate.confidence;
  if (calibration.status==="weak") confidence="low";

  let gate;
  if (query.complexity==="LARGE" || query.risk==="CRITICAL") {
    gate="plan_only";
  } else if (estimate.upper_points > profileCfg.ceiling_points) {
    gate="split_required";
  } else if (estimate.upper_points > profileCfg.target_points) {
    gate="approval_required";
  } else if (confidence==="low" || calibration.status!=="acceptable") {
    gate="proceed_with_proxy_guards";
  } else {
    gate="proceed";
  }

  const remaining = baseline===undefined ? null : {
    baseline_remaining_pct:baseline,
    typical_remaining_after:Number(Math.max(0,baseline-estimate.typical_points).toFixed(4)),
    conservative_remaining_after:Number(Math.max(0,baseline-estimate.upper_points).toFixed(4))
  };

  return {
    schema_version:CONFIG.schema_version,
    orchestrator_version:MANIFEST.version,
    status:"estimated",
    gate,
    query,
    budget:profileCfg,
    estimate:{...estimate,confidence},
    calibration,
    remaining,
    interpretation:
      gate==="proceed" ? "Historical conservative burn is within the target and calibration is acceptable." :
      gate==="proceed_with_proxy_guards" ? "Historical burn is within target, but confidence/calibration is not strong enough to relax proxy controls." :
      gate==="approval_required" ? "Conservative historical burn exceeds the selected profile target. Ask before execution." :
      gate==="split_required" ? "Conservative historical burn exceeds the profile ceiling. Split the task; do not execute as one autonomous turn." :
      "Control-plane policy requires plan-only execution regardless of usage estimate."
  };
}

function groupSummary(items) {
  const measured=items.filter(t=>t.measurement.measured);
  const burns=measured.map(t=>t.measurement.burn);
  const outcomes={complete:0,blocked:0,failed:0,stopped:0,other:0};
  for (const t of items) {
    if (t.outcome==="complete") outcomes.complete++;
    else if (t.outcome==="blocked") outcomes.blocked++;
    else if (t.outcome==="failed") outcomes.failed++;
    else if (t.outcome==="stopped") outcomes.stopped++;
    else outcomes.other++;
  }
  return {
    tasks:items.length,
    measured_tasks:measured.length,
    typical_points:burns.length?median(burns):null,
    upper_points:burns.length?quantile(burns,CONFIG.quantiles.upper):null,
    mean_points:burns.length?mean(burns):null,
    outcomes
  };
}

function grouped(tasks,keyFn) {
  const map=new Map();
  for (const t of tasks) {
    const key=keyFn(t);
    if (!map.has(key)) map.set(key,[]);
    map.get(key).push(t);
  }
  return Object.fromEntries([...map.entries()].sort(([a],[b])=>a.localeCompare(b)).map(([k,v])=>[k,groupSummary(v)]));
}

function analysis(tasks, days) {
  const measured=tasks.filter(t=>t.measurement.measured);
  const excluded=tasks.length-measured.length;
  return {
    schema_version:CONFIG.schema_version,
    orchestrator_version:MANIFEST.version,
    generated_at:new Date().toISOString(),
    window_days:days,
    measurement:{
      eligible_measured_tasks:measured.length,
      excluded_unmeasured_or_invalid:excluded
    },
    backtest:backtest(tasks),
    by_complexity:grouped(tasks,t=>t.complexity||"unknown"),
    by_profile:grouped(tasks,t=>t.profile||"unknown"),
    by_route_signature:grouped(tasks,t=>t.route_signature||"direct"),
    by_version:grouped(tasks,t=>t.orchestrator_version||"unknown")
  };
}

function privateExport(report) {
  return {
    schema_version:report.schema_version,
    generated_at:report.generated_at,
    window_days:report.window_days,
    measurement:report.measurement,
    backtest:report.backtest,
    by_complexity:report.by_complexity,
    by_profile:report.by_profile,
    by_route_signature:report.by_route_signature
  };
}

function printPrediction(p, asJson) {
  if (asJson) return console.log(JSON.stringify(p,null,2));
  console.log(`Usage intelligence v${p.orchestrator_version}`);
  console.log(`Gate: ${p.gate}`);
  if (!p.estimate) {
    console.log("Estimate: unavailable — insufficient measured history");
    console.log(p.reason);
    return;
  }
  console.log(`Basis: ${p.estimate.basis} (${p.estimate.samples} measured task(s))`);
  console.log(`Empirical band: p25=${p.estimate.lower_points.toFixed(2)}, median=${p.estimate.typical_points.toFixed(2)}, p90=${p.estimate.upper_points.toFixed(2)} percentage points`);
  console.log(`Confidence: ${p.estimate.confidence}; drift=${p.estimate.drift.detected}; calibration=${p.calibration.status}`);
  console.log(`Budget: target=${p.budget.target_points}, ceiling=${p.budget.ceiling_points}`);
  console.log(p.interpretation);
}

function printAnalysis(a, asJson) {
  if (asJson) return console.log(JSON.stringify(a,null,2));
  console.log(`Usage intelligence analysis — last ${a.window_days} day(s)`);
  console.log(`Measured tasks: ${a.measurement.eligible_measured_tasks}; excluded/unmeasured: ${a.measurement.excluded_unmeasured_or_invalid}`);
  console.log(`Backtest: ${a.backtest.status}; predictions=${a.backtest.predictions}; MAE=${a.backtest.mae ?? "n/a"}; upper coverage=${a.backtest.upper_coverage ?? "n/a"}`);
  console.log(`By complexity: ${JSON.stringify(a.by_complexity)}`);
  console.log(`By profile: ${JSON.stringify(a.by_profile)}`);
}

function main() {
  const args=parseArgs(process.argv.slice(2));
  const command=args._[0];
  ensureAllowed(command,args);
  const days=optionalInt(args,"days",CONFIG.history_days);
  const tasks=reconstructTasks(readEvents(),days);

  if (command==="predict") {
    const query={
      complexity:requiredEnum(args,"complexity",VALID.complexity),
      risk:requiredEnum(args,"risk",VALID.risk),
      profile:requiredEnum(args,"profile",VALID.profile)
    };
    printPrediction(finalPrediction(query,tasks,optionalPct(args,"baseline")),Boolean(args.json));
    return;
  }

  if (command==="analyze") {
    printAnalysis(analysis(tasks,days),Boolean(args.json));
    return;
  }

  if (command==="backtest") {
    const result=backtest(tasks);
    console.log(JSON.stringify(result,null,2));
    return;
  }

  if (command==="export") {
    const out=args.out;
    if (typeof out!=="string" || !out) die("--out is required");
    const payload=privateExport(analysis(tasks,days));
    const resolved=path.resolve(out);
    fs.mkdirSync(path.dirname(resolved),{recursive:true});
    fs.writeFileSync(resolved,JSON.stringify(payload,null,2)+"\n",{mode:0o600});
    try { fs.chmodSync(resolved,0o600); } catch {}
    console.log(resolved);
  }
}

if (process.argv[1] && path.resolve(process.argv[1])===path.resolve(fileURLToPath(import.meta.url))) {
  main();
}

export {
  reconstructTasks,
  measurementForTask,
  rawPrediction,
  finalPrediction,
  backtest,
  analysis,
  privateExport,
  quantile,
  median,
  mad
};
