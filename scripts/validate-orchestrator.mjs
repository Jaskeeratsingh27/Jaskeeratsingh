import fs from "node:fs";

const required = [
  "AGENTS.md",
  ".agents/skills/usage-efficient-orchestrator/SKILL.md",
  ".agents/skills/usage-efficient-orchestrator/config/budget-profiles.toml",
  ".agents/skills/usage-efficient-orchestrator/config/capabilities.toml",
  ".agents/skills/usage-efficient-orchestrator/references/task-envelope.md",
  ".agents/skills/usage-efficient-orchestrator/references/handoff-schema.md",
  ".agents/skills/usage-efficient-orchestrator/references/failure-taxonomy.md",
  "tests/orchestrator/cases.json",
];

const results = [];
const check = (name, ok, detail = "") => results.push({ name, ok, detail });

for (const path of required) check(`required file: ${path}`, fs.existsSync(path));

const read = (p) => fs.readFileSync(p, "utf8");
const agents = read("AGENTS.md");
const skill = read(".agents/skills/usage-efficient-orchestrator/SKILL.md");
const budgets = read(".agents/skills/usage-efficient-orchestrator/config/budget-profiles.toml");
const caps = read(".agents/skills/usage-efficient-orchestrator/config/capabilities.toml");
const failures = read(".agents/skills/usage-efficient-orchestrator/references/failure-taxonomy.md");
const handoff = read(".agents/skills/usage-efficient-orchestrator/references/handoff-schema.md");
const config = read(".codex/config.toml");

check("version 1.1.0 declared", agents.includes("Version: 1.1.0") && skill.includes("v1.1.0"));
check("single-writer rule declared", /single-writer/i.test(agents) && /At most one write-capable worker/i.test(skill));
check("default max concurrency remains 3", /max_concurrent_threads_per_session\s*=\s*3/.test(config));
check("balanced 5/10 budget exists", /\[profiles\.balanced\][\s\S]*target_weekly_percentage_points\s*=\s*5[\s\S]*ceiling_weekly_percentage_points\s*=\s*10/.test(budgets));
check("economy 3/5 budget exists", /\[profiles\.economy\][\s\S]*target_weekly_percentage_points\s*=\s*3[\s\S]*ceiling_weekly_percentage_points\s*=\s*5/.test(budgets));

for (const role of ["cheap_reader","standard_engineer","reviewer","senior_specialist","architect"]) {
  check(`capability role: ${role}`, caps.includes(`[roles.${role}]`));
}

for (const failure of ["information","tooling_environment","test_fixture","implementation","architecture","permission_security"]) {
  check(`failure class: ${failure}`, failures.includes(`## ${failure}`));
}

for (const field of ["task_id:","work_unit:","status:","outcome:","validation:","failure:","risk:","escalation:"]) {
  check(`handoff field: ${field}`, handoff.includes(field));
}

const cases = JSON.parse(read("tests/orchestrator/cases.json"));
check("routing suite has >= 12 cases", cases.length >= 12, `count=${cases.length}`);
check("all cases cap shared writers at <=1", cases.every(c => c.max_writers <= 1));
check("critical case is plan-only", cases.filter(c => c.risk === "CRITICAL").every(c => c.plan_only === true));
check("permission failures do not senior-escalate", cases.filter(c => c.failure_class === "permission_security").every(c => c.senior_escalation === false));
check("tooling failures do not senior-escalate", cases.filter(c => c.failure_class === "tooling_environment").every(c => c.senior_escalation === false));
check("high-risk cases avoid multiple writers", cases.filter(c => ["HIGH","CRITICAL"].includes(c.risk)).every(c => c.max_writers <= 1));

const failed = results.filter(r => !r.ok);
for (const r of results) {
  console.log(`${r.ok ? "PASS" : "FAIL"} | ${r.name}${r.detail ? " | " + r.detail : ""}`);
}
console.log(`\nSUMMARY: ${results.length - failed.length}/${results.length} checks passed`);
if (failed.length) process.exit(1);
