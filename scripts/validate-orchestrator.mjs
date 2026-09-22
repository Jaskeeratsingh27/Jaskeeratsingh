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
  ".agents/skills/usage-efficient-orchestrator/references/task-envelope.md",
  ".agents/skills/usage-efficient-orchestrator/references/handoff-schema.md",
  ".agents/skills/usage-efficient-orchestrator/references/failure-taxonomy.md",
  ".agents/skills/usage-efficient-orchestrator/references/observability-policy.md",
  ".agents/skills/usage-efficient-orchestrator/references/usage-intelligence-policy.md",
  ".agents/skills/usage-efficient-orchestrator/references/adaptive-routing-policy.md",
  ".agents/skills/usage-efficient-orchestrator/schemas/telemetry-event.schema.json",
  ".agents/skills/usage-efficient-orchestrator/schemas/tokentrack-export.schema.json",
  ".agents/skills/usage-efficient-orchestrator/schemas/usage-intelligence-export.schema.json",
  ".agents/skills/usage-efficient-orchestrator/schemas/adaptive-routing-export.schema.json",
  ".agents/skills/usage-efficient-orchestrator/scripts/telemetry.mjs",
  ".agents/skills/usage-efficient-orchestrator/scripts/usage-intelligence.mjs",
  ".agents/skills/usage-efficient-orchestrator/scripts/adaptive-routing.mjs",
  "tests/orchestrator/cases.json",
  "tests/orchestrator/observability-cases.json",
  "tests/orchestrator/intelligence-cases.json",
  "tests/orchestrator/adaptive-routing-cases.json",
  "scripts/orchestrator-status.mjs",
  "scripts/orchestrator-sync.mjs",
  "scripts/security-check-orchestrator.mjs",
  "scripts/test-observability.mjs",
  "scripts/test-usage-intelligence.mjs",
  "scripts/test-adaptive-routing.mjs",
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
const adaptive=JSON.parse(read(".agents/skills/usage-efficient-orchestrator/config/adaptive-routing.json"));
const routes=JSON.parse(read(".agents/skills/usage-efficient-orchestrator/config/route-templates.json"));
const approvals=JSON.parse(read(".agents/skills/usage-efficient-orchestrator/config/adaptive-routing-approvals.json"));
const telemetrySchema=JSON.parse(read(".agents/skills/usage-efficient-orchestrator/schemas/telemetry-event.schema.json"));
const adaptiveExportSchema=JSON.parse(read(".agents/skills/usage-efficient-orchestrator/schemas/adaptive-routing-export.schema.json"));
const budgets=read(".agents/skills/usage-efficient-orchestrator/config/budget-profiles.toml");
const caps=read(".agents/skills/usage-efficient-orchestrator/config/capabilities.toml");
const failures=read(".agents/skills/usage-efficient-orchestrator/references/failure-taxonomy.md");
const handoff=read(".agents/skills/usage-efficient-orchestrator/references/handoff-schema.md");
const envelope=read(".agents/skills/usage-efficient-orchestrator/references/task-envelope.md");
const config=read(".codex/config.toml");
const workflow=read(".github/workflows/orchestrator-ci.yml");
const qa=read("scripts/orchestrator-qa.mjs");

check("version 1.5.0 declared",agents.includes("Version: 1.5.0")&&skill.includes("v1.5.0")&&manifest.version==="1.5.0");
check("adaptive schema version 1.0",manifest.adaptive_routing_schema_version==="1.0"&&adaptive.schema_version==="1.0");
check("single-writer rule declared",/single-writer/i.test(agents)&&/At most one write-capable worker/i.test(skill));
check("usage-intelligence gate declared",agents.includes("Usage-intelligence gate")&&skill.includes("Usage intelligence gate"));
check("adaptive-routing gate declared",agents.includes("Adaptive-routing gate")&&skill.includes("Adaptive routing gate"));
check("observability rule declared",agents.includes("Observability is mandatory")&&skill.includes("Privacy-preserving observability"));
check("task envelope includes task kind",envelope.includes("task_kind: discovery | implementation | review | architecture | mixed"));
check("adaptive mode is shadow",adaptive.mode==="shadow");
check("active requires canonical approval",adaptive.safety.active_requires_canonical_approval===true);
check("critical remains plan-only",adaptive.safety.critical_plan_only===true);
check("large remains plan-only",adaptive.safety.large_plan_only===true);
check("high risk requires reviewer",adaptive.safety.high_risk_requires_reviewer===true);
check("senior is never initial candidate",adaptive.safety.senior_specialist_never_initial_candidate===true);
check("approvals default empty",Array.isArray(approvals.approvals)&&approvals.approvals.length===0);
check("adaptive hierarchy starts exact",adaptive.candidate_hierarchy[0].name==="exact"&&adaptive.candidate_hierarchy[0].fields.includes("task_kind"));
check("absolute improvement configured",adaptive.efficiency.minimum_absolute_p90_improvement_points>0);
check("relative improvement configured",adaptive.efficiency.minimum_relative_p90_improvement>0);
check("quality success floor configured",adaptive.quality_floor.minimum_success_rate>=0.9);
check("quality validation floor configured",adaptive.quality_floor.minimum_validation_pass_rate>=0.9);

