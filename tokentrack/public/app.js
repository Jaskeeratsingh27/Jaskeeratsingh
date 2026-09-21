const $ = id => document.getElementById(id);
const qsa = sel => [...document.querySelectorAll(sel)];
const nf = new Intl.NumberFormat();
const compact = new Intl.NumberFormat(undefined,{notation:"compact",maximumFractionDigits:2});
const usd = new Intl.NumberFormat(undefined,{style:"currency",currency:"USD",minimumFractionDigits:2,maximumFractionDigits:4});

const state = {
  data:null,
  health:null,
  days:Number(localStorage.getItem("tt-days") || 30),
  refreshSeconds:Number(localStorage.getItem("tt-refresh") || 60),
  autoRefresh:localStorage.getItem("tt-auto") !== "false",
  budget:Number(localStorage.getItem("tt-budget") || 0),
  theme:localStorage.getItem("tt-theme") || "dark",
  lastLoadedAt:0,
  nextRefreshAt:0,
  loading:false
};

function num(v){const n=Number(v);return Number.isFinite(n)?n:0}
function fmt(v){return compact.format(num(v))}
function count(v){return nf.format(Math.round(num(v)))}
function money(v){return usd.format(num(v))}
function percent(v,d=1){return (num(v)*100).toFixed(d)+"%"}
function esc(v){return String(v??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]))}
function dateLabel(v){return v?new Date(v+"T00:00:00Z").toLocaleDateString(undefined,{month:"short",day:"numeric"}):"—"}
function timeLabel(v){return v?new Date(v).toLocaleString():"—"}
function bytes(v){const n=num(v);if(!n)return "0 B";const units=["B","KB","MB","GB","TB"];const i=Math.min(units.length-1,Math.floor(Math.log(n)/Math.log(1024)));return (n/(1024**i)).toFixed(i?1:0)+" "+units[i]}

function deltaText(value){
  if(value===null||value===undefined||!Number.isFinite(Number(value))) return '<span class="delta flat">No baseline</span>';
  const n=Number(value),cls=n>1?"up":n<-1?"down":"flat",arrow=n>1?"↑":n<-1?"↓":"→";
  return '<span class="delta '+cls+'">'+arrow+" "+Math.abs(n).toFixed(1)+"% vs prior period</span>";
}

function toast(message){
  const el=$("toast");el.textContent=message;el.classList.add("show");
  clearTimeout(window.__ttToast);window.__ttToast=setTimeout(()=>el.classList.remove("show"),2200);
}

function setLive(kind,label,detail){
  $("liveDot").className="pulse-dot "+kind;
  $("liveLabel").textContent=label;
  $("freshnessLabel").textContent=detail||"";
  $("serviceDot").className="status-dot "+kind;
  $("serviceText").textContent=label;
}

function setTab(name){
  qsa(".nav-item").forEach(b=>b.classList.toggle("active",b.dataset.tab===name));
  qsa(".tab-panel").forEach(p=>p.classList.toggle("active",p.id==="tab-"+name));
  if(name==="overview") requestAnimationFrame(renderCharts);
}

function applyTheme(){
  document.documentElement.dataset.theme=state.theme;
  $("themeSelect").value=state.theme;
  requestAnimationFrame(renderCharts);
}

function showBanner(id,show,html){
  const el=$(id);el.classList.toggle("hidden",!show);if(html!==undefined)el.innerHTML=html;
}

