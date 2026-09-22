
const UPSTREAM_TIMEOUT_MS = 15_000;
const VERSION = "4.1.0-cloudflare";
const WORKER_STARTED_AT = Date.now();
const MONITOR_INTERVAL_MS = 300_000;
const MAX_SYNC_BODY_BYTES = 1024 * 1024;

const CORE_SOURCES = [
  { key: "completions", path: "completions", groupBy: ["model", "project_id", "api_key_id", "user_id", "service_tier", "batch"], required: true },
  { key: "embeddings", path: "embeddings", groupBy: ["model", "project_id", "api_key_id", "user_id"] },
  { key: "moderations", path: "moderations", groupBy: ["model", "project_id", "api_key_id", "user_id"] }
];

const RESOURCE_SOURCES = [
  { key: "images", path: "images", groupBy: ["model", "project_id", "api_key_id", "user_id", "size", "source"] },
  { key: "audio_speeches", path: "audio_speeches", groupBy: ["model", "project_id", "api_key_id", "user_id"] },
  { key: "audio_transcriptions", path: "audio_transcriptions", groupBy: ["model", "project_id", "api_key_id", "user_id"] },
  { key: "vector_stores", path: "vector_stores", groupBy: ["project_id"] },
  { key: "code_interpreter_sessions", path: "code_interpreter_sessions", groupBy: ["project_id"] },
  { key: "file_search_calls", path: "file_search_calls", groupBy: ["project_id", "api_key_id", "user_id", "vector_store_id"] },
  { key: "web_search_calls", path: "web_search_calls", groupBy: ["model", "project_id", "api_key_id", "user_id", "context_level"] }
];

const cache = new Map();
const lastGood = new Map();
const rateBuckets = new Map();

function num(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function round(value, digits = 4) {
  const m = 10 ** digits;
  return Math.round((num(value) + Number.EPSILON) * m) / m;
}

function pct(value) {
  return round(num(value) * 100, 2);
}

function safeDivide(a, b) {
  return b ? a / b : 0;
}

function percentChange(current, previous) {
  if (!previous) return current ? null : 0;
  return round(((current - previous) / previous) * 100, 2);
}

function mean(values) {
  return values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;
}

function median(values) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function stdev(values) {
  if (values.length < 2) return 0;
  const avg = mean(values);
  return Math.sqrt(mean(values.map(v => (v - avg) ** 2)));
}

function percentile(values, p) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.max(0, Math.ceil(p * sorted.length) - 1));
  return sorted[index];
}

function securityHeaders(contentType = "application/json; charset=utf-8") {
  return {
    "Content-Type": contentType,
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Referrer-Policy": "no-referrer",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
    "Content-Security-Policy": "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; connect-src 'self'; img-src 'self' data:; font-src 'self'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'"
  };
}

function json(status, body, extraHeaders = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...securityHeaders(), ...extraHeaders }
  });
}

function text(status, body, contentType = "text/plain; charset=utf-8", extraHeaders = {}) {
  return new Response(body, {
    status,
    headers: { ...securityHeaders(contentType), ...extraHeaders }
  });
}

function syncStorageStatus(env) {
  return {
    backend: "cloudflare-kv",
    configured: Boolean(env.TOKENTRACK_KV)
  };
}

async function sha256Hex(value) {
  const bytes = new TextEncoder().encode(String(value));
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map(b => b.toString(16).padStart(2, "0")).join("");
}

function validSyncId(value) {
  return typeof value === "string" && /^[a-f0-9]{64}$/.test(value);
}

