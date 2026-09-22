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
".agents/skills/usage-efficient-orchestrator/config/closed-loop.json",
".agents/skills/usage-efficient-orchestrator/references/task-envelope.md",
".agents/skills/usage-efficient-orchestrator/references/handoff-schema.md",
".agents/skills/usage-efficient-orchestrator/references/failure-taxonomy.md",
".agents/skills/usage-efficient-orchestrator/references/observability-policy.md",
".agents/skills/usage-efficient-orchestrator/references/usage-intelligence-policy.md",
".agents/skills/usage-efficient-orchestrator/references/adaptive-routing-policy.md",
".agents/skills/usage-efficient-orchestrator/references/hardening-policy.md",
".agents/skills/usage-efficient-orchestrator/references/rollback-policy.md",
".agents/skills/usage-efficient-orchestrator/references/closed-loop-policy.md",
".agents/skills/usage-efficient-orchestrator/schemas/telemetry-event.schema.json",
".agents/skills/usage-efficient-orchestrator/schemas/closed-loop-preflight.schema.json",
".agents/skills/usage-efficient-orchestrator/scripts/telemetry.mjs",
".agents/skills/usage-efficient-orchestrator/scripts/usage-intelligence.mjs",
".agents/skills/usage-efficient-orchestrator/scripts/adaptive-routing.mjs",
".agents/skills/usage-efficient-orchestrator/scripts/readiness.mjs",
".agents/skills/usage-efficient-orchestrator/scripts/closed-loop.mjs",
"tests/orchestrator/closed-loop-cases.json",
"scripts/test-closed-loop.mjs",
"scripts/orchestrator-qa.mjs",
"scripts/security-check-orchestrator.mjs",
"scripts/release-check-orchestrator.mjs",
".github/workflows/orchestrator-ci.yml"
];

const results=[];
const check=(name,ok,detail="")=>results.push({name,ok,detail});
for(const p of required) check("required file: "+p,fs.existsSync(p));

const read=p=>fs.readFileSync(p,"utf8");
const json=p=>JSON.parse(read(p));
const manifest=json(".agents/skills/usage-efficient-orchestrator/manifest.json");
const loop=json(".agents/skills/usage-efficient-orchestrator/config/closed-loop.json");
const adaptive=json(".agents/skills/usage-efficient-orchestrator/config/adaptive-routing.json");
const approvals=json(".agents/skills/usage-efficient-orchestrator/config/adaptive-routing-approvals.json");
const canary=json(".agents/skills/usage-efficient-orchestrator/config/canary-policy.json");
const release=json(".agents/skills/usage-efficient-orchestrator/config/release-state.json");
const compat=json(".agents/skills/usage-efficient-orchestrator/config/compatibility.json");
const schema=json(".agents/skills/usage-efficient-orchestrator/schemas/telemetry-event.schema.json");
const preflightSchema=json(".agents/skills/usage-efficient-orchestrator/schemas/closed-loop-preflight.schema.json");
const agents=read("AGENTS.md");
const skill=read(".agents/skills/usage-efficient-orchestrator/SKILL.md");
const qa=read("scripts/orchestrator-qa.mjs");
const workflow=read(".github/workflows/orchestrator-ci.yml");
const loopScript=read(".agents/skills/usage-efficient-orchestrator/scripts/closed-loop.mjs");
const cases=json("tests/orchestrator/closed-loop-cases.json");

check("version 2.0.0 declared",manifest.version==="2.0.0"&&agents.includes("Version: 2.0.0")&&skill.includes("v2.0.0"));
check("closed-loop schema version",manifest.closed_loop_schema_version==="1.0"&&loop.schema_version==="1.0");
check("closed-loop mode shadow",loop.mode==="shadow_closed_loop");
check("eight lifecycle phases",JSON.stringify(loop.phases)===JSON.stringify(["plan","predict","route","delegate","execute","measure","evaluate","learn"]));
check("baseline cannot be replaced",loop.execution.adaptive_candidate_can_replace_baseline===false);
check("preflight required",loop.execution.require_preflight_before_nontrivial_execution===true);
check("live checkpoint conditional",loop.execution.live_usage_checkpoint_enforcement==="when_available");
check("proxy governor required",loop.execution.proxy_governor_required_without_live_meter===true);
check("single writer preserved",loop.execution.single_writer_shared_tree===true);
check("active adaptation disabled",loop.safety.active_adaptive_routing===false);
check("canary routing disabled",loop.safety.canary_routing===false&&canary.enabled===false);
check("candidate advisory",loop.safety.candidate_route_is_advisory===true);
check("adaptive remains shadow",adaptive.mode==="shadow");
check("approvals remain empty",Array.isArray(approvals.approvals)&&approvals.approvals.length===0);
check("last known good v1.9",release.last_known_good.version==="1.9.0");
check("rollback commit v1.9",release.last_known_good.commit==="1685d9395bb91b751d3b7dcc887a73418e744fd5");
check("compat current v2",compat.current_release==="2.0.0");
check("compat v2 event generation",compat.supported_event_generations.some(x=>x.version==="2.0.x"));
check("preflight event type",schema.properties.event_type.enum.includes("preflight_decision"));
check("post-task event type",schema.properties.event_type.enum.includes("post_task_evaluation"));
for(const f of ["control_action","selected_route","usage_gate","predicted_typical_points","predicted_upper_points","actual_burn_points","prediction_abs_error_points","budget_outcome","quality_outcome","learning_status","learning_eligible"]){
  check("telemetry field "+f,Boolean(schema.properties[f]));
}
check("telemetry extra properties closed",schema.additionalProperties===false);
check("preflight result schema closed",preflightSchema.additionalProperties===false);
check("closed-loop CLI commands",["preflight","checkpoint","status","finalize"].every(x=>loopScript.includes('command==="'+x+'"')));
check("closed-loop no active route replacement",loopScript.includes("execution_route:baselineId")||loopScript.includes("execution_route: baselineId"));
check("closed-loop cases >=15",cases.length>=15,"count="+cases.length);
check("closed-loop case IDs unique",new Set(cases.map(x=>x.id)).size===cases.length);
check("QA runs closed loop",qa.includes("test-closed-loop.mjs"));
check("CI push watches test wildcard",workflow.includes("scripts/test-*.mjs"));
const pull=workflow.split("pull_request:")[1]||"";
check("CI PR watches test wildcard",pull.includes("scripts/test-*.mjs"));
check("AGENTS closed-loop rule",agents.includes("Closed-loop preflight"));
check("SKILL closed-loop runtime",skill.includes("Closed-loop runtime"));
check("SKILL hard-meter caveat",skill.includes("authoritative current remaining percentage")||skill.includes("real usage reading"));

const failed=results.filter(r=>!r.ok);
for(const r of results) console.log((r.ok?"PASS":"FAIL")+" | "+r.name+(r.detail?" | "+r.detail:""));
console.log("\nSUMMARY: "+(results.length-failed.length)+"/"+results.length+" checks passed");
if(failed.length) process.exit(1);