function render(){
  if(!state.data)return;
  const d=state.data,t=d.totals||{},delta=d.comparison?.delta||{},stats=d.statistics||{},run=d.run_rate||{};

  $("kpiTokens").textContent=fmt(t.total_tokens);
  $("deltaTokens").innerHTML=deltaText(delta.total_tokens_pct);
  $("kpiCost").textContent=money(t.cost);
  $("deltaCost").innerHTML=deltaText(delta.cost_pct);
  $("kpiRequests").textContent=count(t.requests);
  $("deltaRequests").innerHTML=deltaText(delta.requests_pct);
  $("kpiCache").textContent=percent(t.cache_ratio);
  $("cacheTokens").textContent=fmt(t.cached_input_tokens)+" cached tokens";
  $("kpiAvgRequest").textContent=fmt(t.avg_tokens_per_request);
  $("avgRequestDetail").textContent=fmt(t.avg_input_per_request)+" in · "+fmt(t.avg_output_per_request)+" out";
  $("kpiCostPerM").textContent=money(t.cost_per_million_tokens);
  $("kpiRunRate").textContent=money(run.projected_30d_cost);
  $("runRateTokens").textContent=fmt(run.projected_30d_tokens)+" projected tokens";
  $("kpiP95").textContent=fmt(stats.p95_daily_tokens);
  $("peakDay").textContent=stats.peak_day?"Peak "+dateLabel(stats.peak_day)+" · "+fmt(stats.peak_daily_tokens):"No peak yet";
  $("requestCount").textContent=count(t.requests);
  $("updatedAt").textContent=timeLabel(d.generated_at);
  $("inputTokens").textContent=fmt(t.input_tokens);
  $("inputShare").textContent=percent(t.total_tokens?t.input_tokens/t.total_tokens:0)+" of total";
  $("outputTokens").textContent=fmt(t.output_tokens);
  $("outputRatio").textContent=(num(t.output_input_ratio)).toFixed(2)+"× output/input";
  $("dailyAverage").textContent=fmt(run.daily_tokens);
  const cv=stats.mean_daily_tokens?stats.daily_token_stddev/stats.mean_daily_tokens:0;
  $("volatility").textContent=percent(cv,0)+" coefficient of variation";

  $("versionLabel").textContent="TokenTrack v"+(d.version||"—");
  renderBudget();
  renderInsights();
  renderAnomalies();
  renderModels();
  renderProjects();
  renderSources();
  renderCostLines();
  renderComparison();
  renderDaily();
  renderResources();
  renderDiagnostics();
  renderCharts();

  showBanner("staleBanner",!!d.stale,d.stale?'<strong>Serving last-known-good telemetry.</strong> '+esc(d.stale_reason||"OpenAI upstream refresh failed."):"");
  showBanner("warningBanner",(d.warnings||[]).length>0,(d.warnings||[]).length?'<strong>Partial telemetry:</strong> '+esc(d.warnings.join(" · ")):"");
}

function renderBudget(){
  const p=$("budgetPanel");
  if(!state.budget){p.classList.add("hidden");return}
  p.classList.remove("hidden");
  const projected=num(state.data?.run_rate?.projected_30d_cost),ratio=state.budget?projected/state.budget:0;
  $("budgetProjection").textContent=money(projected)+" projected";
  $("budgetTarget").textContent="of "+money(state.budget)+" target";
  $("budgetBar").style.width=Math.min(100,ratio*100)+"%";
  $("budgetBar").style.background=ratio>1?"var(--danger)":ratio>.8?"var(--warning)":"linear-gradient(90deg,var(--accent),var(--accent2))";
}

function renderInsights(){
  const list=state.data.insights||[];
  $("insightList").className="insight-list"+(list.length?"":" empty-state");
  $("insightList").innerHTML=list.length?list.map(x=>'<div class="insight '+esc(x.type)+'"><strong>'+esc(x.title)+'</strong><p>'+esc(x.message)+'</p></div>').join(""):"No insights for this period.";
}

function renderAnomalies(){
  const list=state.data.anomalies||[];$("anomalyCount").textContent=count(list.length);
  $("anomalyList").className="anomaly-list"+(list.length?"":" empty-state");
  $("anomalyList").innerHTML=list.length?list.map(x=>'<div class="anomaly '+esc(x.severity)+'"><strong>'+dateLabel(x.date)+' · '+fmt(x.value)+' tokens</strong><p>Baseline '+fmt(x.baseline)+' · z-score '+num(x.z_score).toFixed(2)+' · '+esc(x.severity)+' severity</p></div>').join(""):"No statistically unusual spikes detected.";
}

