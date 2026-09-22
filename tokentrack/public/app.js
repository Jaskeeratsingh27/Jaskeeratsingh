const $=id=>document.getElementById(id);
const qsa=s=>[...document.querySelectorAll(s)];
const nf=new Intl.NumberFormat();
const compact=new Intl.NumberFormat(undefined,{notation:"compact",maximumFractionDigits:2});
const usd=new Intl.NumberFormat(undefined,{style:"currency",currency:"USD",minimumFractionDigits:2,maximumFractionDigits:4});

const state={
  data:null,health:null,loading:false,
  days:Number(localStorage.getItem("tt-days")||30),
  refreshSeconds:Number(localStorage.getItem("tt-refresh")||60),
  autoRefresh:localStorage.getItem("tt-auto")!=="false",
  localBudget:Number(localStorage.getItem("tt-budget")||0),
  theme:localStorage.getItem("tt-theme")||"dark",
  attr:"models",lastLoaded:0,nextRefresh:0,
  chatSnapshots:loadChatSnapshots()
};

const num=v=>Number.isFinite(Number(v))?Number(v):0;
const fmt=v=>compact.format(num(v));
const count=v=>nf.format(Math.round(num(v)));
const money=v=>usd.format(num(v));
const percent=(v,d=1)=>(num(v)*100).toFixed(d)+"%";
const esc=v=>String(v??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));
const bytes=v=>{const n=num(v);if(!n)return"0 B";const u=["B","KB","MB","GB","TB"],i=Math.min(u.length-1,Math.floor(Math.log(n)/Math.log(1024)));return(n/1024**i).toFixed(i?1:0)+" "+u[i]};
const shortId=v=>{const s=String(v??"");return s.length>28?s.slice(0,15)+"…"+s.slice(-8):s};
const dateLabel=v=>{if(!v)return"—";const d=v.includes("T")?new Date(v):new Date(v+"T00:00:00Z");return d.toLocaleDateString(undefined,{month:"short",day:"numeric"})};
const timeLabel=v=>v?new Date(v).toLocaleString():"—";

function toast(msg){const e=$("toast");e.textContent=msg;e.classList.add("show");clearTimeout(window.__toast);window.__toast=setTimeout(()=>e.classList.remove("show"),2200)}
function show(id,on,html){const e=$(id);e.classList.toggle("hidden",!on);if(html!==undefined)e.innerHTML=html}
function delta(v){if(v===null||v===undefined||!Number.isFinite(Number(v)))return'<span>No baseline</span>';const n=Number(v),cls=n>1?"delta-up":n<-1?"delta-down":"",arrow=n>1?"↑":n<-1?"↓":"→";return'<span class="'+cls+'">'+arrow+" "+Math.abs(n).toFixed(1)+"% vs prior</span>"}
function setLive(kind,title,sub){$("liveDot").className="pulse "+kind;$("liveState").textContent=title;$("freshness").textContent=sub||"";$("sideDot").className="dot "+kind;$("sideStatus").textContent=title}

function setTab(tab){
  qsa(".nav").forEach(b=>b.classList.toggle("active",b.dataset.tab===tab));
  qsa(".page").forEach(p=>p.classList.toggle("active",p.id===tab));
  $("apiControls").classList.toggle("hidden",tab==="chatgpt");
  if(tab==="overview")requestAnimationFrame(renderCharts);
  if(tab==="chatgpt")requestAnimationFrame(renderChatGPT);
}

function render(){
  renderChatGPT();
  if(!state.data)return;
  renderOverview();renderFinops();renderAttribution();renderTools();populateFilters();renderExplorer();renderDiagnostics();
  $("version").textContent="TokenTrack v"+(state.data.version||"—");
  const warnings=state.data.warnings||[];
  show("warningBanner",warnings.length>0,warnings.length?'<strong>Partial telemetry:</strong> '+esc(warnings.join(" · ")):"");
  if(state.data.stale)show("errorBanner",true,'<strong>Last-known-good data:</strong> '+esc(state.data.stale_reason||"Upstream refresh failed."));
  else show("errorBanner",false);
}


