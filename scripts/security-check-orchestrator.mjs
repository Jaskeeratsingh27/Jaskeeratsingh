import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const roots=[
  "AGENTS.md",
  ".agents/skills/usage-efficient-orchestrator",
  ".codex",
  "tests/orchestrator",
  "scripts",
  "docs/codex-usage-orchestrator.md"
];
const files=[];
const walk=p=>{
  const full=path.join(ROOT,p);
  if(!fs.existsSync(full)) return;
  const st=fs.statSync(full);
  if(st.isDirectory()) for(const n of fs.readdirSync(full)) walk(path.join(p,n));
  else if(/\.(md|toml|json|mjs|js|sh|ya?ml)$/.test(p)) files.push(p);
};
roots.forEach(walk);

const secretPatterns=[
  ["OpenAI-style secret",/\bsk-[A-Za-z0-9_-]{20,}\b/g],
  ["GitHub classic token",/\bgh[pousr]_[A-Za-z0-9]{30,}\b/g],
  ["GitHub fine-grained token",/\bgithub_pat_[A-Za-z0-9_]{20,}\b/g],
  ["AWS access key",/\bAKIA[0-9A-Z]{16}\b/g],
  ["Private key",/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/g]
];

const results=[];
const pass=(name,detail="")=>results.push({name,ok:true,detail});
const fail=(name,detail="")=>results.push({name,ok:false,detail});

let secretHits=0;
for(const rel of files){
  const s=fs.readFileSync(path.join(ROOT,rel),"utf8");
  for(const [label,re] of secretPatterns){
    re.lastIndex=0;
    if(re.test(s)){ secretHits++; fail(`secret scan: ${rel}`,label); }
  }
}
if(!secretHits) pass("high-confidence secret scan",`${files.length} files scanned`);

const agentRules={
  "luna-scout.toml":"read-only",
  "luna-researcher.toml":"read-only",
  "terra-reviewer.toml":"read-only",
  "terra-implementer.toml":"workspace-write",
  "sol-specialist.toml":"workspace-write"
};
for(const [name,mode] of Object.entries(agentRules)){
  const p=path.join(ROOT,".codex","agents",name);
  const s=fs.readFileSync(p,"utf8");
  const ok=s.includes(`sandbox_mode = "${mode}"`) && !s.includes("danger-full-access");
  (ok?pass:fail)(`sandbox policy: ${name}`,mode);
}

const config=fs.readFileSync(path.join(ROOT,".codex","config.toml"),"utf8");
const m=config.match(/max_concurrent_threads_per_session\s*=\s*(\d+)/);
if(m && Number(m[1])<=3) pass("max concurrency safety",m[1]); else fail("max concurrency safety",m?.[1]??"missing");

const skill=fs.readFileSync(path.join(ROOT,".agents/skills/usage-efficient-orchestrator/SKILL.md"),"utf8");
for(const gate of ["Reliability control plane","Security gate","Drift gate","CI gate","Privacy-preserving observability","Usage intelligence gate","Adaptive routing gate","Final hardening and readiness"]){
  (skill.includes(gate)?pass:fail)(`skill gate: ${gate}`);
}

const observability=JSON.parse(fs.readFileSync(path.join(ROOT,".agents/skills/usage-efficient-orchestrator/config/observability.json"),"utf8"));
const capture=observability.capture || {};
const privacyOk=[
  "prompt_text","conversation_text","source_code","file_contents","full_file_paths","raw_tool_output","secrets"
].every(k=>capture[k]===false);
(privacyOk?pass:fail)("observability privacy config");
const exportCfg=observability.export || {};
(exportCfg.aggregate_only===true && exportCfg.include_task_ids===false && exportCfg.include_project_ids===false ? pass : fail)("aggregate-only telemetry export");

const intelligence=JSON.parse(fs.readFileSync(path.join(ROOT,".agents/skills/usage-efficient-orchestrator/config/usage-intelligence.json"),"utf8"));
const intelligenceOk=intelligence?.policy?.approval_when_upper_exceeds_target===true &&
  intelligence?.policy?.split_when_upper_exceeds_ceiling===true &&
  intelligence?.quantiles?.upper===0.9;
(intelligenceOk?pass:fail)("usage intelligence config");
const intelligenceScript=fs.readFileSync(path.join(ROOT,".agents/skills/usage-efficient-orchestrator/scripts/usage-intelligence.mjs"),"utf8");
(!intelligenceScript.includes("prompt_text") && !intelligenceScript.includes("source_code") ? pass : fail)("usage intelligence privacy boundary");

