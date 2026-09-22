import fs from "node:fs";

const required=[
  "AGENTS.md",
  ".agents/skills/usage-efficient-orchestrator/SKILL.md",
  ".agents/skills/usage-efficient-orchestrator/manifest.json",
  ".agents/skills/usage-efficient-orchestrator/config/budget-profiles.toml",
  ".agents/skills/usage-efficient-orchestrator/config/capabilities.toml",
  ".agents/skills/usage-efficient-orchestrator/references/task-envelope.md",
  ".agents/skills/usage-efficient-orchestrator/references/handoff-schema.md",
  ".agents/skills/usage-efficient-orchestrator/references/failure-taxonomy.md",
  "tests/orchestrator/cases.json",
  "scripts/orchestrator-status.mjs",
  "scripts/orchestrator-sync.mjs",
  "scripts/security-check-orchestrator.mjs",
  "scripts/release-check-orchestrator.mjs",
  "scripts/orchestrator-qa.mjs",
  ".github/workflows/orchestrator-ci.yml"
];

const results=[];
const check=(name,ok,detail="")=>results.push({name,ok,detail});
for(const p of required) check(`required file: ${p}`,fs.existsSync(p));

const read=p=>fs.readFileSync(p,"utf8");
const agents=read("AGENTS.md");
const skill=read(".agents/skills/usage-efficient-orchestrator/SKILL.md");
const manifest=JSON.parse(read(".agents/skills/usage-efficient-orchestrator/manifest.json"));
const budgets=read(".agents/skills/usage-efficient-orchestrator/config/budget-profiles.toml");
const caps=read(".agents/skills/usage-efficient-orchestrator/config/capabilities.toml");
const failures=read(".agents/skills/usage-efficient-orchestrator/references/failure-taxonomy.md");
const handoff=read(".agents/skills/usage-efficient-orchestrator/references/handoff-schema.md");
const config=read(".codex/config.toml");
const workflow=read(".github/workflows/orchestrator-ci.yml");

check("version 1.2.0 declared",agents.includes("Version: 1.2.0")&&skill.includes("v1.2.0")&&manifest.version==="1.2.0");
check("single-writer rule declared",/single-writer/i.test(agents)&&/At most one write-capable worker/i.test(skill));
check("reliability gate declared",agents.includes("Reliability gate")&&skill.includes("Reliability control plane"));
check("drift gate declared",agents.includes("Drift gate")&&skill.includes("Drift gate"));
check("security gate declared",agents.includes("Security gate")&&skill.includes("Security gate"));
check("default max concurrency remains 3",/max_concurrent_threads_per_session\s*=\s*3/.test(config));
check("balanced 5/10 budget exists",/\[profiles\.balanced\][\s\S]*target_weekly_percentage_points\s*=\s*5[\s\S]*ceiling_weekly_percentage_points\s*=\s*10/.test(budgets));
check("economy 3/5 budget exists",/\[profiles\.economy\][\s\S]*target_weekly_percentage_points\s*=\s*3[\s\S]*ceiling_weekly_percentage_points\s*=\s*5/.test(budgets));

for(const role of ["cheap_reader","standard_engineer","reviewer","senior_specialist","architect"]) check(`capability role: ${role}`,caps.includes(`[roles.${role}]`));
for(const failure of ["information","tooling_environment","test_fixture","implementation","architecture","permission_security"]) check(`failure class: ${failure}`,failures.includes(`## ${failure}`));
for(const field of ["task_id:","work_unit:","status:","outcome:","validation:","failure:","risk:","escalation:"]) check(`handoff field: ${field}`,handoff.includes(field));

const cases=JSON.parse(read("tests/orchestrator/cases.json"));
check("routing suite has >=24 cases",cases.length>=24,`count=${cases.length}`);
check("scenario ids unique",new Set(cases.map(c=>c.id)).size===cases.length);
check("all shared-tree cases cap writers <=1",cases.every(c=>c.max_writers<=1));
check("critical cases plan-only",cases.filter(c=>c.risk==="CRITICAL").every(c=>c.plan_only===true));
check("permission/tooling failures do not senior-escalate",cases.filter(c=>["permission_security","tooling_environment"].includes(c.failure_class)).every(c=>c.senior_escalation===false));
check("CI runs unified QA",workflow.includes("node scripts/orchestrator-qa.mjs"));
check("CI read-only contents permission",/permissions:\s*\n\s*contents:\s*read/.test(workflow));

const failed=results.filter(r=>!r.ok);
for(const r of results) console.log(`${r.ok?"PASS":"FAIL"} | ${r.name}${r.detail?" | "+r.detail:""}`);
console.log(`\nSUMMARY: ${results.length-failed.length}/${results.length} checks passed`);
if(failed.length) process.exit(1);