function loadChatSnapshots(){
  try{
    const parsed=JSON.parse(localStorage.getItem("tt-chat-snapshots-v1")||"[]");
    return Array.isArray(parsed)?parsed.filter(x=>Number.isFinite(Number(x.used))).sort((a,b)=>new Date(a.recorded_at)-new Date(b.recorded_at)):[];
  }catch{return[]}
}
function saveChatSnapshots(){
  localStorage.setItem("tt-chat-snapshots-v1",JSON.stringify(state.chatSnapshots));
}
function addChatSnapshot(used,resetAt,note){
  state.chatSnapshots.push({
    id:(crypto.randomUUID?crypto.randomUUID():String(Date.now())+Math.random()),
    recorded_at:new Date().toISOString(),
    used:Math.max(0,Math.min(100,num(used))),
    reset_at:resetAt?new Date(resetAt).toISOString():null,
    note:String(note||"").trim()
  });
  state.chatSnapshots.sort((a,b)=>new Date(a.recorded_at)-new Date(b.recorded_at));
  saveChatSnapshots();
  renderChatGPT();
}
function currentChatCycle(){
  const rows=state.chatSnapshots;
  if(!rows.length)return[];
  const latest=rows[rows.length-1];
  let start=rows.length-1;
  for(let i=rows.length-2;i>=0;i--){
    const next=rows[i+1],cur=rows[i];
    const resetChanged=(next.reset_at||"")!==(cur.reset_at||"") && Boolean(next.reset_at||cur.reset_at);
    const usageDropped=num(next.used)<num(cur.used);
    if(resetChanged||usageDropped)break;
    start=i;
  }
  return rows.slice(start);
}
function chatMetrics(){
  const rows=currentChatCycle();
  if(!rows.length)return{latest:null,recentRate:null,cycleRate:null,cycleChange:0,projected:null,resetFirst:false,hoursToReset:null,staleHours:null,pace:"No data",paceClass:""};
  const latest=rows[rows.length-1],first=rows[0];
  let recentRate=null,cycleRate=null;
  if(rows.length>=2){
    const a=rows[rows.length-2],b=latest;
    const recentDays=(new Date(b.recorded_at)-new Date(a.recorded_at))/86400000;
    const recentChange=num(b.used)-num(a.used);
    if(recentDays>0&&recentChange>=0)recentRate=recentChange/recentDays;

    const cycleDays=(new Date(latest.recorded_at)-new Date(first.recorded_at))/86400000;
    const cycleChange=num(latest.used)-num(first.used);
    if(cycleDays>0&&cycleChange>=0)cycleRate=cycleChange/cycleDays;
  }
  const cycleChange=Math.max(0,num(latest.used)-num(first.used));
  const trendRate=recentRate??cycleRate;
  let projected=null,resetFirst=false,hoursToReset=null,resetAt=null;
  if(latest.reset_at){
    const r=new Date(latest.reset_at);
    if(Number.isFinite(r.getTime())){resetAt=r;hoursToReset=(r-Date.now())/3600000}
  }
  if(trendRate&&trendRate>0&&latest.used<100){
    projected=new Date(new Date(latest.recorded_at).getTime()+((100-latest.used)/trendRate)*86400000);
    if(resetAt&&resetAt<projected)resetFirst=true;
  }
  const staleHours=Math.max(0,(Date.now()-new Date(latest.recorded_at).getTime())/3600000);
  let pace="Learning",paceClass="";
  if(latest.used>=100){pace="Exhausted";paceClass="pace-danger"}
  else if(resetAt&&hoursToReset!==null&&hoursToReset<=0){pace="Reset due";paceClass="pace-warn"}
  else if(projected&&resetAt&&projected<resetAt){pace="At risk";paceClass="pace-danger"}
  else if(projected&&resetAt&&projected>=resetAt){pace="On pace";paceClass="pace-good"}
  else if(trendRate&&trendRate>0){pace="Trend only";paceClass="pace-warn"}
  if(staleHours>24&&latest.used<100){pace="Stale data";paceClass="pace-warn"}
  return{latest,recentRate,cycleRate,cycleChange,projected,resetFirst,hoursToReset,staleHours,pace,paceClass,trendRate};
}

function parseChatUsageText(raw){
  const text=String(raw||"").replace(/\s+/g," ").trim();
  if(!text)return{used:null,resetAt:null,message:"Nothing to parse."};
  let used=null,remaining=null;

  const usedPatterns=[
    /(?:weekly\s+usage|usage(?:\s+consumed)?|used|current\s+usage)[^\d]{0,24}(\d{1,3}(?:\.\d+)?)\s*%/i,
    /(\d{1,3}(?:\.\d+)?)\s*%\s*(?:used|usage)/i
  ];
  for(const p of usedPatterns){const m=text.match(p);if(m){used=num(m[1]);break}}
  const remainingPatterns=[
    /(?:remaining|left)[^\d]{0,24}(\d{1,3}(?:\.\d+)?)\s*%/i,
    /(\d{1,3}(?:\.\d+)?)\s*%\s*(?:remaining|left)/i
  ];
  for(const p of remainingPatterns){const m=text.match(p);if(m){remaining=num(m[1]);break}}
  if(used===null&&remaining!==null)used=100-remaining;
  if(used===null){
    const m=text.match(/(\d{1,3}(?:\.\d+)?)\s*%/);
    if(m)used=num(m[1]);
  }
  if(used!==null&&(used<0||used>100))used=null;

  let resetAt=null;
  const rm=text.match(/reset(?:s|ting)?(?:\s+at|\s+on|\s*:)?\s+(.{4,70})/i);
  if(rm){
    let candidate=rm[1].split(/[|•·;]/)[0].trim().replace(/\bat\b/i," ");
    const parsed=Date.parse(candidate);
    if(Number.isFinite(parsed))resetAt=new Date(parsed);
  }

  const pieces=[];
  if(used!==null)pieces.push("usage "+used.toFixed(1)+"%");
  if(resetAt)pieces.push("reset "+resetAt.toLocaleString());
  return{
    used,
    resetAt,
    message:pieces.length?"Parsed "+pieces.join(" · ")+". Review before saving.":"Could not confidently find a usage percentage. Enter it manually."
  };
}

function toLocalDateTimeInput(date){
  if(!date||!Number.isFinite(date.getTime()))return"";
  const pad=n=>String(n).padStart(2,"0");
  return date.getFullYear()+"-"+pad(date.getMonth()+1)+"-"+pad(date.getDate())+"T"+pad(date.getHours())+":"+pad(date.getMinutes());
}

