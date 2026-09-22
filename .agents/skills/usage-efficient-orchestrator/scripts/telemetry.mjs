import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const CONFIG = JSON.parse(fs.readFileSync(path.join(HERE, "..", "config", "observability.json"), "utf8"));\nconst MANIFEST = JSON.parse(fs.readFileSync(path.join(HERE, "..", "manifest.json"), "utf8"));
const DEFAULT_DIR = CONFIG.data_dir.replace(/^~(?=\/|$)/, os.homedir());
const DATA_DIR = process.env.ORCHESTRATOR_DATA_DIR || DEFAULT_DIR;
const LEDGER = path.join(DATA_DIR, CONFIG.ledger_file);
const SCHEMA_VERSION = CONFIG.schema_version;

const ENUMS = {
  profile: new Set(["economy","balanced","quality-critical"]),
  complexity: new Set(["MICRO","SMALL","MEDIUM","LARGE"]),
  risk: new Set(["LOW","MEDIUM","HIGH","CRITICAL"]),
  role: new Set(["cheap_reader","standard_engineer","reviewer","senior_specialist","architect"]),
  reasoning: new Set(["none","low","medium","high","extra-high"]),
  access: new Set(["read-only","workspace-write","isolated-write","none"]),
  status: new Set(["started","complete","blocked","failed","passed","stopped","cancelled"]),
  failure_class: new Set(["none","information","tooling_environment","test_fixture","implementation","architecture","permission_security"]),
  stop_reason: new Set(["budget_target","budget_ceiling","retry_limit","scope_expansion","architecture_change","risk_gate","user_checkpoint","qa_failure","security_gate","drift_gate","other"]),
  usage_source: new Set(["user","status"])
};

const COMMAND_KEYS = {
  start: new Set(["task-id","profile","complexity","risk","baseline","source","cycle","project-id"]),
  route: new Set(["task-id","work-unit","role","model","reasoning","access","project-id"]),
  worker: new Set(["task-id","work-unit","role","model","reasoning","access","status","failure-class","duration-ms","files-inspected","files-touched","tests-run","retries","project-id"]),
  validate: new Set(["task-id","status","check-count","failed-count","project-id"]),
  checkpoint: new Set(["task-id","remaining","source","cycle","project-id"]),
  stop: new Set(["task-id","reason","failure-class","project-id"]),
  finish: new Set(["task-id","status","failure-class","duration-ms","remaining","source","cycle","files-inspected","files-touched","tests-run","retries","project-id"]),
  report: new Set(["days","json"]),
  export: new Set(["days","out"]),
  prune: new Set(["days"])
};

function die(message) {
  console.error(`ERROR: ${message}`);
  process.exit(2);
}

function parseArgs(argv) {
  const result = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const token = argv[i];
    if (!token.startsWith("--")) {
      result._.push(token);
      continue;
    }
    const key = token.slice(2);
    if (!key) die("empty argument name");
    const next = argv[i + 1];
    if (next && !next.startsWith("--")) {
      result[key] = next;
      i++;
    } else {
      result[key] = true;
    }
  }
  return result;
}

function ensureAllowed(command, args) {
  const allowed = COMMAND_KEYS[command];
  if (!allowed) die(`unknown command: ${command}`);
  for (const key of Object.keys(args)) {
    if (key === "_") continue;
    if (!allowed.has(key)) die(`unsupported argument --${key} for ${command}; free-text telemetry is intentionally rejected`);
  }
}

function requireArg(args, key) {
  const value = args[key];
  if (value === undefined || value === true || value === "") die(`--${key} is required`);
  return String(value);
}

function optionalEnum(args, key, set) {
  if (args[key] === undefined) return undefined;
  const value = String(args[key]);
  if (!set.has(value)) die(`invalid --${key}: ${value}`);
  return value;
}

function optionalInt(args, key) {
  if (args[key] === undefined) return undefined;
  const n = Number(args[key]);
  if (!Number.isInteger(n) || n < 0) die(`--${key} must be a non-negative integer`);
  return n;
}

