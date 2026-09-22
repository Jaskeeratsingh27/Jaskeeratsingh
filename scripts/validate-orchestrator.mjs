import fs from "node:fs";

const required=[
  "AGENTS.md",
  ".agents/skills/usage-efficient-orchestrator/SKILL.md",
  ".agents/skills/usage-efficient-orchestrator/manifest.json",
  ".agents/skills/usage-efficient-orchestrator/config/budget-profiles.toml",
  ".agents/skills/usage-efficient-orchestrator/config/capabilities.toml",
  ".agents/skills/usage-efficient-orchestrator/config/observability.json",
  ".agents/skills/usage-efficient-orchestrator/config/usage-intelligence.json",
  ".agents/skills/usage-efficient-orchestrator/references/task-envelope.md",
  ".agents/skills/usage-efficient-orchestrator/references/handoff-schema.md",
  ".agents/skills/usage-efficient-orchestrator/references/failure-taxonomy.md",
  ".agents/skills/usage-efficient-orchestrator/references/observability-policy.md",
  ".agents/skills/usage-efficient-orchestrator/references/usage-intelligence-policy.md",
  ".agents/skills/usage-efficient-orchestrator/schemas/telemetry-event.schema.json",
  ".agents/skills/usage-efficient-orchestrator/schemas/tokentrack-export.schema.json",
  ".agents/skills/usage-efficient-orchestrator/schemas/usage-intelligence-export.schema.json",
  ".agents/skills/usage-efficient-orchestrator/scripts/telemetry.mjs",
  ".agents/skills/usage-efficient-orchestrator/scripts/usage-intelligence.mjs",
  "tests/orchestrator/cases.json",
  "tests/orchestrator/observability-cases.json",
  "tests/orchestrator/intelligence-cases.json",
  "scripts/orchestrator-status.mjs",
  "scripts/orchestrator-sync.mjs",
  "scripts/security-check-orchestrator.mjs",
  "scripts/test-observability.mjs",
  "scripts/test-usage-intelligence.mjs",
  "scripts/release-check-orchestrator.mjs",
  "scripts/orchestrator-qa.mjs",
  ".github/workflows/orchestrator-ci.yml"
];

const results=[];
const check=(name,ok,detail="")=>results.push({name,ok,detail});
for(const p of required) check("required file: "+p,fs.existsSync(p));

const read=p=>fs.readFileSync(p,"utf8");
const agents=read("AGENTS.md");
const skill=read(".agents/skills/usage-efficient-orchestrator/SKILL.md");
const manifest=JSON.parse(read(".agents/skills/usage-efficient-orchestrator/manifest.json"));
const observability=JSON.parse(read(".agents/skills/usage-efficient-orchestrator/config/observability.json"));
const intelligence=JSON.parse(read(".agents/skills/usage-efficient-orchestrator/config/usage-intelligence.json"));
const telemetrySchema=JSON.parse(read(".agents/skills/usage-efficient-orchestrator/schemas/telemetry-event.schema.json"));
const intelligenceSchema=JSON.parse(read(".agents/skills/usage-efficient-orchestrator/schemas/usage-intelligence-export.schema.json"));
const budgets=read(".agents/skills/usage-efficient-orchestrator/config/budget-profiles.toml");
const caps=read(".agents/skills/usage-efficient-orchestrator/config/capabilities.toml");
const failures=read(".agents/skills/usage-efficient-orchestrator/references/failure-taxonomy.md");
const handoff=read(".agents/skills/usage-efficient-orchestrator/references/handoff-schema.md");
const config=read(".codex/config.toml");
const workflow=read(".github/workflows/orchestrator-ci.yml");