function importChatBackup(payload){
  const source=Array.isArray(payload)?payload:payload?.snapshots;
  if(!Array.isArray(source))throw new Error("Backup does not contain a snapshots array.");
  const existing=new Set(state.chatSnapshots.map(x=>String(x.recorded_at)+"|"+Number(x.used).toFixed(3)));
  let added=0;
  for(const row of source){
    const used=Number(row?.used),recorded=new Date(row?.recorded_at);
    if(!Number.isFinite(used)||used<0||used>100||!Number.isFinite(recorded.getTime()))continue;
    const key=recorded.toISOString()+"|"+used.toFixed(3);
    if(existing.has(key))continue;
    let resetAt=null;
    if(row.reset_at){
      const r=new Date(row.reset_at);
      if(Number.isFinite(r.getTime()))resetAt=r.toISOString();
    }
    state.chatSnapshots.push({
      id:(crypto.randomUUID?crypto.randomUUID():String(Date.now())+Math.random()),
      recorded_at:recorded.toISOString(),
      used,
      reset_at:resetAt,
      note:String(row.note||"").slice(0,120)
    });
    existing.add(key);added++;
  }
  state.chatSnapshots.sort((a,b)=>new Date(a.recorded_at)-new Date(b.recorded_at));
  saveChatSnapshots();renderChatGPT();return added;
}

function renderChatGPT(){
  const m=chatMetrics(),latest=m.latest;
  $("chatUsed").textContent=latest?num(latest.used).toFixed(1)+"%":"—";
  $("chatRemaining").textContent=latest?(100-num(latest.used)).toFixed(1)+"%":"—";
  $("chatLastSeen").textContent=latest?"Recorded "+timeLabel(latest.recorded_at)+(m.staleHours>24?" · stale":""):"No checkpoint yet";

  if(m.recentRate!==null){
    $("chatBurnRate").textContent=m.recentRate.toFixed(1)+"% / day";
    $("chatBurnDetail").textContent="Latest checkpoint-to-checkpoint pace";
  }else{
    $("chatBurnRate").textContent="—";
    $("chatBurnDetail").textContent=state.chatSnapshots.length>1?"Allowance reset detected or insufficient interval":"Needs 2 checkpoints";
  }

  if(m.projected){
    $("chatProjected").textContent=m.resetFirst?"Reset first":m.projected.toLocaleDateString(undefined,{month:"short",day:"numeric"});
    $("chatProjectionDetail").textContent=m.resetFirst&&latest.reset_at?"Reset occurs before projected exhaustion":"At latest observed pace";
  }else{
    $("chatProjected").textContent=latest&&latest.used>=100?"100%":"—";
    $("chatProjectionDetail").textContent=latest?.reset_at?"Reset "+timeLabel(latest.reset_at):"Based on recent observed pace";
  }

  if(m.hoursToReset!==null){
    if(m.hoursToReset<=0){
      $("chatTimeToReset").textContent="Due";
      $("chatResetDetail").textContent="Recorded reset time has passed";
    }else if(m.hoursToReset<48){
      $("chatTimeToReset").textContent=m.hoursToReset.toFixed(1)+"h";
      $("chatResetDetail").textContent="Reset "+timeLabel(latest.reset_at);
    }else{
      $("chatTimeToReset").textContent=(m.hoursToReset/24).toFixed(1)+"d";
      $("chatResetDetail").textContent="Reset "+timeLabel(latest.reset_at);
    }
  }else{
    $("chatTimeToReset").textContent="—";$("chatResetDetail").textContent="Add a reset time";
  }

  $("chatCycleRate").textContent=m.cycleRate!==null?m.cycleRate.toFixed(1)+"% / day":"—";
  $("chatCycleRateDetail").textContent=m.cycleRate!==null?"Average across current observed cycle":"Needs 2 checkpoints";
  $("chatCycleChange").textContent=latest?m.cycleChange.toFixed(1)+"%":"—";
  $("chatPaceStatus").textContent=m.pace;
  $("chatPaceStatus").className=m.paceClass;
  $("chatPaceDetail").textContent=m.staleHours>24
    ?"Latest checkpoint is "+(m.staleHours/24).toFixed(1)+" days old"
    :m.pace==="At risk"&&m.projected?"Projected exhaustion "+timeLabel(m.projected)
    :m.pace==="On pace"&&latest?.reset_at?"Reset precedes projected exhaustion"
    :m.pace==="Trend only"?"Add reset time for risk comparison"
    :"Needs trend + reset";

  const rows=[...state.chatSnapshots].reverse();
  $("chatHistory").innerHTML=rows.length?rows.map(r=>{
    const chronological=state.chatSnapshots.findIndex(x=>x.id===r.id);
    const prev=chronological>0?state.chatSnapshots[chronological-1]:null;
    const sameCycle=prev&&num(r.used)>=num(prev.used)&&((r.reset_at||"")===(prev.reset_at||"")||!r.reset_at||!prev.reset_at);
    const change=sameCycle?(num(r.used)-num(prev.used)).toFixed(1)+"%":"—";
    return '<tr><td>'+timeLabel(r.recorded_at)+'</td><td>'+num(r.used).toFixed(1)+'%</td><td>'+(100-num(r.used)).toFixed(1)+'%</td><td>'+change+'</td><td>'+(r.reset_at?timeLabel(r.reset_at):"—")+'</td><td>'+esc(r.note||"")+'</td><td><button class="button chat-delete" type="button" data-id="'+esc(r.id)+'">Delete</button></td></tr>';
  }).join(""):'<tr><td colspan="7">No ChatGPT checkpoints yet.</td></tr>';
  qsa(".chat-delete").forEach(b=>b.onclick=()=>{
    state.chatSnapshots=state.chatSnapshots.filter(x=>x.id!==b.dataset.id);
    saveChatSnapshots();renderChatGPT();
  });
  drawChatUsageChart();
}
function drawChatUsageChart(){
  const canvas=$("chatUsageChart");
  if(!canvas)return;
  const rows=state.chatSnapshots,{ctx,w,h}=canvasSetup(canvas),p={l:42,r:12,t:18,b:34},cw=w-p.l-p.r,ch=h-p.t-p.b;
  ctx.font="11px system-ui";ctx.strokeStyle=css("--line");ctx.fillStyle=css("--muted");ctx.lineWidth=1;
  for(let i=0;i<=4;i++){const value=100-i*25,y=p.t+ch*i/4;ctx.beginPath();ctx.moveTo(p.l,y);ctx.lineTo(w-p.r,y);ctx.stroke();ctx.fillText(value+"%",4,y+4)}
  if(!rows.length){ctx.fillText("Add a checkpoint to start the usage curve.",p.l+10,p.t+20);return}
  ctx.beginPath();ctx.strokeStyle=css("--accent");ctx.lineWidth=2.5;ctx.lineJoin="round";ctx.lineCap="round";
  rows.forEach((r,i)=>{
    const x=p.l+(rows.length===1?cw/2:i*cw/(rows.length-1)),y=p.t+ch-(num(r.used)/100*ch);
    i?ctx.lineTo(x,y):ctx.moveTo(x,y);
  });ctx.stroke();
  rows.forEach((r,i)=>{const x=p.l+(rows.length===1?cw/2:i*cw/(rows.length-1)),y=p.t+ch-(num(r.used)/100*ch);ctx.beginPath();ctx.fillStyle=css("--accent");ctx.arc(x,y,3.5,0,Math.PI*2);ctx.fill()});
  ctx.fillStyle=css("--muted");ctx.textAlign="center";const every=Math.max(1,Math.ceil(rows.length/5));
  rows.forEach((r,i)=>{if(i%every&&i!==rows.length-1)return;const x=p.l+(rows.length===1?cw/2:i*cw/(rows.length-1));ctx.fillText(dateLabel(r.recorded_at),x,h-9)});ctx.textAlign="start";
}
function exportChatSnapshots(){
  const payload={schema_version:2,source:"manual-chatgpt-subscription-checkpoints",exported_at:new Date().toISOString(),snapshots:state.chatSnapshots};
  const blob=new Blob([JSON.stringify(payload,null,2)],{type:"application/json"});
  const url=URL.createObjectURL(blob),a=document.createElement("a");
  a.href=url;a.download="tokentrack-chatgpt-checkpoints.json";a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}