function safeEqualString(a, b) {
  if (typeof a !== "string" || typeof b !== "string" || a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return mismatch === 0;
}

function syncRecordKey(id) {
  return validSyncId(id) ? "sync:" + id : null;
}

async function readJsonBody(request, maxBytes = MAX_SYNC_BODY_BYTES) {
  const declared = Number(request.headers.get("content-length") || 0);
  if (declared > maxBytes) {
    const err = new Error("Request body too large");
    err.status = 413;
    throw err;
  }

  const raw = await request.text();
  if (new TextEncoder().encode(raw).byteLength > maxBytes) {
    const err = new Error("Request body too large");
    err.status = 413;
    throw err;
  }
  if (!raw) return {};

  try {
    return JSON.parse(raw);
  } catch {
    const err = new Error("Invalid JSON body");
    err.status = 400;
    throw err;
  }
}

async function readSyncRecord(env, key) {
  if (!env.TOKENTRACK_KV) return null;
  return env.TOKENTRACK_KV.get(key, "json");
}

async function verifySyncAuth(record, providedAuth) {
  if (!record?.auth_hash || !providedAuth || providedAuth.length > 256) return false;
  return safeEqualString(record.auth_hash, await sha256Hex(providedAuth));
}

function validateEncryptedBlob(blob) {
  if (!blob || typeof blob !== "object") return false;
  if (blob.v !== 1) return false;
  if (typeof blob.iv !== "string" || blob.iv.length < 8 || blob.iv.length > 128) return false;
  if (typeof blob.ciphertext !== "string" || blob.ciphertext.length < 8 || blob.ciphertext.length > 900000) return false;
  return /^[A-Za-z0-9_-]+$/.test(blob.iv) && /^[A-Za-z0-9_-]+$/.test(blob.ciphertext);
}

async function writeSyncRecord(env, key, record) {
  if (!env.TOKENTRACK_KV) {
    const err = new Error("Encrypted sync storage is not configured");
    err.status = 503;
    throw err;
  }
  await env.TOKENTRACK_KV.put(key, JSON.stringify(record));
}

function defaultMonitorState() {
  return {
    version: 1,
    rules: {
      enabled: true,
      forecast_usd: 25,
      token_growth_pct: 50,
      cost_growth_pct: 50,
      anomaly_count: 1
    },
    active: [],
    events: [],
    last_run_at: null,
    last_success_at: null,
    last_error: null
  };
}

let apiMonitorState = defaultMonitorState();
let apiMonitorRunning = false;

function normalizeMonitorRules(input = {}) {
  return {
    enabled: input.enabled !== false,
    forecast_usd: Math.max(0, num(input.forecast_usd ?? 25)),
    token_growth_pct: Math.max(1, num(input.token_growth_pct ?? 50)),
    cost_growth_pct: Math.max(1, num(input.cost_growth_pct ?? 50)),
    anomaly_count: Math.max(1, Math.floor(num(input.anomaly_count ?? 1)))
  };
}

async function loadMonitorState(env) {
  if (env.TOKENTRACK_KV) {
    try {
      const data = await env.TOKENTRACK_KV.get("monitor:state", "json");
      if (data) {
        const defaults = defaultMonitorState();
        apiMonitorState = {
          ...defaults,
          ...data,
          rules: { ...defaults.rules, ...(data.rules || {}) },
          active: Array.isArray(data.active) ? data.active : [],
          events: Array.isArray(data.events) ? data.events : []
        };
      }
    } catch (error) {
      console.warn("TokenTrack KV monitor read failed | " + (error?.message || "unknown"));
    }
  }
  return apiMonitorState;
}

async function saveMonitorState(env, state) {
  apiMonitorState = state;
  if (!env.TOKENTRACK_KV) return false;
  try {
    await env.TOKENTRACK_KV.put("monitor:state", JSON.stringify(state));
    return true;
  } catch (error) {
    console.warn("TokenTrack KV monitor write failed | " + (error?.message || "unknown"));
    return false;
  }
}

function evaluateServerApiAlerts(data, rules) {
  if (!rules.enabled) return [];
  const alerts = [];
  const runRate = data.run_rate || {};
  const delta = data.comparison?.delta || {};

  if (data.stale) {
    alerts.push({
      key: "api.stale",
      severity: "critical",
      title: "API telemetry is stale",
      message: "The background monitor is using last-known-good API telemetry."
    });
  }
  if (rules.forecast_usd > 0 && num(runRate.projected_30d_cost) >= rules.forecast_usd) {
    alerts.push({
      key: "api.forecast",
      severity: "warning",
      title: "API spend forecast threshold",
      message: "Projected 30-day spend is $" + num(runRate.projected_30d_cost).toFixed(2) + "."
    });
  }
  if (delta.total_tokens_pct !== null && delta.total_tokens_pct !== undefined && num(delta.total_tokens_pct) >= rules.token_growth_pct) {
    alerts.push({
      key: "api.token.growth",
      severity: "warning",
      title: "API token growth spike",
      message: "Token usage is up " + num(delta.total_tokens_pct).toFixed(1) + "% versus the prior period."
    });
  }
  if (delta.cost_pct !== null && delta.cost_pct !== undefined && num(delta.cost_pct) >= rules.cost_growth_pct) {
    alerts.push({
      key: "api.cost.growth",
      severity: "warning",
      title: "API cost growth spike",
      message: "API cost is up " + num(delta.cost_pct).toFixed(1) + "% versus the prior period."
    });
  }
  if ((data.anomalies || []).length >= rules.anomaly_count) {
    alerts.push({
      key: "api.anomalies",
      severity: "warning",
      title: "API usage anomalies detected",
      message: (data.anomalies || []).length + " unusual usage spike(s) detected."
    });
  }
  return alerts;
}

function appendMonitorEvent(state, kind, alert) {
  state.events.unshift({
    id: crypto.randomUUID(),
    at: new Date().toISOString(),
    kind,
    key: alert.key,
    source: "OpenAI API",
    severity: kind === "resolved" ? "resolved" : alert.severity,
    title: alert.title,
    message: alert.message
  });
  state.events = state.events.slice(0, 300);
}

async function runApiMonitor(env) {
  if (apiMonitorRunning || !env.OPENAI_ADMIN_KEY) return;
  apiMonitorRunning = true;

  const state = await loadMonitorState(env);
  state.last_run_at = new Date().toISOString();

  try {
    const data = await loadAnalytics(30, env);
    const next = evaluateServerApiAlerts(data, normalizeMonitorRules(state.rules));
    const prior = new Map((state.active || []).map(a => [a.key, a]));
    const nextMap = new Map(next.map(a => [a.key, a]));

    for (const alert of next) {
      if (!prior.has(alert.key)) appendMonitorEvent(state, "activated", alert);
    }
    for (const [key, old] of prior) {
      if (!nextMap.has(key)) appendMonitorEvent(state, "resolved", old);
    }

    state.active = next;
    state.last_success_at = new Date().toISOString();
    state.last_error = null;
  } catch (error) {
    state.last_error = error?.message || "Unknown API monitor error";
    console.warn("TokenTrack background API monitor failed | " + state.last_error);
  } finally {
    await saveMonitorState(env, state);
    apiMonitorRunning = false;
  }
}

function authOkay(request, env) {
  const wanted = env.DASHBOARD_PASSWORD || "";
  if (!wanted) return true;

  const header = request.headers.get("authorization") || "";
  if (!header.startsWith("Basic ")) return false;

  try {
    const decoded = atob(header.slice(6));
    const split = decoded.indexOf(":");
    const password = split >= 0 ? decoded.slice(split + 1) : "";
    return password === wanted;
  } catch {
    return false;
  }
}

function rateLimitOkay(request) {
  const now = Date.now();
  const key = String(
    request.headers.get("cf-connecting-ip") ||
    request.headers.get("x-forwarded-for") ||
    "unknown"
  ).split(",")[0].trim();

  const bucket = rateBuckets.get(key);
  if (!bucket || now - bucket.started > 60_000) {
    rateBuckets.set(key, { started: now, count: 1 });
  } else {
    bucket.count += 1;
    if (bucket.count > 180) return false;
  }

  if (rateBuckets.size > 500) {
    const cutoff = now - 120_000;
    for (const [bucketKey, value] of rateBuckets) {
      if (value.started < cutoff) rateBuckets.delete(bucketKey);
    }
  }

  return true;
}

async function fetchPaged(baseUrl, params, adminKey) {
  const items = [];
  let page = null;

  do {
    const url = new URL(baseUrl);
    for (const [key, value] of params) url.searchParams.append(key, value);
    if (page) url.searchParams.set("page", page);

    const response = await fetch(url, {
      headers: {
        Authorization: "Bearer " + adminKey,
        "Content-Type": "application/json"
      },
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS)
    });

    const raw = await response.text();
    let data;
    try {
      data = JSON.parse(raw);
    } catch {
      data = { error: { message: raw || "Invalid upstream response" } };
    }

    if (!response.ok) {
      const err = new Error(data?.error?.message || "OpenAI API returned " + response.status);
      err.status = response.status;
      throw err;
    }

    items.push(...(data.data || []));
    page = data.has_more ? data.next_page : null;
  } while (page);

  return items;
}