function renderModels(){
  const rows=state.data.distribution?.models||[];
  $("modelsTable").innerHTML=rows.length?rows.map(r=>{
    const cache=r.input_tokens?r.cached_input_tokens/r.input_tokens:0;
    return '<tr><td class="primary-cell">'+esc(r.name)+'</td><td>'+fmt(r.total_tokens)+'</td><td class="share-cell"><div class="mini-bar"><div class="progress"><i style="width:'+Math.min(100,r.token_share*100)+'%"></i></div>'+percent(r.token_share)+'</div></td><td>'+fmt(r.input_tokens)+'</td><td>'+fmt(r.output_tokens)+'</td><td>'+fmt(r.cached_input_tokens)+'</td><td>'+percent(cache)+'</td><td>'+count(r.requests)+'</td><td>'+fmt(r.avg_tokens_per_request)+'</td></tr>';
  }).join(""):'<tr><td colspan="9" class="subtle">No model usage.</td></tr>';
}

function renderProjects(){
  const rows=state.data.distribution?.projects||[];
  $("projectsTable").innerHTML=rows.length?rows.map(r=>{
    const cache=r.input_tokens?r.cached_input_tokens/r.input_tokens:0;
    return '<tr><td class="primary-cell">'+esc(r.name)+'</td><td>'+fmt(r.total_tokens)+'</td><td>'+percent(r.token_share)+'</td><td>'+count(r.requests)+'</td><td>'+money(r.cost)+'</td><td>'+money(r.requests?r.cost/r.requests:0)+'</td><td>'+percent(cache)+'</td></tr>';
  }).join(""):'<tr><td colspan="7" class="subtle">No project usage.</td></tr>';
}

function renderSources(){
  const rows=state.data.distribution?.sources||[];
  $("sourceCards").innerHTML=rows.length?rows.map(r=>'<div class="source-card"><span>'+esc(r.name)+'</span><strong>'+fmt(r.total_tokens)+'</strong><small>'+percent(r.token_share)+' of tokens · '+count(r.requests)+' requests</small></div>').join(""):'<div class="subtle">No token source data.</div>';
}

function renderCostLines(){
  const rows=state.data.distribution?.cost_line_items||[],max=Math.max(...rows.map(r=>r.cost),1);
  $("costLineItems").innerHTML=rows.length?rows.map(r=>'<div class="rank-row"><span>'+esc(r.name)+'</span><strong>'+money(r.cost)+'</strong><div class="progress"><i style="width:'+Math.min(100,r.cost/max*100)+'%"></i></div></div>').join(""):'<div class="empty-state">No cost line items.</div>';
}

function renderComparison(){
  const d=state.data.comparison?.delta||{};
  const items=[
    ["Tokens",d.total_tokens_pct],["Cost",d.cost_pct],["Requests",d.requests_pct],
    ["Input",d.input_tokens_pct],["Output",d.output_tokens_pct],["Cached",d.cached_input_tokens_pct]
  ];
  $("comparisonGrid").innerHTML=items.map(([label,val])=>'<div class="comparison-item"><span>'+label+'</span><strong>'+((val===null||val===undefined)?"—":(val>=0?"+":"")+Number(val).toFixed(1)+"%")+'</strong></div>').join("");
}

function renderDaily(){
  const rows=[...(state.data.daily||[])].reverse();
  $("dailyTable").innerHTML=rows.length?rows.map(r=>'<tr><td class="primary-cell">'+dateLabel(r.date)+'</td><td>'+fmt(r.total_tokens)+'</td><td>'+fmt(r.input_tokens)+'</td><td>'+fmt(r.output_tokens)+'</td><td>'+fmt(r.cached_input_tokens)+'</td><td>'+count(r.requests)+'</td><td>'+money(r.cost)+'</td></tr>').join(""):'<tr><td colspan="7" class="subtle">No daily telemetry.</td></tr>';
}

function renderResources(){
  const rows=state.data.resources||[];
  $("resourceTable").innerHTML=rows.length?rows.map(r=>'<tr><td class="primary-cell">'+esc(r.source)+'</td><td>'+count(r.requests)+'</td><td>'+count(r.images)+'</td><td>'+count(r.characters)+'</td><td>'+count(r.seconds)+'</td><td>'+bytes(r.usage_bytes)+'</td><td>'+count(r.sessions)+'</td></tr>').join(""):'<tr><td colspan="7" class="subtle">No non-token resource usage in this period.</td></tr>';
}

