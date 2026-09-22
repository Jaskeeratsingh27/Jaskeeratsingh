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
  chatSnapshots:loadChatSnapshots(),
  chatSyncKey:localStorage.getItem("tt-chat-sync-key-v1")||"",
  chatAutoSync:localStorage.getItem("tt-chat-auto-sync-v1")!=="false",
  chatSyncBusy:false,
  alertRules:loadAlertRules(),
  alertsEnabled:localStorage.getItem("tt-alerts-enabled-v1")!=="false",
  browserNotifications:localStorage.getItem("tt-browser-notifications-v1")==="true",
  alertEvents:loadAlertEvents(),
  activeAlerts:[],
  serverMonitor:null,
  deferredInstallPrompt:null
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


function loadAlertRules(){
  try{
    return {...{
      chatWarn:70,chatCritical:90,chatStaleHours:24,
      apiForecastUsd:25,apiTokenGrowthPct:50,apiCostGrowthPct:50
    },...JSON.parse(localStorage.getItem("tt-alert-rules-v1")||"{}")};
  }catch{return{chatWarn:70,chatCritical:90,chatStaleHours:24,apiForecastUsd:25,apiTokenGrowthPct:50,apiCostGrowthPct:50}}
}
function loadAlertEvents(){
  try{const rows=JSON.parse(localStorage.getItem("tt-alert-events-v1")||"[]");return Array.isArray(rows)?rows.slice(0,200):[]}catch{return[]}
}
function saveAlertRules(){localStorage.setItem("tt-alert-rules-v1",JSON.stringify(state.alertRules))}
function saveAlertEvents(){state.alertEvents=state.alertEvents.slice(0,200);localStorage.setItem("tt-alert-events-v1",JSON.stringify(state.alertEvents))}
function alertEvent(kind,alert){
  const event={id:(crypto.randomUUID?crypto.randomUUID():String(Date.now())+Math.random()),at:new Date().toISOString(),kind,key:alert.key,source:alert.source,severity:kind==="resolved"?"resolved":alert.severity,title:alert.title,message:alert.message};
  state.alertEvents.unshift(event);saveAlertEvents();
}
function maybeNotify(alert){
  if(!state.alertsEnabled||!state.browserNotifications)return;
  if(typeof Notification==="undefined"||Notification.permission!=="granted")return;
  try{new Notification("TokenTrack: "+alert.title,{body:alert.message,tag:"tokentrack-"+alert.key})}catch{}
}
function evaluateAlerts(){
  const next=[];
  const rules=state.alertRules;
  const m=chatMetrics(),latest=m.latest;
  if(state.alertsEnabled&&latest){
    const used=num(latest.used);
    if(used>=num(rules.chatCritical))next.push({key:"chat.usage.critical",source:"ChatGPT",severity:"critical",title:"ChatGPT usage critical",message:used.toFixed(1)+"% of the current allowance is consumed."});
    else if(used>=num(rules.chatWarn))next.push({key:"chat.usage.warning",source:"ChatGPT",severity:"warning",title:"ChatGPT usage warning",message:used.toFixed(1)+"% of the current allowance is consumed."});
    if(m.staleHours!==null&&m.staleHours>=num(rules.chatStaleHours))next.push({key:"chat.stale",source:"ChatGPT",severity:"warning",title:"ChatGPT checkpoint is stale",message:"Latest checkpoint is "+(m.staleHours/24).toFixed(1)+" days old."});
    if(m.pace==="At risk")next.push({key:"chat.exhaustion",source:"ChatGPT",severity:"critical",title:"Allowance exhaustion risk",message:m.projected?"Projected exhaustion "+timeLabel(m.projected)+" before reset.":"Current pace may exhaust the allowance before reset."});
    if(m.pace==="Reset due")next.push({key:"chat.resetdue",source:"ChatGPT",severity:"warning",title:"Allowance reset time passed",message:"The recorded reset time has passed; add a fresh checkpoint."});
  }
  if(state.alertsEnabled&&state.data){
    const d=state.data,r=d.run_rate||{},chg=d.comparison?.delta||{};
    if(d.stale)next.push({key:"api.stale",source:"OpenAI API",severity:"critical",title:"API telemetry is stale",message:"TokenTrack is serving last-known-good API telemetry."});
    if(num(rules.apiForecastUsd)>0&&num(r.projected_30d_cost)>=num(rules.apiForecastUsd))next.push({key:"api.forecast",source:"OpenAI API",severity:"warning",title:"API spend forecast threshold",message:"Projected 30-day spend is "+money(r.projected_30d_cost)+"."});
    if(chg.total_tokens_pct!==null&&num(chg.total_tokens_pct)>=num(rules.apiTokenGrowthPct))next.push({key:"api.token.growth",source:"OpenAI API",severity:"warning",title:"API token growth spike",message:"Token usage is up "+num(chg.total_tokens_pct).toFixed(1)+"% versus the prior period."});
    if(chg.cost_pct!==null&&num(chg.cost_pct)>=num(rules.apiCostGrowthPct))next.push({key:"api.cost.growth",source:"OpenAI API",severity:"warning",title:"API cost growth spike",message:"API cost is up "+num(chg.cost_pct).toFixed(1)+"% versus the prior period."});
    if((d.anomalies||[]).length)next.push({key:"api.anomalies",source:"OpenAI API",severity:"warning",title:"API usage anomalies detected",message:(d.anomalies||[]).length+" unusual usage spike(s) detected in the selected period."});
  }
  const priorKeys=new Set((JSON.parse(localStorage.getItem("tt-active-alert-keys-v1")||"[]")));
  const nextKeys=new Set(next.map(a=>a.key));
  for(const alert of next){if(!priorKeys.has(alert.key)){alertEvent("activated",alert);maybeNotify(alert)}}
  for(const key of priorKeys){
    if(!nextKeys.has(key)){
      const old=state.activeAlerts.find(a=>a.key===key)||{key,source:"TokenTrack",severity:"resolved",title:"Condition resolved",message:key};
      alertEvent("resolved",old);
    }
  }
  localStorage.setItem("tt-active-alert-keys-v1",JSON.stringify([...nextKeys]));
  state.activeAlerts=next;
  renderAlertCenter();
  renderAttentionBar();
}
function renderAttentionBar(){
  const bar=$("attentionBar");
  if(!state.activeAlerts.length){bar.classList.add("hidden");return}
  const sorted=[...state.activeAlerts].sort((a,b)=>(a.severity==="critical"?0:1)-(b.severity==="critical"?0:1));
  const top=sorted[0],critical=state.activeAlerts.some(a=>a.severity==="critical");
  bar.classList.remove("hidden");bar.classList.toggle("critical",critical);
  $("attentionSeverity").textContent=critical?"CRITICAL":"ATTENTION";
  $("attentionTitle").textContent=top.title;
  $("attentionText").textContent=top.message+(state.activeAlerts.length>1?" · "+(state.activeAlerts.length-1)+" more active":"");
}
function renderAlertCenter(){
  const active=state.activeAlerts,crit=active.filter(a=>a.severity==="critical").length,warn=active.filter(a=>a.severity==="warning").length;
  $("alertCenterBadge").textContent=active.length+" active";$("activeAlertCount").textContent=count(active.length);$("criticalAlertCount").textContent=count(crit);$("warningAlertCount").textContent=count(warn);
  $("activeAlertDetail").textContent=active.length?crit+" critical · "+warn+" warning":"No active conditions";
  const perm=typeof Notification==="undefined"?"unsupported":Notification.permission;
  $("notificationState").textContent=state.browserNotifications&&perm==="granted"?"On":"Off";
  $("notificationDetail").textContent=perm==="granted"?"Permission granted":perm==="denied"?"Permission blocked":perm==="unsupported"?"Not supported":"Permission not requested";
  const sm=state.serverMonitor;
  if(sm?.error){
    $("serverMonitorState").textContent="Error";$("serverMonitorDetail").textContent=sm.error;
  }else if(sm){
    $("serverMonitorState").textContent=sm.rules?.enabled===false?"Paused":"Running";
    $("serverMonitorDetail").textContent=sm.last_success_at?"Last success "+timeLabel(sm.last_success_at)+" · "+count((sm.active||[]).length)+" active":"Waiting for first background run";
    mergeServerMonitorEvents();
  }else{
    $("serverMonitorState").textContent="Loading";$("serverMonitorDetail").textContent="Fetching server monitor state";
  }
  $("activeAlerts").className="alert-list"+(active.length?"":" empty");
  $("activeAlerts").innerHTML=active.length?active.map(a=>'<div class="alert-item '+esc(a.severity)+'"><span class="sev">'+esc(a.severity.toUpperCase())+'</span><div><strong>'+esc(a.title)+'</strong><small>'+esc(a.source)+' · '+esc(a.message)+'</small></div><time>Now</time></div>').join(""):"No active alerts.";
  $("alertEvents").className="alert-list"+(state.alertEvents.length?"":" empty");
  $("alertEvents").innerHTML=state.alertEvents.length?state.alertEvents.slice(0,100).map(e=>'<div class="alert-item '+esc(e.severity)+'"><span class="sev">'+esc((e.kind==="resolved"?"RESOLVED":e.severity).toUpperCase())+'</span><div><strong>'+esc(e.title)+'</strong><small>'+esc(e.source)+' · '+esc(e.message)+'</small></div><time>'+esc(timeLabel(e.at))+'</time></div>').join(""):"No alert events yet.";
  $("ruleChatWarn").value=state.alertRules.chatWarn;$("ruleChatCritical").value=state.alertRules.chatCritical;$("ruleChatStale").value=state.alertRules.chatStaleHours;
  $("ruleApiForecast").value=state.alertRules.apiForecastUsd;$("ruleApiTokenGrowth").value=state.alertRules.apiTokenGrowthPct;$("ruleApiCostGrowth").value=state.alertRules.apiCostGrowthPct;
  $("alertsEnabled").checked=state.alertsEnabled;$("browserNotifications").checked=state.browserNotifications;
}
function updateAlertRulesFromUi(){
  state.alertRules={
    chatWarn:Math.max(1,Math.min(100,num($("ruleChatWarn").value)||70)),
    chatCritical:Math.max(1,Math.min(100,num($("ruleChatCritical").value)||90)),
    chatStaleHours:Math.max(1,num($("ruleChatStale").value)||24),
    apiForecastUsd:Math.max(0,num($("ruleApiForecast").value)),
    apiTokenGrowthPct:Math.max(1,num($("ruleApiTokenGrowth").value)||50),
    apiCostGrowthPct:Math.max(1,num($("ruleApiCostGrowth").value)||50)
  };
  if(state.alertRules.chatCritical<state.alertRules.chatWarn)state.alertRules.chatCritical=state.alertRules.chatWarn;
  saveAlertRules();evaluateAlerts();void syncServerMonitorRules();
}
async function requestBrowserNotificationPermission(){
  if(typeof Notification==="undefined"){toast("Browser notifications are not supported here");return}
  try{
    const result=await Notification.requestPermission();
    state.browserNotifications=result==="granted";
    localStorage.setItem("tt-browser-notifications-v1",String(state.browserNotifications));
    renderAlertCenter();
    toast(result==="granted"?"Browser notifications enabled":"Notification permission not granted");
  }catch(e){toast("Notification permission failed")}
}


