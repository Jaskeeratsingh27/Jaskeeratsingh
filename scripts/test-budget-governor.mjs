import { finalPrediction } from "../.agents/skills/usage-efficient-orchestrator/scripts/usage-intelligence.mjs";

const checks=[];
const check=(name,ok,detail="")=>checks.push({name,ok,detail});

function tasksFor({profile,complexity="SMALL",risk="LOW",burn,count=14}){
  const out=[];
  for(let i=0;i<count;i++){
    out.push({
      task_id:"t_"+profile+"_"+burn+"_"+i,
      timestamp:new Date(Date.now()-(count-i)*3600000).toISOString(),
      profile,complexity,risk,task_kind:"implementation",
      outcome:"complete",route_signature:"standard_engineer",
      validation_passes:1,validation_failures:0,
      measurement:{measured:true,burn,baseline:80,final:80-burn,cycle:"C1"}
    });
  }
  return out;
}
function gate(profile,burn,complexity="SMALL",risk="LOW"){
  const tasks=tasksFor({profile,complexity,risk,burn});
  return finalPrediction({profile,complexity,risk},tasks);
}

const cases=[
  ["economy",2.9,"proceed"],
  ["economy",3.0,"proceed"],
  ["economy",3.1,"approval_required"],
  ["economy",5.0,"approval_required"],
  ["economy",5.1,"split_required"],
  ["balanced",4.9,"proceed"],
  ["balanced",5.0,"proceed"],
  ["balanced",5.1,"approval_required"],
  ["balanced",10.0,"approval_required"],
  ["balanced",10.1,"split_required"],
  ["quality-critical",4.9,"proceed"],
  ["quality-critical",5.1,"approval_required"],
  ["quality-critical",10.1,"split_required"]
];

for(const [profile,burn,expected] of cases){
  const p=gate(profile,burn);
  check(profile+" burn "+burn+" => "+expected,p.gate===expected,JSON.stringify({gate:p.gate,estimate:p.estimate,calibration:p.calibration}));
}

const large=gate("balanced",1.0,"LARGE","LOW");
check("LARGE overrides cheap estimate",large.gate==="plan_only",large.gate);
const critical=gate("balanced",1.0,"SMALL","CRITICAL");
check("CRITICAL overrides cheap estimate",critical.gate==="plan_only",critical.gate);
const noData=finalPrediction({profile:"balanced",complexity:"SMALL",risk:"LOW"},[]);
check("no data stays proxy_only",noData.gate==="proxy_only"&&noData.estimate===null,JSON.stringify(noData));

// Sweep deterministic values around every configured threshold.
for(let i=0;i<=120;i++){
  const burn=Number((i/10).toFixed(1));
  const p=gate("balanced",burn);
  const expected=burn<=5?"proceed":burn<=10?"approval_required":"split_required";
  check("balanced sweep "+burn,p.gate===expected,p.gate+" vs "+expected);
}
for(let i=0;i<=70;i++){
  const burn=Number((i/10).toFixed(1));
  const p=gate("economy",burn);
  const expected=burn<=3?"proceed":burn<=5?"approval_required":"split_required";
  check("economy sweep "+burn,p.gate===expected,p.gate+" vs "+expected);
}

const failed=checks.filter(c=>!c.ok);
for(const c of checks) console.log((c.ok?"PASS":"FAIL")+" | "+c.name+(c.detail?" | "+c.detail:""));
console.log("\nSUMMARY: "+(checks.length-failed.length)+"/"+checks.length+" budget-governor checks passed");
if(failed.length) process.exit(1);
