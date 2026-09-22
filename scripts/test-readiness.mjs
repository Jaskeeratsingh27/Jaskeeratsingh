import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const cli=path.join(ROOT,".agents","skills","usage-efficient-orchestrator","scripts","readiness.mjs");
const tmp=fs.mkdtempSync(path.join(os.tmpdir(),"orchestrator-readiness-"));
const env={...process.env,ORCHESTRATOR_DATA_DIR:path.join(tmp,"telemetry")};
const r=spawnSync(process.execPath,[cli,"--json"],{cwd:ROOT,env,encoding:"utf8"});
const checks=[];
const check=(name,ok,detail="")=>checks.push({name,ok,detail});
check("readiness exits cleanly",r.status===0,r.stderr);
const report=JSON.parse(r.stdout);
check("software control plane ready",report.software_control_plane_ready===true,JSON.stringify(report.checks));
check("v2 shadow ready",report.v2_shadow_closed_loop_ready===true);
check("active adaptation not falsely ready",report.v2_active_adaptation_evidence_ready===false,JSON.stringify(report.operational_evidence));
check("empty data reports zero evidence",report.operational_evidence.measured_tasks===0&&report.operational_evidence.known_task_kind_tasks===0);
check("canary remains disabled",report.operational_evidence.canary_enabled===false);
check("canonical approvals remain zero",report.operational_evidence.canonical_approvals===0);

const failed=checks.filter(c=>!c.ok);
for(const c of checks) console.log((c.ok?"PASS":"FAIL")+" | "+c.name+(c.detail?" | "+c.detail:""));
console.log("\nSUMMARY: "+(checks.length-failed.length)+"/"+checks.length+" readiness checks passed");
fs.rmSync(tmp,{recursive:true,force:true});
if(failed.length) process.exit(1);