const adaptive=JSON.parse(fs.readFileSync(path.join(ROOT,".agents/skills/usage-efficient-orchestrator/config/adaptive-routing.json"),"utf8"));
const routes=JSON.parse(fs.readFileSync(path.join(ROOT,".agents/skills/usage-efficient-orchestrator/config/route-templates.json"),"utf8"));
const approvals=JSON.parse(fs.readFileSync(path.join(ROOT,".agents/skills/usage-efficient-orchestrator/config/adaptive-routing-approvals.json"),"utf8"));
const adaptiveOk=adaptive.mode==="shadow" &&
  adaptive.safety?.critical_plan_only===true &&
  adaptive.safety?.large_plan_only===true &&
  adaptive.safety?.high_risk_requires_reviewer===true &&
  adaptive.safety?.senior_specialist_never_initial_candidate===true &&
  adaptive.safety?.active_requires_canonical_approval===true;
(adaptiveOk?pass:fail)("adaptive routing config");
(Array.isArray(approvals.approvals) && approvals.approvals.length===0 ? pass : fail)("adaptive approvals default empty");
const seniorRoute=routes.routes?.senior_review;
(seniorRoute?.initial_candidate===false && seniorRoute?.escalation_only===true ? pass : fail)("senior route escalation-only");
const adaptiveScript=fs.readFileSync(path.join(ROOT,".agents/skills/usage-efficient-orchestrator/scripts/adaptive-routing.mjs"),"utf8");
(!adaptiveScript.includes("prompt_text") && !adaptiveScript.includes("source_code") && !adaptiveScript.includes("file_contents") ? pass : fail)("adaptive routing privacy boundary");

const hardening=JSON.parse(fs.readFileSync(path.join(ROOT,".agents/skills/usage-efficient-orchestrator/config/hardening.json"),"utf8"));
const canary=JSON.parse(fs.readFileSync(path.join(ROOT,".agents/skills/usage-efficient-orchestrator/config/canary-policy.json"),"utf8"));
const releaseState=JSON.parse(fs.readFileSync(path.join(ROOT,".agents/skills/usage-efficient-orchestrator/config/release-state.json"),"utf8"));
const compatibility=JSON.parse(fs.readFileSync(path.join(ROOT,".agents/skills/usage-efficient-orchestrator/config/compatibility.json"),"utf8"));

const hardeningOk=hardening.invariants?.adaptive_default_mode==="shadow" &&
  hardening.invariants?.single_writer_shared_tree===true &&
  hardening.invariants?.high_risk_requires_reviewer===true &&
  hardening.invariants?.critical_plan_only===true &&
  hardening.invariants?.large_plan_only===true &&
  hardening.readiness?.allow_v2_active_adaptation_without_operational_evidence===false;
(hardeningOk?pass:fail)("hardening config");

(canary.enabled===false ? pass : fail)("canary disabled by default");
(canary.eligibility?.require_user_approval===true && canary.eligibility?.require_canonical_approval===true ? pass : fail)("canary approval gates");
(canary.exposure?.maximum_active_tasks_per_window===1 && canary.exposure?.simultaneous_canaries===1 ? pass : fail)("canary exposure bounded");

const releaseOk=/^[a-f0-9]{40}$/.test(releaseState.last_known_good?.commit||"") &&
  releaseState.rollback?.automatic_destructive_git_reset===false &&
  releaseState.rollback?.require_explicit_user_approval_for_repository_rollback===true;
(releaseOk?pass:fail)("rollback release state");

(compatibility.migration_policy==="non_destructive_read_compatibility" ? pass : fail)("non-destructive compatibility policy");
(compatibility.incompatible_event_policy==="ignore_foreign_schema_and_warn" ? pass : fail)("foreign schema fail-closed policy");

const readinessScript=fs.readFileSync(path.join(ROOT,".agents/skills/usage-efficient-orchestrator/scripts/readiness.mjs"),"utf8");
(!readinessScript.includes("prompt_text") && !readinessScript.includes("source_code") && !readinessScript.includes("file_contents") ? pass : fail)("readiness privacy boundary");

const failed=results.filter(r=>!r.ok);
for(const r of results) console.log(`${r.ok?"PASS":"FAIL"} | ${r.name}${r.detail?" | "+r.detail:""}`);
console.log(`\nSUMMARY: ${results.length-failed.length}/${results.length} security/reliability checks passed`);
if(failed.length) process.exit(1);
