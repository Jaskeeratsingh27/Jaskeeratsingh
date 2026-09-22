import fs from "node:fs";

const required=[
  "AGENTS.md",
  ".agents/skills/usage-efficient-orchestrator/SKILL.md",
  ".agents/skills/usage-efficient-orchestrator/manifest.json",
  ".agents/skills/usage-efficient-orchestrator/config/budget-profiles.toml",
  ".agents/skills/usage-efficient-orchestrator/config/capabilities.toml",
  ".agents/skills/usage-efficient-orchestrator/config/observability.json",
  ".agents/skills/usage-efficient-orchestrator/config/usage-intelligence.json",
  ".agents/skills/usage-efficient-orchestrator/config/adaptive-routing.json",
  ".agents/skills/usage-efficient-orchestrator/config/route-templates.json",
  ".agents/skills/usage-efficient-orchestrator/config/adaptive-routing-approvals.json",
  ".agents/skills/usage-efficient-orchestrator/config/hardening.json",
  ".agents/skills/usage-efficient-orchestrator/config/compatibility.json",
  ".agents/skills/usage-efficient-orchestrator/config/canary-policy.json",
  ".agents/skills/usage-efficient-orchestrator/config/release-state.json",
  ".agents/skills/usage-efficient-orchestrator/references/task-envelope.md",
  ".agents/skills/usage-efficient-orchestrator/references/handoff-schema.md",
  ".agents/skills/usage-efficient-orchestrator/references/failure-taxonomy.md",
  ".agents/skills/usage-efficient-orchestrator/references/observability-policy.md",
  ".agents/skills/usage-efficient-orchestrator/references/usage-intelligence-policy.md",
  ".agents/skills/usage-efficient-orchestrator/references/adaptive-routing-policy.md",
  ".agents/skills/usage-efficient-orchestrator/references/hardening-policy.md",
  ".agents/skills/usage-efficient-orchestrator/references/rollback-policy.md",
  ".agents/skills/usage-efficient-orchestrator/schemas/telemetry-event.schema.json",
  ".agents/skills/usage-efficient-orchestrator/schemas/tokentrack-export.schema.json",
  ".agents/skills/usage-efficient-orchestrator/schemas/usage-intelligence-export.schema.json",
  ".agents/skills/usage-efficient-orchestrator/schemas/adaptive-routing-export.schema.json",
  ".agents/skills/usage-efficient-orchestrator/scripts/telemetry.mjs",
  ".agents/skills/usage-efficient-orchestrator/scripts/usage-intelligence.mjs",
  ".agents/skills/usage-efficient-orchestrator/scripts/adaptive-routing.mjs",
  ".agents/skills/usage-efficient-orchestrator/scripts/readiness.mjs",
  "tests/orchestrator/cases.json",
  "tests/orchestrator/observability-cases.json",
  "tests/orchestrator/intelligence-cases.json",
  "tests/orchestrator/adaptive-routing-cases.json",
  "tests/orchestrator/hardening-invariants.json",
  "scripts/orchestrator-status.mjs",
  "scripts/orchestrator-sync.mjs",
  "scripts/security-check-orchestrator.mjs",
  "scripts/test-observability.mjs",
  "scripts/test-usage-intelligence.mjs",
  "scripts/test-adaptive-routing.mjs",
  "scripts/test-policy-invariants.mjs",
  "scripts/test-budget-governor.mjs",
  "scripts/test-fault-injection.mjs",
  "scripts/test-version-compatibility.mjs",
  "scripts/test-readiness.mjs",
  "scripts/release-check-orchestrator.mjs",
  "scripts/orchestrator-qa.mjs",
  ".github/workflows/orchestrator-ci.yml"
];

const results=[];
const check=(name,ok,detail="")=>results.push({name,ok,detail});
for(const p of required) check("required file: "+p,fs.existsSync(p));

