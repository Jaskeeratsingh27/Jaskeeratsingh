import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, ".agents/skills/usage-efficient-orchestrator/manifest.json"), "utf8"));
const CODEX_HOME = process.env.CODEX_HOME || path.join(os.homedir(), ".codex");
const SKILLS_ROOT = path.join(os.homedir(), ".agents", "skills");
const SKILL_HOME = path.join(SKILLS_ROOT, "usage-efficient-orchestrator");
const dryRun = process.argv.includes("--dry-run");
const START = "<!-- usage-efficient-orchestrator:start -->";
const END = "<!-- usage-efficient-orchestrator:end -->";
const stamp = new Date().toISOString().replace(/[:.]/g,"-");
const actions=[];

const read = p => fs.existsSync(p) ? fs.readFileSync(p,"utf8") : null;
const write = (p,s) => {
  actions.push(`write ${p}`);
  if (!dryRun) { fs.mkdirSync(path.dirname(p),{recursive:true}); fs.writeFileSync(p,s); }
};
const backupFile = p => {
  if (!fs.existsSync(p)) return;
  const dest=`${p}.bak-${stamp}`;
  actions.push(`backup ${p} -> ${dest}`);
  if (!dryRun) fs.copyFileSync(p,dest);
};
const replaceManagedBlock = (existing, canonical) => {
  const block=`${START}\n${canonical.trim()}\n${END}`;
  if (!existing) return block+"\n";
  const a=existing.indexOf(START), b=existing.indexOf(END);
  if (a>=0 && b>a) return existing.slice(0,a)+block+existing.slice(b+END.length);
  if (existing.trim().startsWith("# Usage-Efficient Codex Policy")) return block+"\n";
  return existing.trimEnd()+"\n\n"+block+"\n";
};

fs.mkdirSync(CODEX_HOME,{recursive:true});
fs.mkdirSync(path.join(CODEX_HOME,"agents"),{recursive:true});
fs.mkdirSync(SKILLS_ROOT,{recursive:true});

// Skill tree: canonical replacement with backup.
if (fs.existsSync(SKILL_HOME)) {
  const backup=`${SKILL_HOME}.bak-${stamp}`;
  actions.push(`backup dir ${SKILL_HOME} -> ${backup}`);
  if (!dryRun) fs.cpSync(SKILL_HOME,backup,{recursive:true});
}
actions.push(`sync skill -> ${SKILL_HOME}`);
if (!dryRun) {
  fs.rmSync(SKILL_HOME,{recursive:true,force:true});
  fs.cpSync(path.join(ROOT,".agents","skills","usage-efficient-orchestrator"),SKILL_HOME,{recursive:true});
}

// Agent files.
for (const name of manifest.managed_agents) {
  const src=path.join(ROOT,".codex","agents",name);
  const dst=path.join(CODEX_HOME,"agents",name);
  backupFile(dst);
  write(dst,fs.readFileSync(src,"utf8"));
}

// AGENTS managed block.
const agentsDst=path.join(CODEX_HOME,"AGENTS.md");
const canonicalAgents=fs.readFileSync(path.join(ROOT,"AGENTS.md"),"utf8");
backupFile(agentsDst);
write(agentsDst,replaceManagedBlock(read(agentsDst),canonicalAgents));

// Config: safe merge only when recognized.
const configSrc=fs.readFileSync(path.join(ROOT,".codex","config.toml"),"utf8");
const configDst=path.join(CODEX_HOME,"config.toml");
const candidate=path.join(CODEX_HOME,"usage-efficient-orchestrator.config.toml");
const existing=read(configDst);
let manualMerge=false;
if (!existing) {
  write(configDst,configSrc);
} else if (existing.trim()===configSrc.trim()) {
  actions.push("global config already current");
} else if (existing.includes(START) && existing.includes(END)) {
  backupFile(configDst);
  write(configDst,replaceManagedBlock(existing,configSrc));
} else if (!/^\s*\[agents\]\s*$/m.test(existing)) {
  backupFile(configDst);
  write(configDst,replaceManagedBlock(existing,configSrc));
} else {
  manualMerge=true;
  write(candidate,configSrc);
  actions.push(`manual merge required: ${candidate} -> ${configDst}`);
}

console.log(`${dryRun?"DRY RUN":"SYNC"} ${manifest.name} v${manifest.version}`);
for (const a of actions) console.log(`- ${a}`);
if (manualMerge) {
  console.log("\nWARNING: Existing unrecognized [agents] configuration was not overwritten.");
  console.log("Merge the candidate file manually, then rerun status.");
}

if (!dryRun) {
  const status=spawnSync(process.execPath,[path.join(ROOT,"scripts","orchestrator-status.mjs")],{stdio:"inherit"});
  if (status.status && !manualMerge) process.exit(status.status);
}