function usageParams(start, end, groupBy = []) {
  const params = [
    ["start_time", String(start)],
    ["end_time", String(end)],
    ["bucket_width", "1d"],
    ["limit", "31"]
  ];
  for (const field of groupBy) params.push(["group_by", field]);
  return params;
}

async function fetchUsageSource(def, start, end, adminKey) {
  const buckets = await fetchPaged(
    "https://api.openai.com/v1/organization/usage/" + def.path,
    usageParams(start, end, def.groupBy),
    adminKey
  );
  return normalizeUsage(def.key, buckets);
}

function normalizeUsage(source, buckets) {
  const rows = [];
  for (const bucket of buckets) {
    for (const result of bucket.results || []) {
      rows.push({
        source,
        timestamp: new Date(bucket.start_time * 1000).toISOString(),
        start_time: num(bucket.start_time),
        end_time: num(bucket.end_time),
        model: result.model || "unknown",
        project_id: result.project_id || "unassigned",
        api_key_id: result.api_key_id || "unassigned",
        user_id: result.user_id || "unassigned",
        service_tier: result.service_tier || "unknown",
        batch: result.batch === true ? "batch" : result.batch === false ? "realtime" : "unknown",
        input_tokens: num(result.input_tokens),
        output_tokens: num(result.output_tokens),
        cached_input_tokens: num(result.input_cached_tokens),
        cache_write_tokens: num(result.input_cache_write_tokens),
        uncached_input_tokens: num(result.input_uncached_tokens),
        input_text_tokens: num(result.input_text_tokens),
        input_image_tokens: num(result.input_image_tokens),
        input_audio_tokens: num(result.input_audio_tokens),
        cached_text_tokens: num(result.input_cached_text_tokens),
        cached_image_tokens: num(result.input_cached_image_tokens),
        cached_audio_tokens: num(result.input_cached_audio_tokens),
        output_text_tokens: num(result.output_text_tokens),
        output_image_tokens: num(result.output_image_tokens),
        output_audio_tokens: num(result.output_audio_tokens),
        requests: num(result.num_model_requests || result.num_requests),
        tool_calls: num(result.num_requests),
        images: num(result.images),
        characters: num(result.characters),
        seconds: num(result.seconds),
        usage_bytes: num(result.usage_bytes),
        sessions: num(result.num_sessions),
        size: result.size || null,
        activity_source: result.source || null,
        vector_store_id: result.vector_store_id || null,
        context_level: result.context_level || null
      });
    }
  }
  return rows;
}

async function fetchCosts(start, end, adminKey) {
  const makeParams = includeApiKey => {
    const params = [
      ["start_time", String(start)],
      ["end_time", String(end)],
      ["bucket_width", "1d"],
      ["limit", "180"],
      ["group_by", "project_id"],
      ["group_by", "line_item"]
    ];
    if (includeApiKey) params.push(["group_by", "api_key_id"]);
    return params;
  };

  let buckets;
  let apiKeyAttributionSupported = true;
  try {
    buckets = await fetchPaged("https://api.openai.com/v1/organization/costs", makeParams(true), adminKey);
  } catch (error) {
    if (/api_key_id.*unavailable|group_by=api_key_id.*unavailable/i.test(error?.message || "")) {
      apiKeyAttributionSupported = false;
      buckets = await fetchPaged("https://api.openai.com/v1/organization/costs", makeParams(false), adminKey);
    } else {
      throw error;
    }
  }

  const rows = [];
  for (const bucket of buckets) {
    for (const result of bucket.results || []) {
      rows.push({
        timestamp: new Date(bucket.start_time * 1000).toISOString(),
        start_time: num(bucket.start_time),
        end_time: num(bucket.end_time),
        project_id: result.project_id || "unassigned",
        api_key_id: apiKeyAttributionSupported ? (result.api_key_id || "unassigned") : null,
        line_item: result.line_item || "Uncategorized",
        amount: num(result.amount?.value),
        currency: result.amount?.currency || "usd"
      });
    }
  }
  return { rows, apiKeyAttributionSupported };
}