const read=p=>fs.readFileSync(p,"utf8");
const json=p=>JSON.parse(read(p));
const agents=read("AGENTS.md");
const skill=read(".agents/skills/usage-efficient-orchestrator/SKILL.md");
const manifest=json(".agents/skills/usage-efficient-orchestrator/manifest.json");
const observability=json(".agents/skills/usage-efficient-orchestrator/config/observability.json");
const intelligence=json(".agents/skills/usage-efficient-orchestrator/config/usage-intelligence.json");
const adaptive=json(".agents/skills/usage-efficient-orchestrator/config/adaptive-routing.json");
const routes=json(".agents/skills/usage-efficient-orchestrator/config/route-templates.json");
const approvals=json(".agents/skills/usage-efficient-orchestrator/config/adaptive-routing-approvals.json");
const hardening=json(".agents/skills/usage-efficient-orchestrator/config/hardening.json");
const compatibility=json(".agents/skills/usage-efficient-orchestrator/config/compatibility.json");
const canary=json(".agents/skills/usage-efficient-orchestrator/config/canary-policy.json");
const releaseState=json(".agents/skills/usage-efficient-orchestrator/config/release-state.json");
const telemetrySchema=json(".agents/skills/usage-efficient-orchestrator/schemas/telemetry-event.schema.json");
const adaptiveExportSchema=json(".agents/skills/usage-efficient-orchestrator/schemas/adaptive-routing-export.schema.json");
const budgets=read(".agents/skills/usage-efficient-orchestrator/config/budget-profiles.toml");
const caps=read(".agents/skills/usage-efficient-orchestrator/config/capabilities.toml");
const failures=read(".agents/skills/usage-efficient-orchestrator/references/failure-taxonomy.md");
const handoff=read(".agents/skills/usage-efficient-orchestrator/references/handoff-schema.md");
const envelope=read(".agents/skills/usage-efficient-orchestrator/references/task-envelope.md");
const config=read(".codex/config.toml");
const workflow=read(".github/workflows/orchestrator-ci.yml");
const qa=read("scripts/orchestrator-qa.mjs");

check("version 1.9.0 declared",agents.includes("Version: 1.9.0")&&skill.includes("v1.9.0")&&manifest.version==="1.9.0");
check("hardening schemas declared",manifest.hardening_schema_version==="1.0"&&manifest.compatibility_schema_version==="1.0"&&manifest.canary_schema_version==="1.0");
check("single-writer rule declared",/single-writer/i.test(agents)&&/At most one write-capable worker/i.test(skill));
check("usage-intelligence gate declared",agents.includes("Usage-intelligence gate")&&skill.includes("Usage intelligence gate"));
check("adaptive-routing gate declared",agents.includes("Adaptive-routing gate")&&skill.includes("Adaptive routing gate"));
check("final-hardening gate declared",agents.includes("Final-hardening gate")&&skill.includes("Final hardening and readiness"));
check("observability rule declared",agents.includes("Observability is mandatory")&&skill.includes("Privacy-preserving observability"));
check("task envelope includes task kind",envelope.includes("task_kind: discovery | implementation | review | architecture | mixed"));
check("adaptive mode is shadow",adaptive.mode==="shadow");
check("active requires canonical approval",adaptive.safety.active_requires_canonical_approval===true);
check("critical remains plan-only",adaptive.safety.critical_plan_only===true);
check("large remains plan-only",adaptive.safety.large_plan_only===true);
check("high risk requires reviewer",adaptive.safety.high_risk_requires_reviewer===true);
check("senior is never initial candidate",adaptive.safety.senior_specialist_never_initial_candidate===true);
check("approvals empty",Array.isArray(approvals.approvals)&&approvals.approvals.length===0);
check("canary disabled",canary.enabled===false);
check("canary user approval required",canary.eligibility.require_user_approval===true);
check("canary canonical approval required",canary.eligibility.require_canonical_approval===true);
check("canary exposure bounded",canary.exposure.maximum_active_tasks_per_window===1&&canary.exposure.simultaneous_canaries===1);
check("last-known-good immutable commit",releaseState.last_known_good.version==="1.5.0"&&/^[a-f0-9]{40}$/.test(releaseState.last_known_good.commit));
check("rollback non-destructive",releaseState.rollback.automatic_destructive_git_reset===false);
check("compatibility supports v1.3+",compatibility.minimum_supported_orchestrator_version==="1.3.0"&&compatibility.telemetry_schema_version==="1.0");
check("compatibility non-destructive",compatibility.migration_policy==="non_destructive_read_compatibility");
check("hardening active evidence gate",hardening.readiness.allow_v2_active_adaptation_without_operational_evidence===false);
check("hardening shadow readiness allowed",hardening.readiness.allow_v2_closed_loop_shadow===true);