function renderOverview(){
  const d=state.data,t=d.totals||{},r=d.run_rate||{},s=d.statistics||{},chg=d.comparison?.delta||{};
  $("totalTokens").textContent=fmt(t.total_tokens);$("tokenDelta").innerHTML=delta(chg.total_tokens_pct);
  $("totalCost").textContent=money(t.cost);$("costDelta").innerHTML=delta(chg.cost_pct);
  $("cacheRate").textContent=percent(t.cache_ratio);$("cacheDetail").textContent=fmt(t.cached_input_tokens)+" cached · "+fmt(t.cache_write_tokens)+" cache writes";
  $("avgTokens").textContent=fmt(t.avg_tokens_per_request);$("avgDetail").textContent=fmt(t.avg_input_per_request)+" in · "+fmt(t.avg_output_per_request)+" out";
  $("costPerRequest").textContent=money(t.cost_per_request);$("costPerM").textContent=money(t.cost_per_million_tokens)+" / 1M tokens";
  $("forecastCost").textContent=money(r.projected_30d_cost);$("forecastTokens").textContent=fmt(r.projected_30d_tokens)+" tokens";
  $("p95").textContent=fmt(s.p95_daily_tokens);$("peak").textContent=s.peak_day?"Peak "+dateLabel(s.peak_day)+" · "+fmt(s.peak_daily_tokens):"No peak";
  $("anomalyKpi").textContent=count((d.anomalies||[]).length);
  $("requests").textContent=count(t.requests);$("updated").textContent=timeLabel(d.generated_at);

  const insights=d.insights||[];$("insights").className="list"+(insights.length?"":" empty");
  $("insights").innerHTML=insights.length?insights.map(x=>'<div class="insight '+esc(x.type)+'"><strong>'+esc(x.title)+'</strong><p>'+esc(x.message)+'</p></div>').join(""):"No insight signals.";

  const anomalies=d.anomalies||[];$("anomalyBadge").textContent=count(anomalies.length);$("anomalies").className="list"+(anomalies.length?"":" empty");
  $("anomalies").innerHTML=anomalies.length?anomalies.map(x=>'<div class="anomaly '+esc(x.severity)+'"><strong>'+dateLabel(x.date)+' · '+fmt(x.value)+' tokens</strong><p>Baseline '+fmt(x.baseline)+' · z-score '+num(x.z_score).toFixed(2)+'</p></div>').join(""):"No statistically unusual spikes.";

  renderMovers("modelMovers",d.movers?.models||[]);
  renderMovers("projectMovers",d.movers?.projects||[]);
  renderCharts();
}
function renderMovers(id,rows){
  $(id).innerHTML=rows.length?rows.slice(0,7).map(r=>{
    const sign=num(r.delta_tokens)>=0?"+":"",cls=num(r.delta_tokens)>0?"negative":"positive";
    const pctv=r.delta_pct===null?"new":((num(r.delta_pct)>=0?"+":"")+num(r.delta_pct).toFixed(1)+"%");
    return'<div class="rankrow"><span title="'+esc(r.name)+'">'+esc(shortId(r.name))+'</span><b class="'+cls+'">'+sign+fmt(r.delta_tokens)+'</b><small>'+fmt(r.current_tokens)+' current · '+pctv+' vs prior</small></div>'
  }).join(""):'<div class="empty">No comparable movers.</div>';
}