function summarizeUsage(rows, costs) {
  const totals = rows.reduce((acc, row) => {
    acc.input_tokens += row.input_tokens;
    acc.output_tokens += row.output_tokens;
    acc.cached_input_tokens += row.cached_input_tokens;
    acc.cache_write_tokens += row.cache_write_tokens;
    acc.uncached_input_tokens += row.uncached_input_tokens;
    acc.input_text_tokens += row.input_text_tokens;
    acc.input_image_tokens += row.input_image_tokens;
    acc.input_audio_tokens += row.input_audio_tokens;
    acc.output_audio_tokens += row.output_audio_tokens;
    acc.requests += row.requests;
    return acc;
  }, {
    input_tokens: 0,
    output_tokens: 0,
    cached_input_tokens: 0,
    cache_write_tokens: 0,
    uncached_input_tokens: 0,
    input_text_tokens: 0,
    input_image_tokens: 0,
    input_audio_tokens: 0,
    output_audio_tokens: 0,
    requests: 0
  });

  totals.total_tokens = totals.input_tokens + totals.output_tokens;
  totals.cost = costs.reduce((sum, row) => sum + row.amount, 0);
  totals.cache_ratio = safeDivide(totals.cached_input_tokens, totals.input_tokens);
  totals.uncached_ratio = safeDivide(totals.uncached_input_tokens, totals.input_tokens);
  totals.cache_write_ratio = safeDivide(totals.cache_write_tokens, totals.input_tokens);
  totals.output_input_ratio = safeDivide(totals.output_tokens, totals.input_tokens);
  totals.avg_tokens_per_request = safeDivide(totals.total_tokens, totals.requests);
  totals.avg_input_per_request = safeDivide(totals.input_tokens, totals.requests);
  totals.avg_output_per_request = safeDivide(totals.output_tokens, totals.requests);
  totals.cost_per_request = safeDivide(totals.cost, totals.requests);
  totals.cost_per_million_tokens = safeDivide(totals.cost * 1_000_000, totals.total_tokens);
  return totals;
}

function groupUsage(rows, keyName) {
  const map = new Map();
  for (const row of rows) {
    const key = row[keyName] || "unknown";
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(row);
  }
  return map;
}

function groupCosts(costs, keyName) {
  const map = new Map();
  for (const row of costs) {
    const key = row[keyName] || "Uncategorized";
    map.set(key, (map.get(key) || 0) + row.amount);
  }
  return map;
}

function buildBreakdown(rows, costs, keyName) {
  const usageGroups = groupUsage(rows, keyName);
  const costGroups = groupCosts(costs, keyName);
  const keys = new Set([...usageGroups.keys(), ...costGroups.keys()]);
  const totalTokens = Math.max(1, rows.reduce((s, r) => s + r.input_tokens + r.output_tokens, 0));

  return [...keys].map(key => {
    const summary = summarizeUsage(usageGroups.get(key) || [], []);
    const cost = costGroups.get(key) || 0;
    return {
      name: key,
      ...summary,
      cost,
      token_share: safeDivide(summary.total_tokens, totalTokens)
    };
  }).sort((a, b) => b.total_tokens - a.total_tokens || b.cost - a.cost);
}

function utcDate(ts) {
  return new Date(ts * 1000).toISOString().slice(0, 10);
}

function buildDaily(rows, costs, start, end) {
  const map = new Map();
  for (let ts = start; ts < end; ts += 86400) {
    const date = utcDate(ts);
    map.set(date, {
      date,
      input_tokens: 0,
      output_tokens: 0,
      cached_input_tokens: 0,
      requests: 0,
      total_tokens: 0,
      cost: 0
    });
  }

  for (const row of rows) {
    const date = utcDate(row.start_time);
    if (!map.has(date)) continue;
    const day = map.get(date);
    day.input_tokens += row.input_tokens;
    day.output_tokens += row.output_tokens;
    day.cached_input_tokens += row.cached_input_tokens;
    day.requests += row.requests;
    day.total_tokens += row.input_tokens + row.output_tokens;
  }

  for (const row of costs) {
    const date = utcDate(row.start_time);
    if (map.has(date)) map.get(date).cost += row.amount;
  }

  return [...map.values()];
}

function resourceSummary(rows) {
  const map = new Map();
  for (const row of rows) {
    if (!map.has(row.source)) {
      map.set(row.source, {
        source: row.source,
        requests: 0,
        images: 0,
        characters: 0,
        seconds: 0,
        usage_bytes: 0,
        sessions: 0,
        tool_calls: 0
      });
    }
    const item = map.get(row.source);
    item.requests += row.requests;
    item.images += row.images;
    item.characters += row.characters;
    item.seconds += row.seconds;
    item.usage_bytes += row.usage_bytes;
    item.sessions += row.sessions;
    item.tool_calls += row.tool_calls;
  }
  return [...map.values()];
}

function detectAnomalies(daily) {
  const anomalies = [];
  const today = new Date().toISOString().slice(0, 10);
  const completed = daily.filter(d => d.date !== today);

  for (let i = 5; i < completed.length; i++) {
    const history = completed.slice(Math.max(0, i - 14), i).map(d => d.total_tokens);
    const avg = mean(history);
    const sd = stdev(history);
    const current = completed[i].total_tokens;
    const z = sd ? (current - avg) / sd : 0;
    if ((z >= 2 && current > avg) || (avg > 0 && current >= avg * 1.75)) {
      anomalies.push({
        date: completed[i].date,
        metric: "tokens",
        value: current,
        baseline: round(avg, 0),
        z_score: round(z, 2),
        severity: z >= 3 || current >= avg * 2.5 ? "high" : "medium"
      });
    }
  }

  return anomalies.sort((a, b) => b.date.localeCompare(a.date)).slice(0, 12);
}