const routeEntries=Object.entries(routes.routes);
const signatures=routeEntries.map(([,r])=>r.roles.join(">"));
check("route signatures unique",new Set(signatures).size===signatures.length);
check("senior route escalation only",routes.routes.senior_review.initial_candidate===false&&routes.routes.senior_review.escalation_only===true);
check("reviewed plan-only route",routes.routes.architect_review.plan_only===true&&routes.routes.architect_review.roles.includes("reviewer"));
check("HIGH discovery route reviewed",routes.routes.scout_review.roles.includes("reviewer"));

check("telemetry supports task kind",Boolean(telemetrySchema.properties.task_kind));
check("telemetry supports routing recommendation",telemetrySchema.properties.event_type.enum.includes("routing_recommendation"));
check("adaptive export rejects extra properties",adaptiveExportSchema.additionalProperties===false);
check("prompt capture disabled",observability.capture.prompt_text===false&&observability.capture.conversation_text===false);
check("default max concurrency remains 3",/max_concurrent_threads_per_session\s*=\s*3/.test(config));
check("balanced 5/10 budget exists",/\[profiles\.balanced\][\s\S]*target_weekly_percentage_points\s*=\s*5[\s\S]*ceiling_weekly_percentage_points\s*=\s*10/.test(budgets));
check("economy 3/5 budget exists",/\[profiles\.economy\][\s\S]*target_weekly_percentage_points\s*=\s*3[\s\S]*ceiling_weekly_percentage_points\s*=\s*5/.test(budgets));

for(const role of ["cheap_reader","standard_engineer","reviewer","senior_specialist","architect"]) check("capability role: "+role,caps.includes("[roles."+role+"]"));
for(const failure of ["information","tooling_environment","test_fixture","implementation","architecture","permission_security"]) check("failure class: "+failure,failures.includes("## "+failure));
for(const field of ["task_id:","work_unit:","status:","outcome:","validation:","failure:","risk:","escalation:"]) check("handoff field: "+field,handoff.includes(field));

const cases=json("tests/orchestrator/cases.json");
const observabilityCases=json("tests/orchestrator/observability-cases.json");
const intelligenceCases=json("tests/orchestrator/intelligence-cases.json");
const adaptiveCases=json("tests/orchestrator/adaptive-routing-cases.json");
const invariantCases=json("tests/orchestrator/hardening-invariants.json");
check("routing suite has >=24 cases",cases.length>=24,"count="+cases.length);
check("observability suite has >=8 cases",observabilityCases.length>=8,"count="+observabilityCases.length);
check("intelligence suite has >=10 cases",intelligenceCases.length>=10,"count="+intelligenceCases.length);
check("adaptive suite has >=12 cases",adaptiveCases.length>=12,"count="+adaptiveCases.length);
check("hardening matrix has 288 combinations",invariantCases.expected_combinations===288);
check("critical routing cases plan-only",cases.filter(c=>c.risk==="CRITICAL").every(c=>c.plan_only===true));
check("permission/tooling failures do not senior-escalate",cases.filter(c=>["permission_security","tooling_environment"].includes(c.failure_class)).every(c=>c.senior_escalation===false));

for(const suite of [
  "test-adaptive-routing.mjs","test-policy-invariants.mjs","test-budget-governor.mjs",
  "test-fault-injection.mjs","test-version-compatibility.mjs","test-readiness.mjs"
]){
  check("QA runs "+suite,qa.includes(suite));
}
check("CI runs unified QA",workflow.includes("node scripts/orchestrator-qa.mjs"));
check("CI watches all test scripts",workflow.includes("scripts/test-*.mjs"));

const failed=results.filter(r=>!r.ok);
for(const r of results) console.log((r.ok?"PASS":"FAIL")+" | "+r.name+(r.detail?" | "+r.detail:""));
console.log("\nSUMMARY: "+(results.length-failed.length)+"/"+results.length+" checks passed");
if(failed.length) process.exit(1);