check("version 1.4.0 declared",agents.includes("Version: 1.4.0")&&skill.includes("v1.4.0")&&manifest.version==="1.4.0");
check("telemetry schema version 1.0",manifest.telemetry_schema_version==="1.0"&&observability.schema_version==="1.0");
check("intelligence schema version 1.0",manifest.usage_intelligence_schema_version==="1.0"&&intelligence.schema_version==="1.0");
check("single-writer rule declared",/single-writer/i.test(agents)&&/At most one write-capable worker/i.test(skill));
check("usage-intelligence gate declared",agents.includes("Usage-intelligence gate")&&skill.includes("Usage intelligence gate"));
check("observability rule declared",agents.includes("Observability is mandatory")&&skill.includes("Privacy-preserving observability"));
check("prompt capture disabled",observability.capture.prompt_text===false&&observability.capture.conversation_text===false);
check("aggregate-only telemetry export",observability.export.aggregate_only===true&&observability.export.include_task_ids===false&&observability.export.include_project_ids===false);
check("telemetry schema accepts orchestrator version",Boolean(telemetrySchema.properties.orchestrator_version));
check("intelligence export rejects additional props",intelligenceSchema.additionalProperties===false);
check("prediction hierarchy has exact through global",intelligence.hierarchy.map(x=>x.name).join(",")==="exact,complexity_profile,complexity,global");
check("empirical upper quantile is p90",intelligence.quantiles.upper===0.9);
check("drift detection configured",intelligence.drift.min_samples_each_side>=5&&intelligence.drift.median_shift_ratio>0);
check("backtest thresholds configured",intelligence.backtest.min_predictions_for_calibration>=8);
check("intelligence economy 3/5",intelligence.profiles.economy.target_points===3&&intelligence.profiles.economy.ceiling_points===5);
check("intelligence balanced 5/10",intelligence.profiles.balanced.target_points===5&&intelligence.profiles.balanced.ceiling_points===10);
check("default max concurrency remains 3",/max_concurrent_threads_per_session\s*=\s*3/.test(config));
check("balanced 5/10 budget exists",/\[profiles\.balanced\][\s\S]*target_weekly_percentage_points\s*=\s*5[\s\S]*ceiling_weekly_percentage_points\s*=\s*10/.test(budgets));
check("economy 3/5 budget exists",/\[profiles\.economy\][\s\S]*target_weekly_percentage_points\s*=\s*3[\s\S]*ceiling_weekly_percentage_points\s*=\s*5/.test(budgets));

for(const role of ["cheap_reader","standard_engineer","reviewer","senior_specialist","architect"]) check("capability role: "+role,caps.includes("[roles."+role+"]"));
for(const failure of ["information","tooling_environment","test_fixture","implementation","architecture","permission_security"]) check("failure class: "+failure,failures.includes("## "+failure));
for(const field of ["task_id:","work_unit:","status:","outcome:","validation:","failure:","risk:","escalation:"]) check("handoff field: "+field,handoff.includes(field));

const cases=JSON.parse(read("tests/orchestrator/cases.json"));
const observabilityCases=JSON.parse(read("tests/orchestrator/observability-cases.json"));
const intelligenceCases=JSON.parse(read("tests/orchestrator/intelligence-cases.json"));
check("routing suite has >=24 cases",cases.length>=24,"count="+cases.length);
check("observability suite has >=8 cases",observabilityCases.length>=8,"count="+observabilityCases.length);
check("intelligence suite has >=10 cases",intelligenceCases.length>=10,"count="+intelligenceCases.length);
check("intelligence scenario ids unique",new Set(intelligenceCases.map(c=>c.id)).size===intelligenceCases.length);
check("critical routing cases plan-only",cases.filter(c=>c.risk==="CRITICAL").every(c=>c.plan_only===true));
check("permission/tooling failures do not senior-escalate",cases.filter(c=>["permission_security","tooling_environment"].includes(c.failure_class)).every(c=>c.senior_escalation===false));
check("CI runs unified QA",workflow.includes("node scripts/orchestrator-qa.mjs"));
check("CI watches intelligence test",workflow.includes("scripts/test-usage-intelligence.mjs"));

const failed=results.filter(r=>!r.ok);
for(const r of results) console.log((r.ok?"PASS":"FAIL")+" | "+r.name+(r.detail?" | "+r.detail:""));
console.log("\nSUMMARY: "+(results.length-failed.length)+"/"+results.length+" checks passed");
if(failed.length) process.exit(1);