function renderFinops(){
  const d=state.data,t=d.totals||{},r=d.run_rate||{},chg=d.comparison?.delta||{},g=d.governance||{},limit=g.spend_limit;
  $("finSpend").textContent=money(t.cost);$("finSpendDelta").innerHTML=delta(chg.cost_pct);$("finForecast").textContent=money(r.projected_30d_cost);
  if(limit){
    const l=num(limit.threshold_usd),ratio=l?r.projected_30d_cost/l:0,head=l-r.projected_30d_cost;
    $("hardLimit").textContent=money(l);$("hardLimitState").textContent=(limit.enforcement||"unknown")+" · "+(limit.interval||"month");
    $("limitUtil").textContent=percent(ratio);$("limitHeadroom").textContent=head>=0?money(head)+" projected headroom":money(Math.abs(head))+" projected over";
    $("meterForecast").textContent=money(r.projected_30d_cost)+" forecast";$("meterLimit").textContent=money(l)+" hard limit";
    $("limitBar").style.width=Math.min(100,ratio*100)+"%";$("limitBar").style.background=ratio>=1?"var(--danger)":ratio>=.8?"var(--warn)":"linear-gradient(90deg,var(--accent),var(--accent2))";
  }else{
    $("hardLimit").textContent="Not configured";$("hardLimitState").textContent="No OpenAI hard limit returned";$("limitUtil").textContent="—";$("limitHeadroom").textContent=state.localBudget?"Local target "+money(state.localBudget):"Set in OpenAI or local settings";
    $("meterForecast").textContent=money(r.projected_30d_cost)+" forecast";$("meterLimit").textContent=state.localBudget?money(state.localBudget)+" local target":"No hard limit";$("limitBar").style.width=state.localBudget?Math.min(100,r.projected_30d_cost/state.localBudget*100)+"%":"0%";
  }

  const alerts=g.spend_alerts||[],maxAlert=Math.max(...alerts.map(a=>a.threshold_usd),1);
  $("spendAlerts").innerHTML=alerts.length?alerts.map(a=>'<div class="rankrow"><span>'+money(a.threshold_usd)+' / '+esc(a.interval)+'</span><b>'+esc(a.channel)+'</b><small>'+count(a.recipient_count)+' recipient(s)<div class="progress"><i style="width:'+Math.min(100,a.threshold_usd/maxAlert*100)+'%"></i></div></small></div>').join(""):'<div class="empty">No native OpenAI spend alerts returned.</div>';

  const lines=d.distribution?.cost_line_items||[],maxCost=Math.max(...lines.map(x=>x.cost),1);
  $("costLines").innerHTML=lines.length?lines.map(x=>'<div class="rankrow"><span>'+esc(x.name)+'</span><b>'+money(x.cost)+'</b><small><div class="progress"><i style="width:'+Math.min(100,x.cost/maxCost*100)+'%"></i></div></small></div>').join(""):'<div class="empty">No cost line items.</div>';

  renderCostTable("projectCostTable",d.distribution?.projects||[],false);
  renderCostTable("apiKeyCostTable",d.distribution?.api_keys||[],true);
}
function renderCostTable(id,rows,isKey){
  const keyCostSupported=Boolean(state.data.coverage?.api_key_cost_attribution);
  $(id).innerHTML=rows.length?rows.map(r=>{
    const cache=r.input_tokens?r.cached_input_tokens/r.input_tokens:0;
    return isKey
      ?'<tr><td title="'+esc(r.name)+'">'+esc(shortId(r.name))+'</td><td>'+fmt(r.total_tokens)+'</td><td>'+count(r.requests)+'</td><td>'+(keyCostSupported?money(r.cost):'Unavailable')+'</td><td>'+percent(r.token_share)+'</td><td>'+percent(cache)+'</td></tr>'
      :'<tr><td title="'+esc(r.name)+'">'+esc(shortId(r.name))+'</td><td>'+fmt(r.total_tokens)+'</td><td>'+count(r.requests)+'</td><td>'+money(r.cost)+'</td><td>'+money(r.requests?r.cost/r.requests:0)+'</td><td>'+percent(cache)+'</td></tr>'
  }).join(""):'<tr><td colspan="6">No attributed usage.</td></tr>';
}

