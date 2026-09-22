import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const checks=[
  "validate-orchestrator.mjs",
  "evaluate-routing-policy.mjs",
  "security-check-orchestrator.mjs",
  "test-observability.mjs",
  "test-usage-intelligence.mjs",
  "test-adaptive-routing.mjs",
  "release-check-orchestrator.mjs"
];

let failed=0;
for(const script of checks){
  console.log(`\n=== ${script} ===`);
  const r=spawnSync(process.execPath,[path.join(ROOT,"scripts",script)],{cwd:ROOT,stdio:"inherit",env:process.env});
  if(r.status!==0){ failed++; console.error(`FAILED: ${script}`); }
}
console.log(`\nORCHESTRATOR QA: ${checks.length-failed}/${checks.length} suites passed`);
if(failed) process.exit(1);