function buildInsights(current, previous, daily, models, projects, anomalies, days) {
  const insights = [];
  const tokenDelta = percentChange(current.total_tokens, previous.total_tokens);
  const costDelta = percentChange(current.cost, previous.cost);
  const topModel = models[0];
  const topProject = projects[0];

  if (tokenDelta !== null) {
    insights.push({
      type: tokenDelta >= 20 ? "warning" : tokenDelta <= -20 ? "positive" : "neutral",
      title: "Token trend",
      message: "Token usage is " + Math.abs(tokenDelta).toFixed(1) + "% " + (tokenDelta >= 0 ? "higher" : "lower") + " than the previous " + days + "-day period."
    });
  }

  if (costDelta !== null) {
    insights.push({
      type: costDelta >= 20 ? "warning" : costDelta <= -20 ? "positive" : "neutral",
      title: "Spend trend",
      message: "Actual API cost is " + Math.abs(costDelta).toFixed(1) + "% " + (costDelta >= 0 ? "higher" : "lower") + " than the previous comparable period."
    });
  }

  insights.push({
    type: current.cache_ratio >= 0.3 ? "positive" : current.input_tokens ? "neutral" : "neutral",
    title: "Cache efficiency",
    message: pct(current.cache_ratio).toFixed(1) + "% of input tokens were served from cached input."
  });

  if (topModel) {
    insights.push({
      type: topModel.token_share >= 0.75 ? "neutral" : "positive",
      title: "Model concentration",
      message: topModel.name + " accounts for " + pct(topModel.token_share).toFixed(1) + "% of token volume."
    });
  }

  if (topProject) {
    insights.push({
      type: topProject.token_share >= 0.8 ? "neutral" : "positive",
      title: "Project concentration",
      message: topProject.name + " accounts for " + pct(topProject.token_share).toFixed(1) + "% of token volume."
    });
  }

  if (anomalies.length) {
    insights.push({
      type: "warning",
      title: "Usage anomalies",
      message: anomalies.length + " statistically unusual token spike" + (anomalies.length === 1 ? " was" : "s were") + " detected in the selected period."
    });
  }

  const nonzero = daily.map(d => d.total_tokens).filter(v => v > 0);
  if (nonzero.length) {
    const cv = safeDivide(stdev(nonzero), mean(nonzero));
    insights.push({
      type: cv > 0.75 ? "warning" : "positive",
      title: "Usage volatility",
      message: "Daily token variability is " + pct(cv).toFixed(0) + "% relative to the daily average."
    });
  }

  return insights.slice(0, 8);
}


async function fetchJson(url, adminKey) {
  const response = await fetch(url, {
    headers: { Authorization: "Bearer " + adminKey, "Content-Type": "application/json" },
    signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS)
  });
  const raw = await response.text();
  let data;
  try { data = JSON.parse(raw); } catch { data = { error: { message: raw || "Invalid upstream response" } }; }
  if (!response.ok) {
    const err = new Error(data?.error?.message || "OpenAI API returned " + response.status);
    err.status = response.status;
    throw err;
  }
  return data;
}

async function fetchGovernance(adminKey) {
  const [limitResult, alertsResult] = await Promise.all([
    fetchJson("https://api.openai.com/v1/organization/spend_limit", adminKey)
      .then(data => ({ ok: true, data }))
      .catch(error => ({ ok: false, error })),
    fetchJson("https://api.openai.com/v1/organization/spend_alerts?limit=100&order=asc", adminKey)
      .then(data => ({ ok: true, data }))
      .catch(error => ({ ok: false, error }))
  ]);

  const limitMessage = limitResult.ok ? "" : (limitResult.error?.message || "");
  const alertsMessage = alertsResult.ok ? "" : (alertsResult.error?.message || "");
  const limitBenign = /no organization spend limit is configured/i.test(limitMessage);
  const alertsBenign = /paid plan.*budget alerts|paid plan.*spend alerts/i.test(alertsMessage);

  return {
    spend_limit: limitResult.ok ? {
      threshold_usd: num(limitResult.data.threshold_amount) / 100,
      currency: limitResult.data.currency || "USD",
      interval: limitResult.data.interval || "month",
      enforcement: limitResult.data.enforcement?.status || "unknown"
    } : null,
    spend_alerts: alertsResult.ok ? (alertsResult.data.data || []).map(a => ({
      id: a.id,
      threshold_usd: num(a.threshold_amount) / 100,
      currency: a.currency || "USD",
      interval: a.interval || "month",
      channel: a.notification_channel?.type || "unknown",
      recipient_count: (a.notification_channel?.recipients || []).length
    })) : [],
    availability: {
      spend_limit: limitResult.ok ? "available" : limitBenign ? "not_configured" : "unavailable",
      spend_alerts: alertsResult.ok ? "available" : alertsBenign ? "plan_unavailable" : "unavailable"
    },
    warnings: [
      ...(!limitResult.ok && !limitBenign ? ["spend_limit: " + limitMessage] : []),
      ...(!alertsResult.ok && !alertsBenign ? ["spend_alerts: " + alertsMessage] : [])
    ]
  };
}

