import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const read=p=>fs.readFileSync(path.join(ROOT,p),"utf8");
const manifest=JSON.parse(read(".agents/skills/usage-efficient-orchestrator/manifest.json"));
const observability=JSON.parse(read(".agents/skills/usage-efficient-orchestrator/config/observability.json"));
const intelligence=JSON.parse(read(".agents/skills/usage-efficient-orchestrator/config/usage-intelligence.json"));
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
  return {
    target:target?Number(target[1]):null,
    ceiling:ceiling?Number(ceiling[1]):null
  };
}

add("AGENTS version",read("AGENTS.md").includes("Version: "+v));
add("SKILL version",read(".agents/skills/usage-efficient-orchestrator/SKILL.md").includes("v"+v));
add("CHANGELOG version",read(".agents/skills/usage-efficient-orchestrator/CHANGELOG.md").includes("## "+v+" "));
add("docs version",read("docs/codex-usage-orchestrator.md").includes("Version: "+v));
add("manifest canonical repo",manifest.canonical_repository==="Jaskeeratsing27/Jaskeeratsingh");
add("manifest QA commands",Array.isArray(manifest.qa_commands)&&manifest.qa_commands.length>=6);
add("telemetry schema version matches",manifest.telemetry_schema_version===observability.schema_version);
add("intelligence schema version matches",manifest.usage_intelligence_schema_version===intelligence.schema_version);
add("observability forbids prompt capture",observability.capture?.prompt_text===false&&observability.capture?.conversation_text===false);
add("TokenTrack export aggregate-only",observability.export?.aggregate_only===true&&observability.export?.include_task_ids===false);

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