async function loadServerMonitor(){
  try{
    const response=await fetch("/api/server-monitor",{cache:"no-store"});
    const data=await response.json().catch(()=>({error:"Invalid monitor response"}));
    if(!response.ok)throw new Error(data.error||("HTTP "+response.status));
    state.serverMonitor=data;
    renderAlertCenter();
  }catch(error){
    state.serverMonitor={error:error.message};
    renderAlertCenter();
  }
}
async function syncServerMonitorRules(){
  try{
    const response=await fetch("/api/server-monitor",{
      method:"PUT",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({rules:{
        enabled:state.alertsEnabled,
        forecast_usd:state.alertRules.apiForecastUsd,
        token_growth_pct:state.alertRules.apiTokenGrowthPct,
        cost_growth_pct:state.alertRules.apiCostGrowthPct,
        anomaly_count:1
      }})
    });
    const data=await response.json().catch(()=>({error:"Invalid monitor response"}));
    if(!response.ok)throw new Error(data.error||("HTTP "+response.status));
    await loadServerMonitor();
  }catch(error){toast("Background monitor update failed: "+error.message)}
}
function mergeServerMonitorEvents(){
  const remote=state.serverMonitor?.events||[];
  if(!remote.length)return;
  const existing=new Set(state.alertEvents.map(e=>e.id||[e.at,e.kind,e.key].join("|")));
  for(const e of remote){
    const key=e.id||[e.at,e.kind,e.key].join("|");
    if(existing.has(key))continue;
    state.alertEvents.push({...e,id:key});
    existing.add(key);
  }
  state.alertEvents.sort((a,b)=>new Date(b.at)-new Date(a.at));
  saveAlertEvents();
}
function fullRecoveryPayload(){
  return{
    schema_version:1,
    source:"tokentrack-recovery-kit",
    exported_at:new Date().toISOString(),
    excludes:["OPENAI_ADMIN_KEY","chat_sync_encryption_key"],
    chat_snapshots:state.chatSnapshots,
    alert_rules:state.alertRules,
    alert_events:state.alertEvents,
    preferences:{
      days:state.days,
      refresh_seconds:state.refreshSeconds,
      auto_refresh:state.autoRefresh,
      local_budget:state.localBudget,
      theme:state.theme,
      alerts_enabled:state.alertsEnabled,
      browser_notifications:state.browserNotifications,
      chat_auto_sync:state.chatAutoSync
    }
  };
}
function downloadJson(filename,payload){
  const blob=new Blob([JSON.stringify(payload,null,2)],{type:"application/json"});
  const url=URL.createObjectURL(blob),a=document.createElement("a");
  a.href=url;a.download=filename;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
function exportRecoveryKit(){
  downloadJson("tokentrack-recovery-kit.json",fullRecoveryPayload());
}
function restoreRecoveryKit(payload){
  if(!payload||payload.source!=="tokentrack-recovery-kit")throw new Error("Not a TokenTrack recovery kit.");
  if(Array.isArray(payload.chat_snapshots)){
    state.chatSnapshots=mergeSnapshotSets(state.chatSnapshots,payload.chat_snapshots);
    saveChatSnapshots();
  }
  if(payload.alert_rules&&typeof payload.alert_rules==="object"){
    state.alertRules={...state.alertRules,...payload.alert_rules};saveAlertRules();
  }
  if(Array.isArray(payload.alert_events)){
    const by=new Map(state.alertEvents.map(e=>[e.id||[e.at,e.kind,e.key].join("|"),e]));
    for(const e of payload.alert_events||[])by.set(e.id||[e.at,e.kind,e.key].join("|"),e);
    state.alertEvents=[...by.values()].sort((a,b)=>new Date(b.at)-new Date(a.at)).slice(0,200);saveAlertEvents();
  }
  const p=payload.preferences||{};
  if(Number.isFinite(Number(p.days))){state.days=Number(p.days);localStorage.setItem("tt-days",state.days)}
  if(Number.isFinite(Number(p.refresh_seconds))){state.refreshSeconds=Number(p.refresh_seconds);localStorage.setItem("tt-refresh",state.refreshSeconds)}
  if(typeof p.auto_refresh==="boolean"){state.autoRefresh=p.auto_refresh;localStorage.setItem("tt-auto",String(p.auto_refresh))}
  if(Number.isFinite(Number(p.local_budget))){state.localBudget=Math.max(0,Number(p.local_budget));localStorage.setItem("tt-budget",state.localBudget)}
  if(["dark","light"].includes(p.theme)){state.theme=p.theme;localStorage.setItem("tt-theme",state.theme)}
  if(typeof p.alerts_enabled==="boolean"){state.alertsEnabled=p.alerts_enabled;localStorage.setItem("tt-alerts-enabled-v1",String(p.alerts_enabled))}
  if(typeof p.browser_notifications==="boolean"){state.browserNotifications=p.browser_notifications;localStorage.setItem("tt-browser-notifications-v1",String(p.browser_notifications))}
  if(typeof p.chat_auto_sync==="boolean"){state.chatAutoSync=p.chat_auto_sync;localStorage.setItem("tt-chat-auto-sync-v1",String(p.chat_auto_sync))}
  document.documentElement.dataset.theme=state.theme;
  $("days").value=String(state.days);$("refreshInterval").value=String(state.refreshSeconds);$("autoRefresh").checked=state.autoRefresh;$("localBudget").value=state.localBudget||"";$("theme").value=state.theme;
  renderChatGPT();renderAlertCenter();evaluateAlerts();
  if(state.chatSyncKey&&state.chatAutoSync)queueChatAutoSync();
}
function pwaInstalled(){
  return matchMedia("(display-mode: standalone)").matches||window.navigator.standalone===true;
}
function renderPwaState(){
  const installed=pwaInstalled();
  $("pwaState").textContent=installed?"Installed app mode":"Browser mode";
  $("installAppSettings").disabled=installed;
  $("installAppSettings").textContent=installed?"TokenTrack installed":"Install TokenTrack";
  $("installApp").classList.toggle("hidden",installed||!state.deferredInstallPrompt);
}
async function installPwa(){
  if(pwaInstalled()){toast("TokenTrack is already installed");return}
  if(!state.deferredInstallPrompt){toast("Use your browser menu and choose Add to Home screen / Install app");return}
  state.deferredInstallPrompt.prompt();
  try{await state.deferredInstallPrompt.userChoice}catch{}
  state.deferredInstallPrompt=null;renderPwaState();
}
function registerPwa(){
  if("serviceWorker" in navigator){
    navigator.serviceWorker.register("/sw.js",{scope:"/"}).catch(()=>{});
  }
  addEventListener("beforeinstallprompt",event=>{
    event.preventDefault();state.deferredInstallPrompt=event;renderPwaState();
  });
  addEventListener("appinstalled",()=>{state.deferredInstallPrompt=null;renderPwaState();toast("TokenTrack installed")});
  renderPwaState();
}

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
  if(state.data)renderOverview();
  if(state.data)renderFinops();
  if(state.data)renderAttribution();
  if(state.data)renderTools();
  if(state.data)populateFilters();
  if(state.data)renderExplorer();
  if(state.data)renderDiagnostics();
  evaluateAlerts();
  if(!state.data)return;
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

function b64urlEncode(bytes){
  let binary="";const view=bytes instanceof Uint8Array?bytes:new Uint8Array(bytes);
  for(let i=0;i<view.length;i++)binary+=String.fromCharCode(view[i]);
  return btoa(binary).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"");
}
function b64urlDecode(value){
  const clean=String(value||"").trim().replace(/-/g,"+").replace(/_/g,"/");
  const padded=clean+"=".repeat((4-clean.length%4)%4),binary=atob(padded),out=new Uint8Array(binary.length);
  for(let i=0;i<binary.length;i++)out[i]=binary.charCodeAt(i);
  return out;
}
function bytesHex(bytes){return [...new Uint8Array(bytes)].map(b=>b.toString(16).padStart(2,"0")).join("")}
function concatBytes(a,b){const out=new Uint8Array(a.length+b.length);out.set(a);out.set(b,a.length);return out}
async function syncContext(code=state.chatSyncKey){
  if(!crypto?.subtle)throw new Error("WebCrypto is unavailable in this browser.");
  const raw=b64urlDecode(String(code||"").replace(/\s+/g,""));
  if(raw.length!==32)throw new Error("Invalid sync code.");
  const enc=new TextEncoder();
  const idDigest=await crypto.subtle.digest("SHA-256",concatBytes(enc.encode("tokentrack-sync-id-v1:"),raw));
  const authDigest=await crypto.subtle.digest("SHA-256",concatBytes(enc.encode("tokentrack-sync-auth-v1:"),raw));
  const aesKey=await crypto.subtle.importKey("raw",raw,{name:"AES-GCM"},false,["encrypt","decrypt"]);
  return{code:b64urlEncode(raw),id:bytesHex(idDigest),auth:b64urlEncode(authDigest),aesKey};
}
async function encryptSyncSnapshots(ctx,snapshots){
  const iv=crypto.getRandomValues(new Uint8Array(12));
  const payload={schema_version:3,source:"tokentrack-encrypted-sync",snapshots};
  const plaintext=new TextEncoder().encode(JSON.stringify(payload));
  const cipher=await crypto.subtle.encrypt({name:"AES-GCM",iv},ctx.aesKey,plaintext);
  return{v:1,iv:b64urlEncode(iv),ciphertext:b64urlEncode(new Uint8Array(cipher))};
}
async function decryptSyncBlob(ctx,blob){
  if(!blob||blob.v!==1)throw new Error("Unsupported encrypted sync payload.");
  const plain=await crypto.subtle.decrypt({name:"AES-GCM",iv:b64urlDecode(blob.iv)},ctx.aesKey,b64urlDecode(blob.ciphertext));
  const data=JSON.parse(new TextDecoder().decode(plain));
  if(!Array.isArray(data.snapshots))throw new Error("Encrypted sync payload is invalid.");
  return data.snapshots;
}
function normalizeSyncSnapshot(row){
  const used=Number(row?.used),recorded=new Date(row?.recorded_at);
  if(!Number.isFinite(used)||used<0||used>100||!Number.isFinite(recorded.getTime()))return null;
  let resetAt=null;
  if(row.reset_at){const r=new Date(row.reset_at);if(Number.isFinite(r.getTime()))resetAt=r.toISOString()}
  return{
    id:String(row.id||((crypto.randomUUID&&crypto.randomUUID())||(recorded.getTime()+"-"+Math.random()))),
    recorded_at:recorded.toISOString(),
    used,
    reset_at:resetAt,
    note:String(row.note||"").slice(0,120)
  };
}
function mergeSnapshotSets(...sets){
  const byKey=new Map();
  for(const rows of sets)for(const raw of rows||[]){
    const row=normalizeSyncSnapshot(raw);if(!row)continue;
    const key=row.id||row.recorded_at+"|"+row.used.toFixed(3)+"|"+row.note;
    const existing=byKey.get(key);
    if(!existing||new Date(row.recorded_at)>=new Date(existing.recorded_at))byKey.set(key,row);
  }
  return[...byKey.values()].sort((a,b)=>new Date(a.recorded_at)-new Date(b.recorded_at));
}
function setSyncLast(message){
  localStorage.setItem("tt-chat-sync-last-v1",JSON.stringify({at:new Date().toISOString(),message}));
  renderChatSync();
}
function renderChatSync(){
  const enabled=Boolean(state.chatSyncKey);
  $("chatSyncBadge").textContent=enabled?"Encrypted sync on":"Local only";
  $("chatSyncStatus").textContent=enabled?"This browser has a sync key. The server stores encrypted checkpoint data only.":"No sync key configured.";
  $("chatSyncCreate").classList.toggle("hidden",enabled);
  ["chatSyncCopy","chatSyncDisable","chatSyncPull","chatSyncPush","chatSyncDeleteRemote","chatSyncCodeWrap"].forEach(id=>$(id).classList.toggle("hidden",!enabled));
  $("chatSyncCode").value=enabled?state.chatSyncKey:"";
  $("chatAutoSync").checked=state.chatAutoSync;
  try{
    const meta=JSON.parse(localStorage.getItem("tt-chat-sync-last-v1")||"null");
    $("chatSyncLast").textContent=meta?.at?(meta.message+" · "+timeLabel(meta.at)):"Never synced";
  }catch{$("chatSyncLast").textContent="Never synced"}
}
async function syncRequest(method,ctx,body){
  const response=await fetch("/api/chatgpt-sync?id="+encodeURIComponent(ctx.id),{
    method,
    headers:{"Content-Type":"application/json","X-Sync-Auth":ctx.auth},
    body:body?JSON.stringify(body):undefined,
    cache:"no-store"
  });
  const data=await response.json().catch(()=>({error:"Invalid sync response"}));
  if(response.status===404&&method==="GET")return null;
  if(!response.ok)throw new Error(data.error||("Sync HTTP "+response.status));
  return data;
}
async function fetchRemoteSnapshots(ctx){
  const remote=await syncRequest("GET",ctx);
  if(!remote)return null;
  return{snapshots:await decryptSyncBlob(ctx,remote.blob),updated_at:remote.updated_at};
}
async function pushEncryptedSnapshots(ctx,snapshots){
  const blob=await encryptSyncSnapshots(ctx,snapshots);
  return syncRequest("PUT",ctx,{blob});
}
async function syncMergePush(){
  if(!state.chatSyncKey||state.chatSyncBusy)return;
  state.chatSyncBusy=true;
  try{
    const ctx=await syncContext(),remote=await fetchRemoteSnapshots(ctx);
    state.chatSnapshots=mergeSnapshotSets(state.chatSnapshots,remote?.snapshots||[]);
    saveChatSnapshots();renderChatGPT();
    await pushEncryptedSnapshots(ctx,state.chatSnapshots);
    setSyncLast("Synced");
  }catch(error){setSyncLast("Sync failed");toast("Sync failed: "+error.message)}
  finally{state.chatSyncBusy=false}
}
async function syncPushLocal(){
  if(!state.chatSyncKey)return;
  if(state.chatSyncBusy){toast("Sync already running");return}
  state.chatSyncBusy=true;
  try{
    const ctx=await syncContext();
    await pushEncryptedSnapshots(ctx,state.chatSnapshots);
    setSyncLast("Local pushed");toast("Encrypted checkpoints pushed");
  }catch(error){setSyncLast("Push failed");toast("Push failed: "+error.message)}
  finally{state.chatSyncBusy=false}
}
async function syncPullMerge(){
  if(!state.chatSyncKey)return;
  if(state.chatSyncBusy){toast("Sync already running");return}
  state.chatSyncBusy=true;
  try{
    const ctx=await syncContext(),remote=await fetchRemoteSnapshots(ctx);
    if(!remote){await pushEncryptedSnapshots(ctx,state.chatSnapshots);setSyncLast("Cloud copy created");toast("No remote copy existed; local checkpoints uploaded");return}
    state.chatSnapshots=mergeSnapshotSets(state.chatSnapshots,remote.snapshots);
    saveChatSnapshots();renderChatGPT();
    await pushEncryptedSnapshots(ctx,state.chatSnapshots);
    setSyncLast("Pulled & merged");toast("Encrypted checkpoints merged");
  }catch(error){setSyncLast("Pull failed");toast("Pull failed: "+error.message)}
  finally{state.chatSyncBusy=false}
}
async function syncDeleteCheckpoint(id){
  if(!state.chatSyncKey||!state.chatAutoSync)return;
  if(state.chatSyncBusy)return;
  state.chatSyncBusy=true;
  try{
    const ctx=await syncContext(),remote=await fetchRemoteSnapshots(ctx);
    const merged=mergeSnapshotSets(state.chatSnapshots,remote?.snapshots||[]).filter(x=>x.id!==id);
    state.chatSnapshots=merged;saveChatSnapshots();renderChatGPT();
    await pushEncryptedSnapshots(ctx,merged);setSyncLast("Deletion synced");
  }catch(error){setSyncLast("Delete sync failed");toast("Remote delete sync failed: "+error.message)}
  finally{state.chatSyncBusy=false}
}
function queueChatAutoSync(){
  if(!state.chatSyncKey||!state.chatAutoSync)return;
  clearTimeout(window.__chatSyncTimer);
  window.__chatSyncTimer=setTimeout(()=>syncMergePush(),350);
}
async function createChatSync(){
  const raw=crypto.getRandomValues(new Uint8Array(32));
  state.chatSyncKey=b64urlEncode(raw);
  localStorage.setItem("tt-chat-sync-key-v1",state.chatSyncKey);
  renderChatSync();
  await syncPushLocal();
}
async function pairChatSync(code){
  const ctx=await syncContext(code);
  state.chatSyncKey=ctx.code;
  localStorage.setItem("tt-chat-sync-key-v1",state.chatSyncKey);
  renderChatSync();
  await syncPullMerge();
}
async function deleteRemoteSync(){
  if(!state.chatSyncKey)return;
  const ctx=await syncContext();
  try{
    await syncRequest("DELETE",ctx);
  }catch(error){
    if(!/not found/i.test(error.message))throw error;
  }
  state.chatSyncKey="";
  localStorage.removeItem("tt-chat-sync-key-v1");
  localStorage.removeItem("tt-chat-sync-last-v1");
  renderChatSync();
}
async function copyChatSyncCode(){
  if(!state.chatSyncKey)return;
  try{await navigator.clipboard.writeText(state.chatSyncKey);toast("Sync code copied")}
  catch{
    const input=$("chatSyncCode");input.type="text";input.select();document.execCommand("copy");input.type="password";toast("Sync code copied");
  }
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
  queueChatAutoSync();
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
  saveChatSnapshots();renderChatGPT();queueChatAutoSync();return added;
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
    const id=b.dataset.id;
    state.chatSnapshots=state.chatSnapshots.filter(x=>x.id!==id);
    saveChatSnapshots();renderChatGPT();
    void syncDeleteCheckpoint(id);
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
$("attentionOpen").onclick=()=>setTab("alerts");
$("installApp").onclick=()=>installPwa();
$("installAppSettings").onclick=()=>installPwa();
$("exportRecoveryKit").onclick=()=>exportRecoveryKit();
$("importRecoveryKit").onchange=async e=>{
  const file=e.target.files?.[0];if(!file)return;
  try{restoreRecoveryKit(JSON.parse(await file.text()));toast("Recovery kit restored")}
  catch(error){toast("Recovery restore failed: "+error.message)}
  e.target.value="";
};

["ruleChatWarn","ruleChatCritical","ruleChatStale","ruleApiForecast","ruleApiTokenGrowth","ruleApiCostGrowth"].forEach(id=>$(id).onchange=updateAlertRulesFromUi);
$("alertsEnabled").onchange=e=>{state.alertsEnabled=e.target.checked;localStorage.setItem("tt-alerts-enabled-v1",String(state.alertsEnabled));evaluateAlerts();void syncServerMonitorRules()};
$("browserNotifications").onchange=e=>{state.browserNotifications=e.target.checked;localStorage.setItem("tt-browser-notifications-v1",String(state.browserNotifications));renderAlertCenter()};
$("requestNotificationPermission").onclick=()=>requestBrowserNotificationPermission();
$("clearAlertEvents").onclick=async()=>{
  state.alertEvents=[];saveAlertEvents();renderAlertCenter();
  try{await fetch("/api/server-monitor",{method:"DELETE"});await loadServerMonitor()}catch{}
  toast("Alert event timeline cleared");
};

$("chatSyncCreate").onclick=()=>createChatSync().catch(e=>toast("Could not enable sync: "+e.message));
$("chatSyncCopy").onclick=()=>copyChatSyncCode();
$("chatSyncDisable").onclick=()=>{
  state.chatSyncKey="";localStorage.removeItem("tt-chat-sync-key-v1");renderChatSync();toast("Sync disabled on this device");
};
$("chatSyncPair").onclick=async()=>{
  const code=$("chatSyncPairCode").value.trim();
  if(!code){toast("Paste a sync code first");return}
  try{await pairChatSync(code);$("chatSyncPairCode").value="";toast("Device paired")}
  catch(e){toast("Pairing failed: "+e.message)}
};
$("chatSyncPull").onclick=()=>syncPullMerge();
$("chatSyncPush").onclick=()=>syncPushLocal();
$("chatAutoSync").onchange=e=>{
  state.chatAutoSync=e.target.checked;localStorage.setItem("tt-chat-auto-sync-v1",String(state.chatAutoSync));
  if(state.chatAutoSync)queueChatAutoSync();
};
$("chatSyncDeleteRemote").onclick=async()=>{
  if(!confirm("Delete the encrypted cloud copy? Local checkpoints on this device will remain."))return;
  try{await deleteRemoteSync();toast("Encrypted cloud copy deleted")}
  catch(e){toast("Cloud delete failed: "+e.message)}
};

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
  if(confirm("Clear all locally saved ChatGPT usage checkpoints? If encrypted sync is enabled, the cloud copy will also be replaced with an empty history.")){
    state.chatSnapshots=[];saveChatSnapshots();renderChatGPT();toast("Checkpoint history cleared");
    if(state.chatSyncKey)void syncPushLocal();
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
renderChatSync();
renderChatGPT();
renderAlertCenter();
evaluateAlerts();
registerPwa();
void loadServerMonitor();
if(state.chatSyncKey&&state.chatAutoSync)setTimeout(()=>syncPullMerge(),700);
load(false);
setInterval(()=>loadServerMonitor(),60000);