function buildMovers(currentRows, previousRows, keyName) {
  const cur = new Map(buildBreakdown(currentRows, [], keyName).map(r => [r.name, r]));
  const prev = new Map(buildBreakdown(previousRows, [], keyName).map(r => [r.name, r]));
  const keys = new Set([...cur.keys(), ...prev.keys()]);
  return [...keys].map(name => {
    const a = cur.get(name)?.total_tokens || 0;
    const b = prev.get(name)?.total_tokens || 0;
    return { name, current_tokens: a, previous_tokens: b, delta_tokens: a - b, delta_pct: percentChange(a, b) };
  }).sort((a,b) => Math.abs(b.delta_tokens) - Math.abs(a.delta_tokens)).slice(0,12);
}

function buildAnalytics(days, start, previousStart, end, tokenRows, resourceRows, costRows, warnings, governance, coverage) {
  const currentRows = tokenRows.filter(r => r.start_time >= start && r.start_time < end);
  const previousRows = tokenRows.filter(r => r.start_time >= previousStart && r.start_time < start);
  const currentCosts = costRows.filter(r => r.start_time >= start && r.start_time < end);
  const previousCosts = costRows.filter(r => r.start_time >= previousStart && r.start_time < start);

  const current = summarizeUsage(currentRows, currentCosts);
  const previous = summarizeUsage(previousRows, previousCosts);
  const models = buildBreakdown(currentRows, [], "model");
  const projects = buildBreakdown(currentRows, currentCosts, "project_id");
  const sources = buildBreakdown(currentRows, [], "source");
  const apiKeys = buildBreakdown(currentRows, coverage.api_key_cost_attribution ? currentCosts : [], "api_key_id");
  const users = buildBreakdown(currentRows, [], "user_id");
  const serviceTiers = buildBreakdown(currentRows, [], "service_tier");
  const batchModes = buildBreakdown(currentRows, [], "batch");
  const modelMovers = buildMovers(currentRows, previousRows, "model");
  const projectMovers = buildMovers(currentRows, previousRows, "project_id");
  const costLineItems = [...groupCosts(currentCosts, "line_item").entries()]
    .map(([name, cost]) => ({ name, cost }))
    .sort((a, b) => b.cost - a.cost);
  const daily = buildDaily(currentRows, currentCosts, start, end);
  const anomalies = detectAnomalies(daily);
  const insights = buildInsights(current, previous, daily, models, projects, anomalies, days);
  const dailyTokenValues = daily.map(d => d.total_tokens);
  const dailyCostValues = daily.map(d => d.cost);

  const peakDay = daily.reduce((best, d) => !best || d.total_tokens > best.total_tokens ? d : best, null);

  return {
    version: VERSION,
    source: "openai-organization-usage",
    days,
    generated_at: new Date().toISOString(),
    warnings,
    totals: current,
    comparison: {
      previous,
      delta: {
        total_tokens_pct: percentChange(current.total_tokens, previous.total_tokens),
        input_tokens_pct: percentChange(current.input_tokens, previous.input_tokens),
        output_tokens_pct: percentChange(current.output_tokens, previous.output_tokens),
        cached_input_tokens_pct: percentChange(current.cached_input_tokens, previous.cached_input_tokens),
        requests_pct: percentChange(current.requests, previous.requests),
        cost_pct: percentChange(current.cost, previous.cost)
      }
    },
    run_rate: {
      daily_tokens: safeDivide(current.total_tokens, days),
      daily_cost: safeDivide(current.cost, days),
      daily_requests: safeDivide(current.requests, days),
      projected_7d_tokens: safeDivide(current.total_tokens, days) * 7,
      projected_30d_tokens: safeDivide(current.total_tokens, days) * 30,
      projected_30d_cost: safeDivide(current.cost, days) * 30,
      projected_30d_requests: safeDivide(current.requests, days) * 30
    },
    distribution: {
      models,
      projects,
      sources,
      api_keys: apiKeys,
      users,
      service_tiers: serviceTiers,
      batch_modes: batchModes,
      cost_line_items: costLineItems
    },
    daily,
    statistics: {
      median_daily_tokens: median(dailyTokenValues),
      p95_daily_tokens: percentile(dailyTokenValues, 0.95),
      peak_daily_tokens: peakDay?.total_tokens || 0,
      peak_day: peakDay?.date || null,
      mean_daily_tokens: mean(dailyTokenValues),
      daily_token_stddev: stdev(dailyTokenValues),
      mean_daily_cost: mean(dailyCostValues)
    },
    anomalies,
    insights,
    movers: { models: modelMovers, projects: projectMovers },
    governance,
    coverage,
    resources: resourceSummary(resourceRows),
    raw: {
      usage: currentRows,
      costs: currentCosts
    }
  };
}

