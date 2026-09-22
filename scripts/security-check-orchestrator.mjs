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
for(const gate of ["Reliability control plane","Security gate","Drift gate","CI gate"]){
  (skill.includes(gate)?pass:fail)(`skill gate: ${gate}`);
}

const failed=results.filter(r=>!r.ok);
for(const r of results) console.log(`${r.ok?"PASS":"FAIL"} | ${r.name}${r.detail?" | "+r.detail:""}`);
console.log(`\nSUMMARY: ${results.length-failed.length}/${results.length} security/reliability checks passed`);
if(failed.length) process.exit(1);