function optionalPct(args, key) {
  if (args[key] === undefined) return undefined;
  const n = Number(args[key]);
  if (!Number.isFinite(n) || n < 0 || n > 100) die(`--${key} must be between 0 and 100`);
  return Number(n.toFixed(4));
}

function safeId(value, name, max = 80) {
  if (!new RegExp(`^[A-Za-z0-9._:-]{1,${max}}$`).test(value)) die(`invalid ${name}`);
  return value;
}

function safeModel(value) {
  if (!/^[A-Za-z0-9._/-]{1,80}$/.test(value)) die("invalid --model");
  return value;
}

function taskId(args, allowGenerate = false) {
  if (args["task-id"] !== undefined) return safeId(String(args["task-id"]), "task id");
  if (!allowGenerate) die("--task-id is required");
  return `uo_${Date.now().toString(36)}_${crypto.randomBytes(4).toString("hex")}`;
}

function projectId(args) {
  if (args["project-id"] !== undefined) {
    const v = String(args["project-id"]);
    if (!/^[a-f0-9]{12,64}$/.test(v)) die("--project-id must be a 12-64 character lowercase hex hash");
    return v;
  }
  return crypto.createHash("sha256").update(process.cwd()).digest("hex").slice(0, 20);
}

function cycleId(args) {
  if (args.cycle === undefined) return undefined;
  return safeId(String(args.cycle), "usage cycle id");
}

function ensureStorage() {
  fs.mkdirSync(DATA_DIR, { recursive: true, mode: 0o700 });
  try { fs.chmodSync(DATA_DIR, 0o700); } catch {}
  if (!fs.existsSync(LEDGER)) {
    fs.writeFileSync(LEDGER, "", { mode: 0o600 });
  }
  try { fs.chmodSync(LEDGER, 0o600); } catch {}
}

function readEvents() {
  if (!fs.existsSync(LEDGER)) return [];
  const raw = fs.readFileSync(LEDGER, "utf8").trim();
  if (!raw) return [];
  const events = [];
  for (const [index, line] of raw.split("\n").entries()) {
    try {
      const event = JSON.parse(line);
      if (event && event.schema_version === SCHEMA_VERSION) events.push(event);
    } catch {
      console.error(`WARN: ignoring malformed telemetry line ${index + 1}`);
    }
  }
  return events;
}

function atomicWriteEvents(events) {
  ensureStorage();
  const tmp = `${LEDGER}.tmp-${process.pid}`;
  const data = events.map(e => JSON.stringify(e)).join("\n") + (events.length ? "\n" : "");
  fs.writeFileSync(tmp, data, { mode: 0o600 });
  fs.renameSync(tmp, LEDGER);
  try { fs.chmodSync(LEDGER, 0o600); } catch {}
}

function pruneEvents(days = CONFIG.retention_days) {
  ensureStorage();
  const cutoff = Date.now() - Number(days) * 86400000;
  const all = readEvents();
  const kept = all.filter(e => {
    const t = Date.parse(e.timestamp);
    return Number.isFinite(t) && t >= cutoff;
  });
  if (kept.length !== all.length) atomicWriteEvents(kept);
  return { before: all.length, after: kept.length, removed: all.length - kept.length };
}

function rotateIfNeeded() {
  ensureStorage();
  let stat;
  try { stat = fs.statSync(LEDGER); } catch { return; }
  if (stat.size <= CONFIG.max_ledger_bytes) return;
  pruneEvents(CONFIG.retention_days);
  stat = fs.statSync(LEDGER);
  if (stat.size <= CONFIG.max_ledger_bytes) return;
  const archive = path.join(DATA_DIR, `events-${new Date().toISOString().replace(/[:.]/g,"-")}.jsonl`);
  fs.renameSync(LEDGER, archive);
  fs.writeFileSync(LEDGER, "", { mode: 0o600 });
}

function countTaskEvents(id) {
  if (!fs.existsSync(LEDGER)) return 0;
  return readEvents().filter(e => e.task_id === id).length;
}