function renderDiagnostics(){
  const d=state.data,h=state.health||{};
  const items=[
    ["Service",h.ok?"Healthy":"Unknown"],
    ["API key",h.key_configured?"Configured":"Missing"],
    ["Version",h.version||d.version||"—"],
    ["Uptime",h.uptime_seconds?formatDuration(h.uptime_seconds):"—"],
    ["Cache",d.cache_status||"—"],
    ["Data state",d.stale?"Stale fallback":"Live"],
    ["Warnings",count((d.warnings||[]).length)],
    ["Protected",h.password_protected?"Yes":"No"]
  ];
  $("diagnosticsGrid").innerHTML=items.map(([a,b])=>'<div class="diagnostic"><span>'+esc(a)+'</span><strong>'+esc(b)+'</strong></div>').join("");
}

function formatDuration(seconds){
  const s=Math.max(0,Math.floor(num(seconds))),d=Math.floor(s/86400),h=Math.floor((s%86400)/3600),m=Math.floor((s%3600)/60);
  return (d?d+"d ":"")+(h?h+"h ":"")+m+"m";
}

function canvasSetup(canvas){
  const ratio=window.devicePixelRatio||1,w=Math.max(320,canvas.clientWidth),h=300;
  canvas.width=w*ratio;canvas.height=h*ratio;const ctx=canvas.getContext("2d");ctx.setTransform(ratio,0,0,ratio,0,0);ctx.clearRect(0,0,w,h);return{ctx,w,h};
}

function css(name){return getComputedStyle(document.documentElement).getPropertyValue(name).trim()}

function drawLineChart(canvas,series,keys,formatter){
  const {ctx,w,h}=canvasSetup(canvas),pad={l:54,r:14,t:20,b:34},cw=w-pad.l-pad.r,ch=h-pad.t-pad.b;
  const values=series.flatMap(r=>keys.map(k=>num(r[k.key]))),max=Math.max(...values,1);
  ctx.font="11px system-ui";ctx.strokeStyle=css("--line");ctx.fillStyle=css("--muted");ctx.lineWidth=1;
  for(let i=0;i<=4;i++){const y=pad.t+ch*i/4;ctx.beginPath();ctx.moveTo(pad.l,y);ctx.lineTo(w-pad.r,y);ctx.stroke();ctx.fillText(formatter(max*(1-i/4)),4,y+4)}
  if(!series.length){ctx.fillText("No data",pad.l+10,pad.t+20);return}
  keys.forEach(k=>{
    ctx.beginPath();ctx.strokeStyle=css(k.color);ctx.lineWidth=2;ctx.lineJoin="round";ctx.lineCap="round";
    series.forEach((r,i)=>{const x=pad.l+(series.length===1?cw/2:i*cw/(series.length-1)),y=pad.t+ch-(num(r[k.key])/max*ch);i?ctx.lineTo(x,y):ctx.moveTo(x,y)});
    ctx.stroke();
  });
  const every=Math.max(1,Math.ceil(series.length/6));ctx.fillStyle=css("--muted");ctx.textAlign="center";
  series.forEach((r,i)=>{if(i%every&&i!==series.length-1)return;const x=pad.l+(series.length===1?cw/2:i*cw/(series.length-1));ctx.fillText(dateLabel(r.date),x,h-10)});
  ctx.textAlign="start";
}

function renderCharts(){
  if(!state.data)return;
  const daily=state.data.daily||[];
  drawLineChart($("tokenChart"),daily,[{key:"input_tokens",color:"--input"},{key:"output_tokens",color:"--output"}],v=>fmt(v));
  drawLineChart($("costChart"),daily,[{key:"cost",color:"--good"}],v=>money(v));
}

