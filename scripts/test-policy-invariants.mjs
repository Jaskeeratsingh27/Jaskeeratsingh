import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { baselineRoute } from "../.agents/skills/usage-efficient-orchestrator/scripts/adaptive-routing.mjs";

const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const routes=JSON.parse(fs.readFileSync(path.join(ROOT,".agents/skills/usage-efficient-orchestrator/config/route-templates.json"),"utf8"));
const adaptive=JSON.parse(fs.readFileSync(path.join(ROOT,".agents/skills/usage-efficient-orchestrator/config/adaptive-routing.json"),"utf8"));
const canary=JSON.parse(fs.readFileSync(path.join(ROOT,".agents/skills/usage-efficient-orchestrator/config/canary-policy.json"),"utf8"));
const checks=[];
const check=(name,ok,detail="")=>checks.push({name,ok,detail});

const taskKinds=["discovery","implementation","review","architecture","mixed","unknown"];
const complexities=["MICRO","SMALL","MEDIUM","LARGE"];
const risks=["LOW","MEDIUM","HIGH","CRITICAL"];
const profiles=["economy","balanced","quality-critical"];

const signatures=new Map();
for(const [id,route] of Object.entries(routes.routes)){
  const sig=route.roles.join(">");
  check("route has roles: "+id,Array.isArray(route.roles)&&route.roles.length>0);
  check("route signature unique: "+id,!signatures.has(sig),signatures.has(sig)?sig+" also used by "+signatures.get(sig):sig);
  signatures.set(sig,id);
  if(route.initial_candidate!==false){
    check("initial candidate excludes senior_specialist: "+id,!route.roles.includes("senior_specialist"));
  }
}

let combos=0;
for(const task_kind of taskKinds){
  for(const complexity of complexities){
    for(const risk of risks){
      for(const profile of profiles){
        combos++;
        const q={task_kind,complexity,risk,profile};
        const id=baselineRoute(q);
        const route=routes.routes[id];
        check("baseline exists "+[task_kind,complexity,risk,profile].join("/"),Boolean(route),id||"missing");
        if(!route) continue;

        if(risk==="CRITICAL" || complexity==="LARGE"){
          check("plan-only floor "+[task_kind,complexity,risk,profile].join("/"),route.plan_only===true,id);
        }
        if(risk==="HIGH"){
          check("HIGH reviewer floor "+[task_kind,complexity,profile].join("/"),route.roles.includes("reviewer"),id);
        }
        if(route.roles.includes("senior_specialist")){
          check("baseline never starts senior "+[task_kind,complexity,risk,profile].join("/"),false,id);
        }
      }
    }
  }
}
check("all query combinations evaluated",combos===288,String(combos));
check("adaptive default shadow",adaptive.mode==="shadow");
check("active canonical approval required",adaptive.safety.active_requires_canonical_approval===true);
check("canary disabled",canary.enabled===false);
check("canary exposure bounded",canary.exposure.maximum_active_tasks_per_window===1&&canary.exposure.simultaneous_canaries===1);
check("canary low-risk only",canary.eligibility.risk.length===1&&canary.eligibility.risk[0]==="LOW");

const failed=checks.filter(c=>!c.ok);
for(const c of checks) console.log((c.ok?"PASS":"FAIL")+" | "+c.name+(c.detail?" | "+c.detail:""));
console.log("\nSUMMARY: "+(checks.length-failed.length)+"/"+checks.length+" invariant checks passed across "+combos+" query combinations");
if(failed.length) process.exit(1);
