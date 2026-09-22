import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const read=p=>fs.readFileSync(path.join(ROOT,p),"utf8");
const json=p=>JSON.parse(read(p));
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
const closedLoop=json(".agents/skills/usage-efficient-orchestrator/config/closed-loop.json");
const telemetrySchema=json(".agents/skills/usage-efficient-orchestrator/schemas/telemetry-event.schema.json");
const budgets=read(".agents/skills/usage-efficient-orchestrator/config/budget-profiles.toml");
const v=manifest.version;
const checks=[];
const add=(name,ok)=>checks.push({name,ok});

function profile(profile){
  const h="[profiles."+profile+"]";
  const i=budgets.indexOf(h);
  if(i<0) return null;
  const tail=budgets.slice(i+h.length);
  const next=tail.search(/\n\[profiles\./);
  const block=next>=0?tail.slice(0,next):tail;
  const n=k=>{const m=block.match(new RegExp(k+"\\s*=\\s*(\\d+(?:\\.\\d+)?)"));return m?Number(m[1]):null;};
  return {target:n("target_weekly_percentage_points"),ceiling:n("ceiling_weekly_percentage_points")};
}

add("candidate version 2.0.0",v==="2.0.0");
add("AGENTS version",read("AGENTS.md").includes("Version: "+v));
add("SKILL version",read(".agents/skills/usage-efficient-orchestrator/SKILL.md").includes("v"+v));
add("CHANGELOG version",read(".agents/skills/usage-efficient-orchestrator/CHANGELOG.md").includes("## "+v+" "));
add("docs version",read("docs/codex-usage-orchestrator.md").includes("Version: "+v));
add("manifest canonical repo",manifest.canonical_repository==="Jaskeeratsingh27/Jaskeeratsingh");
add("manifest QA commands",Array.isArray(manifest.qa_commands)&&manifest.qa_commands.includes("node scripts/test-closed-loop.mjs"));
add("telemetry schema matches",manifest.telemetry_schema_version===observability.schema_version);
add("intelligence schema matches",manifest.usage_intelligence_schema_version===intelligence.schema_version);
add("adaptive schema matches",manifest.adaptive_routing_schema_version===adaptive.schema_version);
add("hardening schema matches",manifest.hardening_schema_version===hardening.schema_version);
add("compatibility schema matches",manifest.compatibility_schema_version===compatibility.schema_version);
add("canary schema matches",manifest.canary_schema_version===canary.schema_version);
add("closed-loop schema matches",manifest.closed_loop_schema_version===closedLoop.schema_version);

add("closed-loop mode",closedLoop.mode==="shadow_closed_loop");
add("closed-loop baseline authoritative",closedLoop.execution.adaptive_candidate_can_replace_baseline===false);
add("closed-loop proxy required",closedLoop.execution.proxy_governor_required_without_live_meter===true);
add("closed-loop single writer",closedLoop.execution.single_writer_shared_tree===true);
add("closed-loop active adaptation off",closedLoop.safety.active_adaptive_routing===false);
add("closed-loop canary off",closedLoop.safety.canary_routing===false);
add("closed-loop candidate advisory",closedLoop.safety.candidate_route_is_advisory===true);

add("adaptive remains shadow",adaptive.mode==="shadow");
add("adaptive approvals empty",Array.isArray(approvals.approvals)&&approvals.approvals.length===0);
add("canary remains disabled",canary.enabled===false);
add("canary user approval required",canary.eligibility.require_user_approval===true);
add("last-known-good v1.9.0",releaseState.last_known_good.version==="1.9.0");
add("last-known-good commit",releaseState.last_known_good.commit==="1685d9395bb91b751d3b7dcc887a73418e744fd5");
add("rollback non-destructive",releaseState.rollback.automatic_destructive_git_reset===false);

add("compatibility current release",compatibility.current_release===v);
add("compatibility floor v1.3",compatibility.minimum_supported_orchestrator_version==="1.3.0");
add("compatibility rollback floor v1.9",compatibility.rollback_minimum_version==="1.9.0");
add("v2 generation documented",compatibility.supported_event_generations.some(x=>x.version==="2.0.x"));

add("preflight telemetry type",telemetrySchema.properties.event_type.enum.includes("preflight_decision"));
add("post-task telemetry type",telemetrySchema.properties.event_type.enum.includes("post_task_evaluation"));
add("telemetry closed properties",telemetrySchema.additionalProperties===false);
add("observability prompt capture disabled",observability.capture.prompt_text===false&&observability.capture.conversation_text===false);

for(const p of ["economy","balanced","quality-critical"]){
  const b=profile(p);
  add(p+" target consistent",b&&intelligence.profiles[p].target_points===b.target);
  add(p+" ceiling consistent",b&&intelligence.profiles[p].ceiling_points===b.ceiling);
}

const sigs=Object.values(routes.routes).map(r=>r.roles.join(">"));
add("route signatures unique",new Set(sigs).size===sigs.length);
add("senior route escalation only",routes.routes.senior_review.initial_candidate===false&&routes.routes.senior_review.escalation_only===true);
add("reviewed plan-only route",routes.routes.architect_review.plan_only===true&&routes.routes.architect_review.roles.includes("reviewer"));

const ref=process.env.GITHUB_HEAD_REF||process.env.GITHUB_REF_NAME||"";
if(ref.startsWith("orchestrator-v")) add("branch version matches",ref==="orchestrator-v"+v||ref.startsWith("orchestrator-v"+v+"-"));

const failed=checks.filter(c=>!c.ok);
for(const c of checks) console.log((c.ok?"PASS":"FAIL")+" | "+c.name);
console.log("\nSUMMARY: "+(checks.length-failed.length)+"/"+checks.length+" release checks passed for v"+v);
if(failed.length) process.exit(1);