async function computeAnalytics(days, env) {
  const adminKey = env.OPENAI_ADMIN_KEY || "";
  if (!adminKey) {
    const err = new Error("OPENAI_ADMIN_KEY is not configured on the server.");
    err.status = 503;
    throw err;
  }

  const end = Math.floor(Date.now() / 1000);
  const start = end - days * 86400;
  const previousStart = start - days * 86400;
  const warnings = [];

  const completionPromise = fetchUsageSource(CORE_SOURCES[0], previousStart, end, adminKey);
  const optionalCorePromises = CORE_SOURCES.slice(1).map(def =>
    fetchUsageSource(def, previousStart, end, adminKey)
      .then(rows => ({ ok: true, key: def.key, rows }))
      .catch(error => ({ ok: false, key: def.key, error }))
  );
  const resourcePromises = RESOURCE_SOURCES.map(def =>
    fetchUsageSource(def, start, end, adminKey)
      .then(rows => ({ ok: true, key: def.key, rows }))
      .catch(error => ({ ok: false, key: def.key, error }))
  );
  const costPromise = fetchCosts(previousStart, end, adminKey)
    .then(result => ({ ok: true, ...result }))
    .catch(error => ({ ok: false, error }));
  const governancePromise = fetchGovernance(adminKey);

  const [completionRows, optionalCore, resources, costResult, governance] = await Promise.all([
    completionPromise,
    Promise.all(optionalCorePromises),
    Promise.all(resourcePromises),
    costPromise,
    governancePromise
  ]);

  const tokenRows = [...completionRows];
  for (const result of optionalCore) {
    if (result.ok) tokenRows.push(...result.rows);
    else warnings.push(result.key + ": " + result.error.message);
  }

  const resourceRows = [];
  for (const result of resources) {
    if (result.ok) resourceRows.push(...result.rows);
    else warnings.push(result.key + ": " + result.error.message);
  }

  const costRows = costResult.ok ? costResult.rows : [];
  if (!costResult.ok) warnings.push("costs: " + costResult.error.message);
  warnings.push(...(governance.warnings || []));

  const coverage = {
    api_key_cost_attribution: Boolean(costResult.ok && costResult.apiKeyAttributionSupported),
    spend_limit: governance.availability?.spend_limit || "unknown",
    spend_alerts: governance.availability?.spend_alerts || "unknown"
  };

  return buildAnalytics(days, start, previousStart, end, tokenRows, resourceRows, costRows, warnings, governance, coverage);
}

async function loadAnalytics(days, env) {
  const cacheTtlMs = Math.max(10_000, Number(env.CACHE_TTL_MS || 30_000));
  const key = "analytics:" + days;
  const fresh = cache.get(key);
  if (fresh && Date.now() - fresh.at < cacheTtlMs) {
    return { ...fresh.value, cache_status: "hit", stale: false };
  }

  try {
    const value = await computeAnalytics(days, env);
    cache.set(key, { at: Date.now(), value });
    lastGood.set(key, { at: Date.now(), value });
    return { ...value, cache_status: "miss", stale: false };
  } catch (error) {
    const stale = lastGood.get(key);
    if (stale) {
      return {
        ...stale.value,
        generated_at: new Date().toISOString(),
        cache_status: "stale-fallback",
        stale: true,
        stale_since: new Date(stale.at).toISOString(),
        stale_reason: error.message
      };
    }
    throw error;
  }
}

