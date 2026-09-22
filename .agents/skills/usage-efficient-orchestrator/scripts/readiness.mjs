import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { readEvents } from "./telemetry.mjs";
import { reconstructTasks, backtest } from "./usage-intelligence.mjs";
import { shadowReport } from "./adaptive-routing.mjs";

const HERE=path.dirname(fileURLToPath(import.meta.url));
const read=p=>JSON.parse(fs.readFileSync(path.join(HERE,"..","config",p),"utf8"));
const manifest=JSON.parse(fs.readFileSync(path.join(HERE,"..","manifest.json"),"utf8"));
const hardening=read("hardening.json");
const adaptive=read("adaptive-routing.json");
const approvals=read("adaptive-routing-approvals.json");
const canary=read("canary-policy.json");
const compat=read("compatibility.json");
const release=read("release-state.json");

const tasks=reconstructTasks(readEvents(),56);
const calibration=backtest(tasks);
const shadow=shadowReport(tasks);

const checks=[
  ["candidate version is final pre-v2 release",manifest.version==="1.9.0"],
  ["adaptive mode remains shadow",adaptive.mode==="shadow"],
  ["adaptive approvals empty",Array.isArray(approvals.approvals)&&approvals.approvals.length===0],
  ["canary disabled",canary.enabled===false],
  ["last-known-good version recorded",release.last_known_good.version==="1.5.0"],
  ["last-known-good immutable commit recorded",/^[a-f0-9]{40}$/.test(release.last_known_good.commit)],
  ["rollback is non-destructive by default",release.rollback.automatic_destructive_git_reset===false],
  ["compatibility floor documented",compat.minimum_supported_orchestrator_version==="1.3.0"],
  ["foreign schema policy fail-closed",compat.incompatible_event_policy==="ignore_foreign_schema_and_warn"],
  ["hardening requires shadow mode",hardening.readiness.require_shadow_mode===true],
  ["v2 active adaptation requires operational evidence",hardening.readiness.allow_v2_active_adaptation_without_operational_evidence===false]
];

const softwareReady=checks.every(([,ok])=>ok);
const measured=tasks.filter(t=>t.measurement?.measured).length;
const knownKind=tasks.filter(t=>t.task_kind&&t.task_kind!=="unknown").length;
const activeEvidenceReady=
  canary.enabled===true &&
  approvals.approvals.length>0 &&
  calibration.status==="acceptable" &&
  measured>=20 &&
  knownKind>=20;

const report={
  schema_version:"1.0",
  generated_at:new Date().toISOString(),
  orchestrator_version:manifest.version,
  software_control_plane_ready:softwareReady,
  v2_shadow_closed_loop_ready:softwareReady,
  v2_active_adaptation_evidence_ready:activeEvidenceReady,
  checks:checks.map(([name,passed])=>({name,passed})),
  operational_evidence:{
    measured_tasks:measured,
    known_task_kind_tasks:knownKind,
    usage_calibration:calibration,
    shadow_classes_evaluated:shadow.classes_evaluated,
    shadow_candidate_recommendations:shadow.candidate_recommendations,
    canonical_approvals:approvals.approvals.length,
    canary_enabled:canary.enabled
  },
  interpretation:softwareReady
    ? "Control-plane software is statically ready for v2 shadow closed-loop operation. Active adaptation remains gated by real operational evidence and explicit approval."
    : "One or more control-plane readiness checks failed."
};

const json=process.argv.includes("--json");
if(json) console.log(JSON.stringify(report,null,2));
else {
  console.log("Orchestrator readiness "+manifest.version);
  for(const c of report.checks) console.log((c.passed?"PASS":"FAIL")+" | "+c.name);
  console.log("Software/control-plane ready: "+report.software_control_plane_ready);
  console.log("v2 shadow closed-loop ready: "+report.v2_shadow_closed_loop_ready);
  console.log("v2 active-adaptation evidence ready: "+report.v2_active_adaptation_evidence_ready);
  console.log(report.interpretation);
}
if(!softwareReady) process.exit(1);