const routeEntries=Object.entries(routes.routes);
const signatures=routeEntries.map(([,r])=>r.roles.join(">"));
check("route signatures unique",new Set(signatures).size===signatures.length);
check("senior route escalation only",routes.routes.senior_review.initial_candidate===false&&routes.routes.senior_review.escalation_only===true);
check("high-risk baseline includes reviewer",routes.routes.standard_review.roles.includes("reviewer"));
check("baseline rules present",Array.isArray(routes.baseline_rules)&&routes.baseline_rules.length>=10);

check("telemetry supports task kind",Boolean(telemetrySchema.properties.task_kind));
check("telemetry supports routing recommendation",telemetrySchema.properties.event_type.enum.includes("routing_recommendation"));
for(const field of ["baseline_route","candidate_route","decision_mode","route_decision","evidence_samples","estimated_savings_p90"]){
  check("telemetry adaptive field: "+field,Boolean(telemetrySchema.properties[field]));
}
check("adaptive export rejects extra properties",adaptiveExportSchema.additionalProperties===false);
check("prompt capture disabled",observability.capture.prompt_text===false&&observability.capture.conversation_text===false);
check("default max concurrency remains 3",/max_concurrent_threads_per_session\s*=\s*3/.test(config));
check("balanced 5/10 budget exists",/\[profiles\.balanced\][\s\S]*target_weekly_percentage_points\s*=\s*5[\s\S]*ceiling_weekly_percentage_points\s*=\s*10/.test(budgets));
check("economy 3/5 budget exists",/\[profiles\.economy\][\s\S]*target_weekly_percentage_points\s*=\s*3[\s\S]*ceiling_weekly_percentage_points\s*=\s*5/.test(budgets));

for(const role of ["cheap_reader","standard_engineer","reviewer","senior_specialist","architect"]) check("capability role: "+role,caps.includes("[roles."+role+"]"));
for(const failure of ["information","tooling_environment","test_fixture","implementation","architecture","permission_security"]) check("failure class: "+failure,failures.includes("## "+failure));
for(const field of ["task_id:","work_unit:","status:","outcome:","validation:","failure:","risk:","escalation:"]) check("handoff field: "+field,handoff.includes(field));

const cases=JSON.parse(read("tests/orchestrator/cases.json"));
const observabilityCases=JSON.parse(read("tests/orchestrator/observability-cases.json"));
const intelligenceCases=JSON.parse(read("tests/orchestrator/intelligence-cases.json"));
const adaptiveCases=JSON.parse(read("tests/orchestrator/adaptive-routing-cases.json"));
check("routing suite has >=24 cases",cases.length>=24,"count="+cases.length);
check("observability suite has >=8 cases",observabilityCases.length>=8,"count="+observabilityCases.length);
check("intelligence suite has >=10 cases",intelligenceCases.length>=10,"count="+intelligenceCases.length);
check("adaptive suite has >=12 cases",adaptiveCases.length>=12,"count="+adaptiveCases.length);
check("adaptive scenario ids unique",new Set(adaptiveCases.map(c=>c.id)).size===adaptiveCases.length);
check("critical routing cases plan-only",cases.filter(c=>c.risk==="CRITICAL").every(c=>c.plan_only===true));
check("permission/tooling failures do not senior-escalate",cases.filter(c=>["permission_security","tooling_environment"].includes(c.failure_class)).every(c=>c.senior_escalation===false));
check("QA runs adaptive suite",qa.includes("test-adaptive-routing.mjs"));
check("CI runs unified QA",workflow.includes("node scripts/orchestrator-qa.mjs"));
check("CI watches adaptive test",workflow.includes("scripts/test-adaptive-routing.mjs"));

const failed=results.filter(r=>!r.ok);
for(const r of results) console.log((r.ok?"PASS":"FAIL")+" | "+r.name+(r.detail?" | "+r.detail:""));
console.log("\nSUMMARY: "+(results.length-failed.length)+"/"+results.length+" checks passed");
if(failed.length) process.exit(1);