function csvEscape(value) {
  const textValue = String(value ?? "");
  if (/[",\n]/.test(textValue)) return '"' + textValue.replace(/"/g, '""') + '"';
  return textValue;
}

function analyticsCsv(data, type) {
  let headers;
  let rows;

  if (type === "models") {
    headers = ["model", "input_tokens", "output_tokens", "cached_input_tokens", "requests", "total_tokens", "token_share"];
    rows = data.distribution.models.map(r => [r.name, r.input_tokens, r.output_tokens, r.cached_input_tokens, r.requests, r.total_tokens, r.token_share]);
  } else if (type === "projects") {
    headers = ["project", "input_tokens", "output_tokens", "cached_input_tokens", "requests", "total_tokens", "cost_usd", "token_share"];
    rows = data.distribution.projects.map(r => [r.name, r.input_tokens, r.output_tokens, r.cached_input_tokens, r.requests, r.total_tokens, r.cost, r.token_share]);
  } else {
    headers = ["date", "input_tokens", "output_tokens", "cached_input_tokens", "requests", "total_tokens", "cost_usd"];
    rows = data.daily.map(r => [r.date, r.input_tokens, r.output_tokens, r.cached_input_tokens, r.requests, r.total_tokens, r.cost]);
  }

  return [headers, ...rows].map(row => row.map(csvEscape).join(",")).join("\n") + "\n";
}


function hardenAssetResponse(response) {
  const headers = new Headers(response.headers);
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("X-Frame-Options", "DENY");
  headers.set("Referrer-Policy", "no-referrer");
  headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  headers.set(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; connect-src 'self'; img-src 'self' data:; font-src 'self'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'"
  );
  if ((headers.get("content-type") || "").includes("text/html")) {
    headers.set("Cache-Control", "no-cache");
  }
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}

async function handleServerMonitor(request, env, ctx) {
  const state = await loadMonitorState(env);
  try {
    if (request.method === "GET") {
      return json(200, {
        rules: normalizeMonitorRules(state.rules),
        active: state.active || [],
        events: (state.events || []).slice(0, 200),
        last_run_at: state.last_run_at,
        last_success_at: state.last_success_at,
        last_error: state.last_error,
        interval_seconds: Math.floor(MONITOR_INTERVAL_MS / 1000),
        persistence: env.TOKENTRACK_KV ? "cloudflare-kv" : "ephemeral"
      });
    }
    if (request.method === "PUT") {
      const body = await readJsonBody(request, 64 * 1024);
      state.rules = normalizeMonitorRules({ ...state.rules, ...(body.rules || {}) });
      await saveMonitorState(env, state);
      ctx.waitUntil(runApiMonitor(env));
      return json(200, { ok: true, rules: state.rules });
    }
    if (request.method === "DELETE") {
      state.events = [];
      await saveMonitorState(env, state);
      return json(200, { ok: true, events_cleared: true });
    }
    return json(405, { error: "Method not allowed" }, { Allow: "GET, PUT, DELETE" });
  } catch (error) {
    return json(error.status || 500, { error: error.message || "API monitor error" });
  }
}

async function handleSync(request, env, url) {
  const id = url.searchParams.get("id") || "";
  const providedAuth = String(request.headers.get("x-sync-auth") || "");
  const key = syncRecordKey(id);

  if (!key) return json(400, { error: "Invalid sync id" });
  if (!providedAuth || providedAuth.length > 256) return json(401, { error: "Missing sync authorization" });
  if (!env.TOKENTRACK_KV) {
    return json(503, {
      error: "Encrypted sync storage is not configured",
      hint: "Add a Cloudflare KV binding named TOKENTRACK_KV."
    });
  }

  try {
    const existing = await readSyncRecord(env, key);

    if (request.method === "GET") {
      if (!existing) return json(404, { error: "Sync record not found" });
      if (!await verifySyncAuth(existing, providedAuth)) return json(403, { error: "Invalid sync authorization" });
      return json(200, {
        version: existing.version || 1,
        updated_at: existing.updated_at,
        blob: existing.blob
      });
    }

    if (request.method === "PUT") {
      if (existing && !await verifySyncAuth(existing, providedAuth)) {
        return json(403, { error: "Invalid sync authorization" });
      }
      const body = await readJsonBody(request);
      if (!validateEncryptedBlob(body.blob)) return json(400, { error: "Invalid encrypted blob" });

      const updatedAt = new Date().toISOString();
      const record = {
        version: 1,
        auth_hash: existing?.auth_hash || await sha256Hex(providedAuth),
        created_at: existing?.created_at || updatedAt,
        updated_at: updatedAt,
        blob: body.blob
      };
      await writeSyncRecord(env, key, record);
      return json(existing ? 200 : 201, {
        ok: true,
        created: !existing,
        updated_at: updatedAt
      });
    }

    if (request.method === "DELETE") {
      if (!existing) return json(404, { error: "Sync record not found" });
      if (!await verifySyncAuth(existing, providedAuth)) return json(403, { error: "Invalid sync authorization" });
      await env.TOKENTRACK_KV.delete(key);
      return json(200, { ok: true, deleted: true });
    }

    return json(405, { error: "Method not allowed" }, { Allow: "GET, PUT, DELETE" });
  } catch (error) {
    return json(error.status || 500, { error: error.message || "Sync storage error" });
  }
}

async function handleRequest(request, env, ctx) {
  const url = new URL(request.url);

  if (url.pathname !== "/health" && !authOkay(request, env)) {
    return text(401, "Authentication required", "text/plain; charset=utf-8", {
      "WWW-Authenticate": 'Basic realm="TokenTrack"'
    });
  }

  if (url.pathname.startsWith("/api/") && !rateLimitOkay(request)) {
    return json(429, { error: "Too many requests. Try again shortly." });
  }

  if (url.pathname === "/health") {
    const state = await loadMonitorState(env);
    return json(200, {
      ok: true,
      runtime: "cloudflare-workers",
      version: VERSION,
      key_configured: Boolean(env.OPENAI_ADMIN_KEY),
      password_protected: Boolean(env.DASHBOARD_PASSWORD),
      sync_storage: syncStorageStatus(env),
      api_monitor: {
        enabled: Boolean(state.rules?.enabled),
        interval_seconds: Math.floor(MONITOR_INTERVAL_MS / 1000),
        last_run_at: state.last_run_at,
        last_success_at: state.last_success_at,
        last_error: state.last_error,
        active_count: (state.active || []).length,
        persistent: Boolean(env.TOKENTRACK_KV)
      },
      uptime_seconds: Math.floor((Date.now() - WORKER_STARTED_AT) / 1000),
      time: new Date().toISOString()
    });
  }

  if (url.pathname === "/api/server-monitor") return handleServerMonitor(request, env, ctx);
  if (url.pathname === "/api/chatgpt-sync") return handleSync(request, env, url);

  const rawDays = Number(url.searchParams.get("days") || 30);
  const days = Math.max(1, Math.min(180, Number.isFinite(rawDays) ? Math.floor(rawDays) : 30));

  if (url.pathname === "/api/analytics") {
    try {
      return json(200, await loadAnalytics(days, env));
    } catch (error) {
      return json(error.status || 500, {
        error: error.message || "Unable to load analytics",
        generated_at: new Date().toISOString()
      });
    }
  }

  if (url.pathname === "/api/usage") {
    try {
      const data = await loadAnalytics(days, env);
      return json(200, {
        source: data.source,
        days: data.days,
        generated_at: data.generated_at,
        stale: data.stale,
        warnings: data.warnings,
        totals: data.totals,
        usage: data.raw.usage,
        costs: data.raw.costs
      });
    } catch (error) {
      return json(error.status || 500, {
        error: error.message || "Unable to load usage",
        generated_at: new Date().toISOString()
      });
    }
  }

  if (url.pathname === "/api/export") {
    try {
      const type = ["daily", "models", "projects"].includes(url.searchParams.get("type"))
        ? url.searchParams.get("type")
        : "daily";
      const data = await loadAnalytics(days, env);
      const csv = analyticsCsv(data, type);
      return text(200, csv, "text/csv; charset=utf-8", {
        "Content-Disposition": 'attachment; filename="tokentrack-' + type + '-' + days + 'd.csv"'
      });
    } catch (error) {
      return json(error.status || 500, { error: error.message || "Unable to export usage" });
    }
  }

  if (!env.ASSETS) return json(500, { error: "Static asset binding is not configured." });
  return hardenAssetResponse(await env.ASSETS.fetch(request));
}

export default {
  async fetch(request, env, ctx) {
    return handleRequest(request, env, ctx);
  },
  async scheduled(controller, env, ctx) {
    ctx.waitUntil(runApiMonitor(env));
  }
};
