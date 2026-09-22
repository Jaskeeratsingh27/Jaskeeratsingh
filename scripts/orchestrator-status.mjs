import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, ".agents/skills/usage-efficient-orchestrator/manifest.json"), "utf8"));
const CODEX_HOME = process.env.CODEX_HOME || path.join(os.homedir(), ".codex");
const SKILL_HOME = path.join(os.homedir(), ".agents", "skills", "usage-efficient-orchestrator");
const START = "<!-- usage-efficient-orchestrator:start -->";
const END = "<!-- usage-efficient-orchestrator:end -->";
const json = process.argv.includes("--json");
const strict = process.argv.includes("--strict");

const norm = s => s.replace(/\r\n/g, "\n").trim();
const hash = s => crypto.createHash("sha256").update(norm(s)).digest("hex");
const read = p => fs.existsSync(p) ? fs.readFileSync(p, "utf8") : null;
const extract = s => {
  if (!s) return null;
  const a = s.indexOf(START), b = s.indexOf(END);
  if (a < 0 || b < 0 || b <= a) return null;
  return s.slice(a + START.length, b).trim();
};

const checks = [];
const add = (component, status, detail="") => checks.push({component,status,detail});

const repoAgents = read(path.join(ROOT, "AGENTS.md"));
const globalAgentsPath = path.join(CODEX_HOME, "AGENTS.md");
const globalAgents = read(globalAgentsPath);
if (!globalAgents) add("global AGENTS.md","missing",globalAgentsPath);
else {
  const block = extract(globalAgents);
  if (block !== null) add("global AGENTS.md", hash(block) === hash(repoAgents) ? "current" : "drift");
  else if (hash(globalAgents) === hash(repoAgents)) add("global AGENTS.md","current","legacy exact copy");
  else add("global AGENTS.md","drift","managed block missing or stale");
}

const globalManifestPath = path.join(SKILL_HOME,"manifest.json");
const globalManifest = read(globalManifestPath);
if (!globalManifest) add("global skill","missing",SKILL_HOME);
else {
  try {
    const gm = JSON.parse(globalManifest);
    add("global skill", gm.version === manifest.version ? "current" : "drift", `installed=${gm.version ?? "unknown"} canonical=${manifest.version}`);
  } catch {
    add("global skill","drift","invalid manifest");
  }
}

for (const name of manifest.managed_agents) {
  const src = read(path.join(ROOT,".codex","agents",name));
  const dst = read(path.join(CODEX_HOME,"agents",name));
  if (!dst) add(`agent ${name}`,"missing");
  else add(`agent ${name}`,hash(src)===hash(dst)?"current":"drift");
}

const repoConfig = read(path.join(ROOT,".codex","config.toml"));
const globalConfigPath = path.join(CODEX_HOME,"config.toml");
const globalConfig = read(globalConfigPath);
if (!globalConfig) add("global config","missing",globalConfigPath);
else {
  const block=extract(globalConfig);
  if (block !== null) add("global config",hash(block)===hash(repoConfig)?"current":"drift");
  else if (hash(globalConfig)===hash(repoConfig)) add("global config","current","exact copy");
  else {
    const required=["[agents]","[agents.luna_scout]","[agents.luna_researcher]","[agents.terra_implementer]","[agents.terra_reviewer]","[agents.sol_specialist]"];
    add("global config",required.every(x=>globalConfig.includes(x))?"present-unverified":"drift","existing config requires merge-aware verification");
  }
}

const bad = checks.filter(c=>["missing","drift"].includes(c.status));
const warnings = checks.filter(c=>c.status==="present-unverified");
const output={name:manifest.name,canonical_version:manifest.version,checks,summary:{current:checks.length-bad.length-warnings.length,warnings:warnings.length,problems:bad.length}};

if (json) console.log(JSON.stringify(output,null,2));
else {
  console.log(`${manifest.name} canonical version: ${manifest.version}`);
  for (const c of checks) console.log(`${c.status.toUpperCase().padEnd(18)} ${c.component}${c.detail?" | "+c.detail:""}`);
  console.log(`\nSUMMARY: ${output.summary.current} current, ${warnings.length} warning(s), ${bad.length} problem(s)`);
}
if (strict && (bad.length || warnings.length)) process.exit(1);
