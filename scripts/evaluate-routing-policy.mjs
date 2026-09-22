import fs from "node:fs";

const cases=JSON.parse(fs.readFileSync("tests/orchestrator/cases.json","utf8"));
const validRoles=new Set(["cheap_reader","standard_engineer","reviewer","senior_specialist","architect"]);
const nonReasoningFailures=new Set(["information","tooling_environment","test_fixture","permission_security"]);
const checks=[];
const add=(id,name,ok,detail="")=>checks.push({id,name,ok,detail});

for(const c of cases){
  add(c.id,"valid complexity",["MICRO","SMALL","MEDIUM","LARGE"].includes(c.complexity));
  add(c.id,"valid risk",["LOW","MEDIUM","HIGH","CRITICAL"].includes(c.risk));
  add(c.id,"valid profile",["economy","balanced","quality-critical"].includes(c.profile));
  add(c.id,"valid roles",(c.expected_roles||[]).every(r=>validRoles.has(r)));
  add(c.id,"shared writer limit",c.max_writers<=1);

  if(c.risk==="CRITICAL") add(c.id,"critical is plan-only",c.plan_only===true);
  if(c.complexity==="LARGE" && !c.user_preapproved) add(c.id,"large starts plan-only",c.plan_only===true);
  if(["HIGH","CRITICAL"].includes(c.risk) && c.max_writers>0){
    add(c.id,"high-risk write independently reviewed",(c.expected_roles||[]).includes("reviewer"));
  }
  if(nonReasoningFailures.has(c.failure_class)){
    add(c.id,"non-reasoning failure avoids senior escalation",c.senior_escalation===false);
  }
  if(c.failure_class==="implementation" && c.senior_escalation){
    add(c.id,"implementation escalation has failed-attempt evidence",(c.failed_attempts||0)>=2);
  }
  if(c.profile==="economy" && c.senior_escalation){
    add(c.id,"economy senior escalation requires approval",c.approval_required===true);
  }
  if(c.security_block){
    add(c.id,"security block prevents writer",c.max_writers===0 && c.plan_only===true);
  }
  if(c.reuse_context){
    add(c.id,"fresh context avoids new broad discovery",(c.broad_discovery_passes||0)===0);
  }
  if(c.isolated_worktrees){
    add(c.id,"isolated writers preserve shared-tree invariant",c.max_writers<=1 && (c.parallel_writers_allowed||0)>=2);
  }
  if(c.manual_merge_required){
    add(c.id,"manual config merge does not write shared tree",c.max_writers===0);
  }
  if(c.unchanged_passing_suite){
    add(c.id,"unchanged passing suite is not rerun",c.test_cycle_allowed===false);
  }
}

const failed=checks.filter(x=>!x.ok);
for(const c of checks){
  console.log(`${c.ok?"PASS":"FAIL"} | ${c.id} | ${c.name}${c.detail?" | "+c.detail:""}`);
}
console.log(`\nSUMMARY: ${checks.length-failed.length}/${checks.length} routing-policy checks passed across ${cases.length} scenarios`);
if(failed.length) process.exit(1);
