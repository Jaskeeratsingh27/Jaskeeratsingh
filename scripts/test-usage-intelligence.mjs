import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import crypto from "node:crypto";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const cli=path.join(ROOT,".agents","skills","usage-efficient-orchestrator","scripts","usage-intelligence.mjs");
const tmp=fs.mkdtempSync(path.join(os.tmpdir(),"orchestrator-intelligence-"));
const dataDir=path.join(tmp,"telemetry");
fs.mkdirSync(dataDir,{recursive:true,mode:0o700});
const ledger=path.join(dataDir,"events.jsonl");
const env={...process.env,ORCHESTRATOR_DATA_DIR:dataDir};
const checks=[];
const check=(name,ok,detail="")=>checks.push({name,ok,detail});

const now=Date.now();
let seq=0;
const events=[];
function event(base){
  seq++;
  return {
    schema_version:"1.0",
    orchestrator_version:"1.4.0",
    event_id:`evt_${String(seq).padStart(6,"0")}`,
    project_id:"0123456789abcdef0123",
    ...base
  };
}

function addTask({id,daysAgo,profile,complexity,risk,burn,roles=["standard_engineer"],outcome="complete",measured=true}){
  const startTs=new Date(now-daysAgo*86400000).toISOString();
  const finishTs=new Date(now-daysAgo*86400000+15*60000).toISOString();
  const baseline=measured?80:undefined;
  const cycle=`W_${Math.floor(daysAgo/7)}`;
  events.push(event({
    timestamp:startTs,event_type:"task_started",task_id:id,status:"started",
    profile,complexity,risk,
    ...(measured?{remaining_pct:baseline,usage_source:"user",usage_cycle_id:cycle}:{})
  }));
  roles.forEach((role,index)=>{
    events.push(event({
      timestamp:new Date(Date.parse(startTs)+(index+1)*60000).toISOString(),
      event_type:"route_selected",task_id:id,work_unit:`W${index+1}`,role,
      model:role==="cheap_reader"?"gpt-5.6-luna":role==="senior_specialist"?"gpt-5.6-sol":"gpt-5.6-terra",
      reasoning:role==="cheap_reader"?"low":"medium",
      access:role==="cheap_reader"||role==="reviewer"?"read-only":"workspace-write"
    }));
    events.push(event({
      timestamp:new Date(Date.parse(startTs)+(index+2)*60000).toISOString(),
      event_type:"worker_finished",task_id:id,work_unit:`W${index+1}`,role,
      status:"complete",duration_ms:500+index*100,files_inspected:role==="cheap_reader"?3:1,
      files_touched:role==="standard_engineer"||role==="senior_specialist"?1:0,
      tests_run:role==="reviewer"?1:0,retries:0
    }));
  });
  events.push(event({
    timestamp:finishTs,event_type:"task_finished",task_id:id,status:outcome,duration_ms:3000,
    ...(measured?{remaining_pct:Number((baseline-burn).toFixed(4)),usage_source:"user",usage_cycle_id:cycle}:{})
  }));
}

// Keep synthetic data 2-40 days old so a 1-day query has no history.
const smallEconomy=[0.8,1.0,1.2,1.4,1.5,1.7,1.8,2.0];
smallEconomy.forEach((burn,i)=>addTask({
  id:`small_e_${i}`,daysAgo:40-i*2,profile:"economy",complexity:"SMALL",risk:"LOW",burn,
  roles:["cheap_reader","standard_engineer"]
}));

const mediumBalanced=[2.5,3.0,3.2,3.5,3.8,4.0,4.2,4.5,4.8,5.2,5.5,6.0];
mediumBalanced.forEach((burn,i)=>addTask({
  id:`medium_b_${i}`,daysAgo:38-i*2,profile:"balanced",complexity:"MEDIUM",risk:"MEDIUM",burn,
  roles:i%4===0?["cheap_reader","standard_engineer","reviewer"]:["standard_engineer","reviewer"]
}));

const mediumHigh=[9.0,9.5,10.0,10.5,11.0,12.0];
mediumHigh.forEach((burn,i)=>addTask({
  id:`medium_h_${i}`,daysAgo:34-i*3,profile:"balanced",complexity:"MEDIUM",risk:"HIGH",burn,
  roles:i===5?["standard_engineer","senior_specialist","reviewer"]:["standard_engineer","reviewer"]
}));

const driftBurns=[1.0,1.1,1.2,1.3,1.4,4.0,4.1,4.2,4.3,4.4];
driftBurns.forEach((burn,i)=>addTask({
  id:`drift_${i}`,daysAgo:30-i*2,profile:"balanced",complexity:"SMALL",risk:"MEDIUM",burn,
  roles:["standard_engineer","reviewer"]
}));