function appendEvent(event) {
  ensureStorage();
  rotateIfNeeded();
  if (countTaskEvents(event.task_id) >= CONFIG.max_events_per_task) {
    die(`max events per task exceeded (${CONFIG.max_events_per_task})`);
  }
  fs.appendFileSync(LEDGER, JSON.stringify(event) + "\n", { encoding: "utf8", mode: 0o600 });
  try { fs.chmodSync(LEDGER, 0o600); } catch {}
  return event;
}

function baseEvent(type, id, pid) {
  return {
    schema_version: SCHEMA_VERSION,
    orchestrator_version: MANIFEST.version,
    event_id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    event_type: type,
    task_id: id,
    project_id: pid
  };
}

function compact(obj) {
  return Object.fromEntries(Object.entries(obj).filter(([,v]) => v !== undefined));
}

function emit(type, id, pid, fields = {}) {
  const event = compact({ ...baseEvent(type, id, pid), ...fields });
  appendEvent(event);
  return event;
}

function filteredEvents(days) {
  const cutoff = Date.now() - days * 86400000;
  return readEvents().filter(e => {
    const t = Date.parse(e.timestamp);
    return Number.isFinite(t) && t >= cutoff;
  });
}

function summarize(days = 7) {
  const events = filteredEvents(days);
  const tasks = new Map();
  const byRole = {};
  const byModel = {};
  let budgetStops = 0;

  for (const e of events) {
    if (!tasks.has(e.task_id)) tasks.set(e.task_id, { events: [], checkpoints: [] });
    const t = tasks.get(e.task_id);
    t.events.push(e);
    if (e.event_type === "task_started") t.start = e;
    if (e.event_type === "task_finished") t.finish = e;
    if (e.event_type === "usage_checkpoint") t.checkpoints.push(e);
    if (e.event_type === "route_selected") {
      if (e.role) byRole[e.role] = (byRole[e.role] || 0) + 1;
      if (e.model) byModel[e.model] = (byModel[e.model] || 0) + 1;
    }
    if (e.event_type === "budget_stop") budgetStops++;
  }

  let tasksStarted = 0, tasksFinished = 0, success = 0, blocked = 0, failed = 0;
  let measured = 0, unmeasured = 0, resetOrInvalid = 0, totalBurn = 0;
  const byProfile = {}, byComplexity = {};
  const durations = [];

  for (const [,t] of tasks) {
    if (t.start) {
      tasksStarted++;
      if (t.start.profile) byProfile[t.start.profile] = (byProfile[t.start.profile] || 0) + 1;
      if (t.start.complexity) byComplexity[t.start.complexity] = (byComplexity[t.start.complexity] || 0) + 1;
    }
    if (t.finish) {
      tasksFinished++;
      if (t.finish.status === "complete") success++;
      else if (t.finish.status === "blocked" || t.finish.status === "stopped") blocked++;
      else if (t.finish.status === "failed") failed++;
      if (Number.isInteger(t.finish.duration_ms)) durations.push(t.finish.duration_ms);
    }

    const points = [];
    if (t.start && typeof t.start.remaining_pct === "number") {
      points.push({ remaining: t.start.remaining_pct, cycle: t.start.usage_cycle_id, ts: t.start.timestamp });
    }
    for (const cp of t.checkpoints) {
      points.push({ remaining: cp.remaining_pct, cycle: cp.usage_cycle_id, ts: cp.timestamp });
    }
    if (t.finish && typeof t.finish.remaining_pct === "number") {
      points.push({ remaining: t.finish.remaining_pct, cycle: t.finish.usage_cycle_id, ts: t.finish.timestamp });
    }
    points.sort((a,b) => Date.parse(a.ts) - Date.parse(b.ts));

    if (t.start || t.finish) {
      if (points.length >= 2) {
        const first = points[0], last = points[points.length - 1];
        const cycleCompatible = !first.cycle || !last.cycle || first.cycle === last.cycle;
        if (cycleCompatible && last.remaining <= first.remaining) {
          measured++;
          totalBurn += first.remaining - last.remaining;
        } else {
          resetOrInvalid++;
          unmeasured++;
        }
      } else {
        unmeasured++;
      }
    }
  }

  totalBurn = Number(totalBurn.toFixed(4));
  return {
    schema_version: SCHEMA_VERSION,
    generated_at: new Date().toISOString(),
    window_days: days,
    summary: {
      tasks_started: tasksStarted,
      tasks_finished: tasksFinished,
      success_count: success,
      blocked_count: blocked,
      failed_count: failed,
      budget_stops: budgetStops,
      measured_tasks: measured,
      unmeasured_tasks: unmeasured,
      total_measured_burn_points: totalBurn,
      average_measured_burn_points: measured ? Number((totalBurn / measured).toFixed(4)) : 0,
      reset_or_invalid_pairs: resetOrInvalid,
      average_duration_ms: durations.length ? Math.round(durations.reduce((a,b)=>a+b,0)/durations.length) : 0
    },
    by_role: byRole,
    by_model: byModel,
    by_profile: byProfile,
    by_complexity: byComplexity
  };
}