async function load(showToast=false){
  if(state.loading)return;state.loading=true;setLive("","Refreshing","Pulling latest organization telemetry…");
  try{
    const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),25000);
    const [analyticsResponse,healthResponse]=await Promise.all([
      fetch("/api/analytics?days="+state.days,{cache:"no-store",signal:controller.signal}),
      fetch("/health",{cache:"no-store",signal:controller.signal})
    ]);
    clearTimeout(timeout);
    const analytics=await analyticsResponse.json().catch(()=>({error:"Invalid analytics response"}));
    const health=await healthResponse.json().catch(()=>({}));
    state.health=health;

    if(!analyticsResponse.ok)throw new Error(analytics.error||("HTTP "+analyticsResponse.status));
    state.data=analytics;state.lastLoadedAt=Date.now();state.nextRefreshAt=Date.now()+state.refreshSeconds*1000;
    setLive(analytics.stale?"error":"live",analytics.stale?"Stale fallback":"Live 24/7",analytics.stale?"Upstream refresh failed; showing last-known-good data.":"Fresh from OpenAI organization telemetry.");
    showBanner("setupBanner",false);
    render();
    if(showToast)toast("Telemetry refreshed");
  }catch(error){
    const msg=error.name==="AbortError"?"Telemetry request timed out":error.message;
    setLive("error","Not updating",msg);
    if(msg.includes("OPENAI_ADMIN_KEY")){
      showBanner("setupBanner",true,'<strong>Live source not connected.</strong> Add <code>OPENAI_ADMIN_KEY</code> to the Railway service variables. The dashboard and 24/7 service are deployed; this secret is required to read organization usage.');
    }else{
      showBanner("setupBanner",true,'<strong>Telemetry error.</strong> '+esc(msg));
    }
  }finally{state.loading=false}
}

function updateCountdown(){
  if(!state.autoRefresh){$("refreshCountdown").textContent="Paused";return}
  const left=Math.max(0,Math.ceil((state.nextRefreshAt-Date.now())/1000));
  $("refreshCountdown").textContent=left+"s";
  if(!state.loading&&left<=0)load(false);
}

qsa(".nav-item").forEach(b=>b.addEventListener("click",()=>setTab(b.dataset.tab)));
$("refreshButton").addEventListener("click",()=>load(true));
$("daysSelect").value=String(state.days);
$("daysSelect").addEventListener("change",e=>{state.days=Number(e.target.value);localStorage.setItem("tt-days",state.days);load(false)});
$("refreshInterval").value=String(state.refreshSeconds);
$("refreshInterval").addEventListener("change",e=>{state.refreshSeconds=Number(e.target.value);localStorage.setItem("tt-refresh",state.refreshSeconds);state.nextRefreshAt=Date.now()+state.refreshSeconds*1000;toast("Refresh interval updated")});
$("autoRefresh").checked=state.autoRefresh;
$("autoRefresh").addEventListener("change",e=>{state.autoRefresh=e.target.checked;localStorage.setItem("tt-auto",String(state.autoRefresh));state.nextRefreshAt=Date.now()+state.refreshSeconds*1000});
$("budgetInput").value=state.budget||"";
$("budgetInput").addEventListener("input",e=>{state.budget=Math.max(0,num(e.target.value));localStorage.setItem("tt-budget",String(state.budget));if(state.data)renderBudget()});
$("themeSelect").addEventListener("change",e=>{state.theme=e.target.value;localStorage.setItem("tt-theme",state.theme);applyTheme()});
qsa(".export-button").forEach(b=>b.addEventListener("click",()=>{window.location.href="/api/export?days="+state.days+"&type="+encodeURIComponent(b.dataset.export)}));
document.addEventListener("visibilitychange",()=>{if(!document.hidden&&Date.now()-state.lastLoadedAt>30000)load(false)});
window.addEventListener("online",()=>load(false));
window.addEventListener("offline",()=>setLive("error","Offline","Waiting for network connection."));
let resizeTimer;window.addEventListener("resize",()=>{clearTimeout(resizeTimer);resizeTimer=setTimeout(renderCharts,120)});
setInterval(updateCountdown,1000);

applyTheme();
state.nextRefreshAt=Date.now()+state.refreshSeconds*1000;
load(false);