const attrLabels={models:"Models",projects:"Projects",api_keys:"API Keys",users:"Users",service_tiers:"Service tiers",batch_modes:"Batch mode"};
function renderAttribution(){
  const rows=state.data.distribution?.[state.attr]||[];$("attrTitle").textContent=attrLabels[state.attr]||state.attr;
  $("attrTable").innerHTML=rows.length?rows.map(r=>{
    const cache=r.input_tokens?r.cached_input_tokens/r.input_tokens:0;
    const costCell=state.attr==="projects"?money(r.cost):state.attr==="api_keys"?(state.data.coverage?.api_key_cost_attribution?money(r.cost):"Unavailable"):"—";
    return'<tr><td title="'+esc(r.name)+'">'+esc(shortId(r.name))+'</td><td>'+fmt(r.total_tokens)+'</td><td>'+percent(r.token_share)+'</td><td>'+fmt(r.input_tokens)+'</td><td>'+fmt(r.output_tokens)+'</td><td>'+fmt(r.cached_input_tokens)+'</td><td>'+percent(cache)+'</td><td>'+count(r.requests)+'</td><td>'+fmt(r.avg_tokens_per_request)+'</td><td>'+costCell+'</td></tr>'
  }).join(""):'<tr><td colspan="10">No data.</td></tr>';
}

function renderTools(){
  const rows=state.data.resources||[];
  $("resourceCards").innerHTML=rows.length?rows.map(r=>{
    const primary=r.tool_calls||r.requests||r.images||r.sessions||r.usage_bytes||r.seconds||r.characters;
    return'<div class="resourcecard"><span>'+esc(r.source.replaceAll("_"," "))+'</span><strong>'+fmt(primary)+'</strong><small>'+resourceDetail(r)+'</small></div>'
  }).join(""):'<div class="empty">No tool/resource activity.</div>';
  $("resourceTable").innerHTML=rows.length?rows.map(r=>'<tr><td>'+esc(r.source)+'</td><td>'+count(r.tool_calls||r.requests)+'</td><td>'+count(r.images)+'</td><td>'+count(r.characters)+'</td><td>'+count(r.seconds)+'</td><td>'+bytes(r.usage_bytes)+'</td><td>'+count(r.sessions)+'</td></tr>').join(""):'<tr><td colspan="7">No resource activity.</td></tr>';

  const sources=state.data.distribution?.sources||[];
  $("sourceCards").innerHTML=sources.length?sources.map(r=>'<div class="resourcecard"><span>'+esc(r.name)+'</span><strong>'+fmt(r.total_tokens)+'</strong><small>'+percent(r.token_share)+' of tokens · '+count(r.requests)+' requests</small></div>').join(""):'<div class="empty">No token sources.</div>';
}
function resourceDetail(r){
  const parts=[];if(r.tool_calls)parts.push(count(r.tool_calls)+" calls");if(r.images)parts.push(count(r.images)+" images");if(r.seconds)parts.push(count(r.seconds)+" sec");if(r.usage_bytes)parts.push(bytes(r.usage_bytes));if(r.sessions)parts.push(count(r.sessions)+" sessions");if(r.characters)parts.push(fmt(r.characters)+" chars");return parts.join(" · ")||"No activity";
}

function populateFilters(){
  const rows=state.data.raw?.usage||[];
  fillSelect("filterModel",rows.map(r=>r.model));fillSelect("filterProject",rows.map(r=>r.project_id));fillSelect("filterKey",rows.map(r=>r.api_key_id));fillSelect("filterUser",rows.map(r=>r.user_id));fillSelect("filterTier",rows.map(r=>r.service_tier));fillSelect("filterMode",rows.map(r=>r.batch));
}
function fillSelect(id,values){
  const el=$(id),selected=el.value,label=el.options[0]?.text||"All";const vals=[...new Set(values.filter(v=>v&&v!=="unknown"&&v!=="unassigned"))].sort();
  el.innerHTML='<option value="">'+esc(label)+'</option>'+vals.map(v=>'<option value="'+esc(v)+'">'+esc(shortId(v))+'</option>').join("");if(vals.includes(selected))el.value=selected;
}
function explorerRows(){
  const vals={model:$("filterModel").value,project_id:$("filterProject").value,api_key_id:$("filterKey").value,user_id:$("filterUser").value,service_tier:$("filterTier").value,batch:$("filterMode").value};
  const search=$("filterSearch").value.trim().toLowerCase();
  return(state.data.raw?.usage||[]).filter(r=>{
    for(const[k,v]of Object.entries(vals))if(v&&String(r[k])!==v)return false;
    if(search&&!([r.source,r.model,r.project_id,r.api_key_id,r.user_id,r.service_tier,r.batch].join(" ").toLowerCase().includes(search)))return false;
    return true;
  }).sort((a,b)=>b.start_time-a.start_time);
}
function renderExplorer(){
  if(!state.data)return;const rows=explorerRows(),tot=rows.reduce((a,r)=>{a.input+=num(r.input_tokens);a.output+=num(r.output_tokens);a.cached+=num(r.cached_input_tokens);a.requests+=num(r.requests);return a},{input:0,output:0,cached:0,requests:0});
  $("filteredRows").textContent=count(rows.length);$("filteredTokens").textContent=fmt(tot.input+tot.output);$("filteredRequests").textContent=count(tot.requests);$("filteredCache").textContent=percent(tot.input?tot.cached/tot.input:0);
  $("explorerTable").innerHTML=rows.length?rows.slice(0,500).map(r=>'<tr><td>'+dateLabel(r.timestamp)+'</td><td>'+esc(r.source)+'</td><td>'+esc(r.model)+'</td><td title="'+esc(r.project_id)+'">'+esc(shortId(r.project_id))+'</td><td title="'+esc(r.api_key_id)+'">'+esc(shortId(r.api_key_id))+'</td><td title="'+esc(r.user_id)+'">'+esc(shortId(r.user_id))+'</td><td>'+esc(r.service_tier)+'</td><td>'+esc(r.batch)+'</td><td>'+fmt(r.input_tokens)+'</td><td>'+fmt(r.output_tokens)+'</td><td>'+fmt(r.cached_input_tokens)+'</td><td>'+count(r.requests)+'</td></tr>').join(""):'<tr><td colspan="12">No rows match the filters.</td></tr>';
}

