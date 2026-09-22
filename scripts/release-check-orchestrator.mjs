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
const budgets=read(".agents/skills/usage-efficient-orchestrator/config/budget-profiles.toml");
const v=manifest.version;
const checks=[];
const add=(name,ok)=>checks.push({name,ok});

function parseProfile(profile){
  const header="[profiles."+profile+"]";
  const start=budgets.indexOf(header);
  if(start<0) return null;
  const after=budgets.slice(start+header.length);
  const next=after.search(/\n\[profiles\./);
  const block=next>=0?after.slice(0,next):after;
  const target=block.match(/target_weekly_percentage_points\s*=\s*(\d+(?:\.\d+)?)/);
  const ceiling=block.match(/ceiling_weekly_percentage_points\s*=\s*(\d+(?:\.\d+)?)/);
  return {target:target?Number(target[1]):null,ceiling:ceiling?Number(ceiling[1]):null};
}

add("candidate version 1.9.0",v==="1.9.0");
add("AGENTS version",read("AGENTS.md").includes("Version: "+v));
add("SKILL version",read(".agents/skills/usage-efficient-orchestrator/SKILL.md").includes("v"+v));
add("CHANGELOG version",read(".agents/skills/usage-efficient-orchestrator/CHANGELOG.md").includes("## "+v+" "));
add("docs version",read("docs/codex-usage-orchestrator.md").includes("Version: "+v));
add("manifest canonical repo",manifest.canonical_repository==="Jaskeeratsingh27/Jaskeeratsingh");
add("manifest QA commands",Array.isArray(manifest.qa_commands)&&manifest.qa_commands.length>=12);
add("telemetry schema version matches",manifest.telemetry_schema_version===observability.schema_version);
add("intelligence schema version matches",manifest.usage_intelligence_schema_version===intelligence.schema_version);
add("adaptive schema version matches",manifest.adaptive_routing_schema_version===adaptive.schema_version);
add("hardening schema version matches",manifest.hardening_schema_version===hardening.schema_version);
add("compatibility schema version matches",manifest.compatibility_schema_version===compatibility.schema_version);
add("canary schema version matches",manifest.canary_schema_version===canary.schema_version);
add("observability forbids prompt capture",observability.capture?.prompt_text===false&&observability.capture?.conversation_text===false);
add("TokenTrack export aggregate-only",observability.export?.aggregate_only===true&&observability.export?.include_task_ids===false);
add("adaptive default mode shadow",adaptive.mode==="shadow");
add("adaptive canonical approval required",adaptive.safety?.active_requires_canonical_approval===true);
add("adaptive approvals empty",Array.isArray(approvals.approvals)&&approvals.approvals.length===0);
add("canary disabled",canary.enabled===false);
add("canary user approval required",canary.eligibility?.require_user_approval===true);
add("canary canonical approval required",canary.eligibility?.require_canonical_approval===true);
add("canary exposure one-at-a-time",canary.exposure?.maximum_active_tasks_per_window===1&&canary.exposure?.simultaneous_canaries===1);
add("last-known-good version 1.5.0",releaseState.last_known_good?.version==="1.5.0");
add("last-known-good immutable commit",/^[a-f0-9]{40}$/.test(releaseState.last_known_good?.commit||""));
add("rollback non-destructive",releaseState.rollback?.automatic_destructive_git_reset===false);
add("compatibility floor v1.3.0",compatibility.minimum_supported_orchestrator_version==="1.3.0");
add("compatibility non-destructive",compatibility.migration_policy==="non_destructive_read_compatibility");
add("foreign schemas ignored/warned",compatibility.incompatible_event_policy==="ignore_foreign_schema_and_warn");
add("v2 active adaptation evidence required",hardening.readiness?.allow_v2_active_adaptation_without_operational_evidence===false);
add("shadow closed-loop allowed when software ready",hardening.readiness?.allow_v2_closed_loop_shadow===true);

const signatures=Object.values(routes.routes).map(r=>r.roles.join(">"));
add("route template signatures unique",new Set(signatures).size===signatures.length);
add("senior specialist route escalation-only",routes.routes?.senior_review?.initial_candidate===false&&routes.routes?.senior_review?.escalation_only===true);
add("reviewed plan-only route exists",routes.routes?.architect_review?.plan_only===true&&routes.routes?.architect_review?.roles?.includes("reviewer"));
add("HIGH discovery review route exists",routes.routes?.scout_review?.roles?.includes("reviewer"));

for(const profile of ["economy","balanced","quality-critical"]){
  const parsed=parseProfile(profile);
  add(profile+" target matches budget profile",parsed&&intelligence.profiles[profile].target_points===parsed.target);
  add(profile+" ceiling matches budget profile",parsed&&intelligence.profiles[profile].ceiling_points===parsed.ceiling);
}

const ref=process.env.GITHUB_HEAD_REF || process.env.GITHUB_REF_NAME || "";
if(ref.startsWith("orchestrator-v")) add("branch version matches manifest",ref==="orchestrator-v"+v || ref.startsWith("orchestrator-v"+v+"-"));

const failed=checks.filter(c=>!c.ok);
for(const c of checks) console.log((c.ok?"PASS":"FAIL")+" | "+c.name);
console.log("\nSUMMARY: "+(checks.length-failed.length)+"/"+checks.length+" release checks passed for v"+v);
if(failed.length) process.exit(1);
