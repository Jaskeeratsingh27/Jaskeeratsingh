import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const read=p=>fs.readFileSync(path.join(ROOT,p),"utf8");
const manifest=JSON.parse(read(".agents/skills/usage-efficient-orchestrator/manifest.json"));
const v=manifest.version;
const checks=[];
const add=(name,ok)=>checks.push({name,ok});

add("AGENTS version",read("AGENTS.md").includes(`Version: ${v}`));
add("SKILL version",read(".agents/skills/usage-efficient-orchestrator/SKILL.md").includes(`v${v}`));
add("CHANGELOG version",read(".agents/skills/usage-efficient-orchestrator/CHANGELOG.md").includes(`## ${v} `));
add("docs version",read("docs/codex-usage-orchestrator.md").includes(`Version: ${v}`));
add("manifest canonical repo",manifest.canonical_repository==="Jaskeeratsingh27/Jaskeeratsingh");
add("manifest QA commands",Array.isArray(manifest.qa_commands)&&manifest.qa_commands.length>=4);

const ref=process.env.GITHUB_HEAD_REF || process.env.GITHUB_REF_NAME || "";
if(ref.startsWith("orchestrator-v")) add("branch version matches manifest",ref===`orchestrator-v${v}`);

const failed=checks.filter(c=>!c.ok);
for(const c of checks) console.log(`${c.ok?"PASS":"FAIL"} | ${c.name}`);
console.log(`\nSUMMARY: ${checks.length-failed.length}/${checks.length} release checks passed for v${v}`);
if(failed.length) process.exit(1);