function renderDiagnostics(){
  const d=state.data,h=state.health||{},items=[
    ["Service",h.ok?"Healthy":"Unknown"],["Version",h.version||d.version||"—"],["API key",h.key_configured?"Configured":"Missing"],["Uptime",formatDuration(h.uptime_seconds)],
    ["Data state",d.stale?"Stale fallback":"Live"],["Cache",d.cache_status||"—"],["Warnings",count((d.warnings||[]).length)],["Tool sources",count((d.resources||[]).length)],
    ["Models",count((d.distribution?.models||[]).length)],["Projects",count((d.distribution?.projects||[]).length)],["API keys",count((d.distribution?.api_keys||[]).length)],["Key-level cost",d.coverage?.api_key_cost_attribution?"Available":"Unavailable"],["Spend limit",d.coverage?.spend_limit||"unknown"],["Spend alerts",d.coverage?.spend_alerts||"unknown"],["Password",h.password_protected?"Enabled":"Off"]
  ];
  $("diagnostics").innerHTML=items.map(([a,b])=>'<div class="diag"><span>'+esc(a)+'</span><strong>'+esc(b)+'</strong></div>').join("");
}
function formatDuration(s){s=Math.max(0,Math.floor(num(s)));const d=Math.floor(s/86400),h=Math.floor(s%86400/3600),m=Math.floor(s%3600/60);return(d?d+"d ":"")+(h?h+"h ":"")+m+"m"}

function canvasSetup(canvas){const ratio=devicePixelRatio||1,w=Math.max(320,canvas.clientWidth),h=300;canvas.width=w*ratio;canvas.height=h*ratio;const ctx=canvas.getContext("2d");ctx.setTransform(ratio,0,0,ratio,0,0);ctx.clearRect(0,0,w,h);return{ctx,w,h}}
const css=n=>getComputedStyle(document.documentElement).getPropertyValue(n).trim();
function lineChart(canvas,rows,series,formatter){
  const{ctx,w,h}=canvasSetup(canvas),p={l:55,r:12,t:18,b:34},cw=w-p.l-p.r,ch=h-p.t-p.b,max=Math.max(1,...rows.flatMap(r=>series.map(s=>num(r[s.key]))));
  ctx.font="11px system-ui";ctx.fillStyle=css("--muted");ctx.strokeStyle=css("--line");ctx.lineWidth=1;
  for(let i=0;i<=4;i++){const y=p.t+ch*i/4;ctx.beginPath();ctx.moveTo(p.l,y);ctx.lineTo(w-p.r,y);ctx.stroke();ctx.fillText(formatter(max*(1-i/4)),3,y+4)}
  if(!rows.length){ctx.fillText("No data",p.l+10,p.t+20);return}
  series.forEach(s=>{ctx.beginPath();ctx.strokeStyle=css(s.color);ctx.lineWidth=2;ctx.lineJoin="round";ctx.lineCap="round";rows.forEach((r,i)=>{const x=p.l+(rows.length===1?cw/2:i*cw/(rows.length-1)),y=p.t+ch-num(r[s.key])/max*ch;i?ctx.lineTo(x,y):ctx.moveTo(x,y)});ctx.stroke()});
  ctx.fillStyle=css("--muted");ctx.textAlign="center";const every=Math.max(1,Math.ceil(rows.length/6));rows.forEach((r,i)=>{if(i%every&&i!==rows.length-1)return;const x=p.l+(rows.length===1?cw/2:i*cw/(rows.length-1));ctx.fillText(dateLabel(r.date),x,h-9)});ctx.textAlign="start";
}
function renderCharts(){if(!state.data)return;const rows=state.data.daily||[];lineChart($("tokenChart"),rows,[{key:"input_tokens",color:"--input"},{key:"output_tokens",color:"--output"}],fmt);lineChart($("costChart"),rows,[{key:"cost",color:"--good"}],money)}