function tokenTrackExport(report) {
  const { average_duration_ms, ...summary } = report.summary;
  return {
    schema_version: SCHEMA_VERSION,
    generated_at: report.generated_at,
    window_days: report.window_days,
    summary,
    by_role: report.by_role,
    by_profile: report.by_profile,
    by_complexity: report.by_complexity
  };
}

function printReport(report, asJson) {
  if (asJson) {
    console.log(JSON.stringify(report, null, 2));
    return;
  }
  const s = report.summary;
  console.log(`Orchestrator observability — last ${report.window_days} day(s)`);
  console.log(`Tasks: ${s.tasks_started} started / ${s.tasks_finished} finished`);
  console.log(`Outcomes: ${s.success_count} complete / ${s.blocked_count} blocked / ${s.failed_count} failed`);
  console.log(`Measured usage: ${s.measured_tasks} task(s), ${s.total_measured_burn_points.toFixed(2)} points total, ${s.average_measured_burn_points.toFixed(2)} avg`);
  console.log(`Unmeasured: ${s.unmeasured_tasks} task(s); reset/invalid pairs: ${s.reset_or_invalid_pairs}`);
  console.log(`Budget stops: ${s.budget_stops}`);
  console.log(`Routes by role: ${JSON.stringify(report.by_role)}`);
  console.log(`Routes by model: ${JSON.stringify(report.by_model)}`);
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const command = args._[0];
  if (!command) die("command required: start|route|worker|validate|checkpoint|stop|finish|report|export|prune");
  ensureAllowed(command, args);

  if (command === "start") {
    const id = taskId(args, true), pid = projectId(args);
    const profile = optionalEnum(args,"profile",ENUMS.profile) || "balanced";
    const complexity = optionalEnum(args,"complexity",ENUMS.complexity);
    const risk = optionalEnum(args,"risk",ENUMS.risk);
    if (!complexity || !risk) die("--complexity and --risk are required");
    const baseline = optionalPct(args,"baseline");
    const source = baseline !== undefined ? (optionalEnum(args,"source",ENUMS.usage_source) || "user") : undefined;
    const cycle = cycleId(args);
    emit("task_started", id, pid, {
      status:"started", profile, complexity, risk,
      remaining_pct:baseline, usage_source:source, usage_cycle_id:cycle
    });
    console.log(id);
    return;
  }

  if (command === "report") {
    const days = optionalInt(args,"days") || 7;
    printReport(summarize(days), Boolean(args.json));
    return;
  }

  if (command === "export") {
    const days = optionalInt(args,"days") || 7;
    const out = requireArg(args,"out");
    const payload = tokenTrackExport(summarize(days));
    fs.mkdirSync(path.dirname(path.resolve(out)), { recursive: true });
    fs.writeFileSync(out, JSON.stringify(payload,null,2) + "\n", { mode: 0o600 });
    try { fs.chmodSync(out,0o600); } catch {}
    console.log(path.resolve(out));
    return;
  }

  if (command === "prune") {
    const days = optionalInt(args,"days") || CONFIG.retention_days;
    console.log(JSON.stringify(pruneEvents(days)));
    return;
  }

  const id = taskId(args, false), pid = projectId(args);

  if (command === "route") {
    const role = optionalEnum(args,"role",ENUMS.role);
    if (!role) die("--role is required");
    const model = args.model === undefined ? undefined : safeModel(String(args.model));
    emit("route_selected", id, pid, {
      work_unit: args["work-unit"] === undefined ? undefined : safeId(String(args["work-unit"]),"work unit",40),
      role, model,
      reasoning: optionalEnum(args,"reasoning",ENUMS.reasoning),
      access: optionalEnum(args,"access",ENUMS.access)
    });
    return;
  }

  if (command === "worker") {
    const role = optionalEnum(args,"role",ENUMS.role);
    const status = optionalEnum(args,"status",ENUMS.status);
    if (!role || !status) die("--role and --status are required");
    emit("worker_finished", id, pid, {
      work_unit: args["work-unit"] === undefined ? undefined : safeId(String(args["work-unit"]),"work unit",40),
      role,
      model: args.model === undefined ? undefined : safeModel(String(args.model)),
      reasoning: optionalEnum(args,"reasoning",ENUMS.reasoning),
      access: optionalEnum(args,"access",ENUMS.access),
      status,
      failure_class: optionalEnum(args,"failure-class",ENUMS.failure_class),
      duration_ms: optionalInt(args,"duration-ms"),
      files_inspected: optionalInt(args,"files-inspected"),
      files_touched: optionalInt(args,"files-touched"),
      tests_run: optionalInt(args,"tests-run"),
      retries: optionalInt(args,"retries")
    });
    return;
  }

  if (command === "validate") {
    const status = optionalEnum(args,"status",ENUMS.status);
    if (!status || !["passed","failed"].includes(status)) die("--status for validate must be passed or failed");
    emit("validation", id, pid, {
      status,
      check_count: optionalInt(args,"check-count"),
      failed_count: optionalInt(args,"failed-count")
    });
    return;
  }

  if (command === "checkpoint") {
    const remaining = optionalPct(args,"remaining");
    if (remaining === undefined) die("--remaining is required");
    emit("usage_checkpoint", id, pid, {
      remaining_pct: remaining,
      usage_source: optionalEnum(args,"source",ENUMS.usage_source) || "user",
      usage_cycle_id: cycleId(args)
    });
    return;
  }

  if (command === "stop") {
    const reason = optionalEnum(args,"reason",ENUMS.stop_reason);
    if (!reason) die("--reason is required");
    emit("budget_stop", id, pid, {
      status:"stopped",
      stop_reason: reason,
      failure_class: optionalEnum(args,"failure-class",ENUMS.failure_class)
    });
    return;
  }

  if (command === "finish") {
    const status = optionalEnum(args,"status",ENUMS.status);
    if (!status || !["complete","blocked","failed","cancelled","stopped"].includes(status)) {
      die("--status for finish must be complete|blocked|failed|cancelled|stopped");
    }
    const remaining = optionalPct(args,"remaining");
    emit("task_finished", id, pid, {
      status,
      failure_class: optionalEnum(args,"failure-class",ENUMS.failure_class),
      duration_ms: optionalInt(args,"duration-ms"),
      remaining_pct: remaining,
      usage_source: remaining !== undefined ? (optionalEnum(args,"source",ENUMS.usage_source) || "user") : undefined,
      usage_cycle_id: cycleId(args),
      files_inspected: optionalInt(args,"files-inspected"),
      files_touched: optionalInt(args,"files-touched"),
      tests_run: optionalInt(args,"tests-run"),
      retries: optionalInt(args,"retries")
    });
    return;
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))) {
  main();
}

export { summarize, tokenTrackExport, pruneEvents, readEvents, LEDGER, DATA_DIR };