addTask({
  id:"unmeasured_1",daysAgo:3,profile:"balanced",complexity:"SMALL",risk:"LOW",burn:0,
  roles:["standard_engineer"],measured:false
});

events.sort((a,b)=>Date.parse(a.timestamp)-Date.parse(b.timestamp));
fs.writeFileSync(ledger,events.map(e=>JSON.stringify(e)).join("\n")+"\n",{mode:0o600});

function run(args,expect=0){
  const r=spawnSync(process.execPath,[cli,...args],{cwd:ROOT,env,encoding:"utf8"});
  check(`exit ${args.join(" ")}`,r.status===expect,`status=${r.status} stderr=${r.stderr.trim()}`);
  return r;
}
function predict(complexity,risk,profile,extra=[]){
  const r=run(["predict","--complexity",complexity,"--risk",risk,"--profile",profile,"--json",...extra]);
  return JSON.parse(r.stdout);
}

const p1=predict("SMALL","LOW","economy");
check("small economy gate",p1.gate==="proceed_with_proxy_guards",JSON.stringify(p1));
check("small economy p90 within target",p1.estimate.upper_points<=3,String(p1.estimate.upper_points));

const p2=predict("MEDIUM","MEDIUM","balanced");
check("medium balanced approval gate",p2.gate==="approval_required",JSON.stringify(p2));
check("medium balanced p90 target/ceiling",p2.estimate.upper_points>5&&p2.estimate.upper_points<=10,String(p2.estimate.upper_points));

const p3=predict("MEDIUM","HIGH","balanced");
check("medium high split gate",p3.gate==="split_required",JSON.stringify(p3));
check("medium high p90 above ceiling",p3.estimate.upper_points>10,String(p3.estimate.upper_points));

const p4=predict("LARGE","LOW","balanced");
check("large plan-only override",p4.gate==="plan_only",JSON.stringify(p4));

const p5=predict("SMALL","LOW","economy",["--days","1"]);
check("insufficient history proxy-only",p5.status==="insufficient_data"&&p5.gate==="proxy_only",JSON.stringify(p5));

const p6=predict("SMALL","MEDIUM","balanced");
check("drift detected",p6.estimate.drift.detected===true,JSON.stringify(p6.estimate.drift));
check("drift confidence low",p6.estimate.confidence==="low",p6.estimate.confidence);

const p7=predict("MEDIUM","MEDIUM","balanced",["--baseline","60"]);
check("remaining estimates present",p7.remaining?.baseline_remaining_pct===60,JSON.stringify(p7.remaining));
check("remaining estimate arithmetic",p7.remaining.typical_remaining_after===Number((60-p7.estimate.typical_points).toFixed(4)));

const bt=JSON.parse(run(["backtest","--days","56"]).stdout);
check("backtest has predictions",bt.predictions>=8,JSON.stringify(bt));
check("backtest metrics finite",Number.isFinite(bt.mae)&&Number.isFinite(bt.upper_coverage),JSON.stringify(bt));
check("backtest coverage bounded",bt.upper_coverage>=0&&bt.upper_coverage<=1,String(bt.upper_coverage));

const analysis=JSON.parse(run(["analyze","--days","56","--json"]).stdout);
check("measured count excludes unmeasured",analysis.measurement.eligible_measured_tasks===36,JSON.stringify(analysis.measurement));
check("unmeasured count retained",analysis.measurement.excluded_unmeasured_or_invalid===1,JSON.stringify(analysis.measurement));
check("descriptive route signatures present",Object.keys(analysis.by_route_signature).length>=2);

const exportPath=path.join(tmp,"intelligence-export.json");
run(["export","--days","56","--out",exportPath]);
const exported=JSON.parse(fs.readFileSync(exportPath,"utf8"));
const exportText=JSON.stringify(exported);
check("private export omits task ids",!exportText.includes("small_e_0")&&!exportText.includes("project_id"));
check("private export omits by-version fingerprinting",!("by_version" in exported));
check("private export includes calibration",exported.backtest?.predictions>=8);

const unknown=run(["predict","--complexity","SMALL","--risk","LOW","--profile","economy","--note","secret"],2);
check("free-text intelligence arg rejected",unknown.stderr.includes("unsupported argument --note"));

const failed=checks.filter(c=>!c.ok);
for(const c of checks) console.log(`${c.ok?"PASS":"FAIL"} | ${c.name}${c.detail?" | "+c.detail:""}`);
console.log(`\nSUMMARY: ${checks.length-failed.length}/${checks.length} usage-intelligence checks passed`);
fs.rmSync(tmp,{recursive:true,force:true});
if(failed.length) process.exit(1);