async function load(notify=false){
  if(state.loading)return;state.loading=true;setLive("","Refreshing","Pulling OpenAI organization telemetry…");
  try{
    const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),45000);
    const [ar,hr]=await Promise.all([fetch("/api/analytics?days="+state.days,{cache:"no-store",signal:controller.signal}),fetch("/health",{cache:"no-store",signal:controller.signal})]);clearTimeout(timeout);
    const data=await ar.json().catch(()=>({error:"Invalid analytics response"}));state.health=await hr.json().catch(()=>({}));
    if(!ar.ok)throw new Error(data.error||"HTTP "+ar.status);
    state.data=data;state.lastLoaded=Date.now();state.nextRefresh=Date.now()+state.refreshSeconds*1000;
    setLive(data.stale?"error":"live",data.stale?"Stale fallback":"Live 24/7",data.stale?"Serving last-known-good telemetry.":"Fresh OpenAI Usage + Costs telemetry.");
    show("errorBanner",false);render();if(notify)toast("Telemetry refreshed");
  }catch(e){
    const msg=e.name==="AbortError"?"Telemetry request timed out":e.message;setLive("error","Not updating",msg);show("errorBanner",true,'<strong>Telemetry error:</strong> '+esc(msg));
  }finally{state.loading=false}
}
function countdown(){
  if(!state.autoRefresh){$("countdown").textContent="Paused";return}
  const left=Math.max(0,Math.ceil((state.nextRefresh-Date.now())/1000));$("countdown").textContent=left+"s";if(!state.loading&&left<=0)load(false);
}

qsa(".nav").forEach(b=>b.onclick=()=>setTab(b.dataset.tab));
$("chatParseText").onclick=()=>{
  const parsed=parseChatUsageText($("chatPasteText").value);
  const result=$("chatParseResult");
  if(parsed.used!==null)$("chatUsagePercent").value=parsed.used.toFixed(1);
  if(parsed.resetAt)$("chatResetAt").value=toLocalDateTimeInput(parsed.resetAt);
  result.textContent=parsed.message;
  result.className="parse-result "+(parsed.used!==null?"good":"warn");
};
$("chatImportFile").onchange=async e=>{
  const file=e.target.files?.[0];if(!file)return;
  try{
    const payload=JSON.parse(await file.text());
    const added=importChatBackup(payload);
    toast("Imported "+added+" checkpoint"+(added===1?"":"s"));
  }catch(err){toast("Import failed: "+err.message)}
  e.target.value="";
};
$("chatCheckpointForm").onsubmit=e=>{
  e.preventDefault();
  const used=Number($("chatUsagePercent").value);
  if(!Number.isFinite(used)||used<0||used>100){toast("Enter a usage percentage from 0 to 100");return}
  addChatSnapshot(used,$("chatResetAt").value,$("chatNote").value);
  $("chatUsagePercent").value="";$("chatNote").value="";
  toast("ChatGPT checkpoint saved");
};
$("chatExport").onclick=()=>exportChatSnapshots();
$("chatClear").onclick=()=>{
  if(!state.chatSnapshots.length)return;
  if(confirm("Clear all locally saved ChatGPT usage checkpoints?")){
    state.chatSnapshots=[];saveChatSnapshots();renderChatGPT();toast("Checkpoint history cleared");
  }
};
qsa(".chip").forEach(b=>b.onclick=()=>{state.attr=b.dataset.attr;qsa(".chip").forEach(x=>x.classList.toggle("active",x===b));renderAttribution()});
$("refresh").onclick=()=>load(true);
$("days").value=String(state.days);$("days").onchange=e=>{state.days=Number(e.target.value);localStorage.setItem("tt-days",state.days);load(false)};
$("refreshInterval").value=String(state.refreshSeconds);$("refreshInterval").onchange=e=>{state.refreshSeconds=Number(e.target.value);localStorage.setItem("tt-refresh",state.refreshSeconds);state.nextRefresh=Date.now()+state.refreshSeconds*1000};
$("autoRefresh").checked=state.autoRefresh;$("autoRefresh").onchange=e=>{state.autoRefresh=e.target.checked;localStorage.setItem("tt-auto",String(state.autoRefresh));state.nextRefresh=Date.now()+state.refreshSeconds*1000};
$("localBudget").value=state.localBudget||"";$("localBudget").oninput=e=>{state.localBudget=Math.max(0,num(e.target.value));localStorage.setItem("tt-budget",state.localBudget);if(state.data)renderFinops()};
$("theme").value=state.theme;$("theme").onchange=e=>{state.theme=e.target.value;localStorage.setItem("tt-theme",state.theme);document.documentElement.dataset.theme=state.theme;renderCharts()};
qsa(".export").forEach(b=>b.onclick=()=>location.href="/api/export?days="+state.days+"&type="+encodeURIComponent(b.dataset.export));
["filterModel","filterProject","filterKey","filterUser","filterTier","filterMode"].forEach(id=>$(id).onchange=renderExplorer);$("filterSearch").oninput=renderExplorer;
$("clearFilters").onclick=()=>{["filterModel","filterProject","filterKey","filterUser","filterTier","filterMode","filterSearch"].forEach(id=>$(id).value="");renderExplorer()};
document.addEventListener("visibilitychange",()=>{if(!document.hidden&&Date.now()-state.lastLoaded>30000)load(false)});
addEventListener("online",()=>load(false));addEventListener("offline",()=>setLive("error","Offline","Waiting for network"));
let rt;addEventListener("resize",()=>{clearTimeout(rt);rt=setTimeout(()=>{renderCharts();drawChatUsageChart()},120)});
setInterval(countdown,1000);
document.documentElement.dataset.theme=state.theme;state.nextRefresh=Date.now()+state.refreshSeconds*1000;
$("apiControls").classList.add("hidden");
renderChatGPT();
load(false);
