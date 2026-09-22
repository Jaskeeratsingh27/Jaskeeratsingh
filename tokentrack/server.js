import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT || 3000);
const OPENAI_ADMIN_KEY = process.env.OPENAI_ADMIN_KEY || "";
const DASHBOARD_PASSWORD = process.env.DASHBOARD_PASSWORD || "";
const CACHE_TTL_MS = Math.max(10_000, Number(process.env.CACHE_TTL_MS || 30_000));
const UPSTREAM_TIMEOUT_MS = 15_000;
const VERSION = "3.0.0";

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

function json(res, status, body, extraHeaders = {}) {
  res.writeHead(status, { ...securityHeaders(), ...extraHeaders });
  res.end(JSON.stringify(body));
}

function text(res, status, body, contentType = "text/plain; charset=utf-8", extraHeaders = {}) {
  res.writeHead(status, { ...securityHeaders(contentType), ...extraHeaders });
  res.end(body);
}

function authOkay(req) {
  if (!DASHBOARD_PASSWORD) return true;
  const header = req.headers.authorization || "";
  if (!header.startsWith("Basic ")) return false;
  try {
    const decoded = Buffer.from(header.slice(6), "base64").toString("utf8");
    const split = decoded.indexOf(":");
    const password = split >= 0 ? decoded.slice(split + 1) : "";
    return password === DASHBOARD_PASSWORD;
  } catch {
    return false;
  }
}

function rateLimitOkay(req) {
  const now = Date.now();
  const key = String(req.headers["x-forwarded-for"] || req.socket.remoteAddress || "unknown").split(",")[0].trim();
  const bucket = rateBuckets.get(key);
  if (!bucket || now - bucket.started > 60_000) {
    rateBuckets.set(key, { started: now, count: 1 });
    return true;
  }
  bucket.count += 1;
  return bucket.count <= 180;
}

setInterval(() => {
  const cutoff = Date.now() - 120_000;
  for (const [key, value] of rateBuckets) {
    if (value.started < cutoff) rateBuckets.delete(key);
  }
}, 60_000).unref();

async function fetchPaged(baseUrl, params) {
  const items = [];
  let page = null;

  do {
    const url = new URL(baseUrl);
    for (const [key, value] of params) url.searchParams.append(key, value);
    if (page) url.searchParams.set("page", page);

    const response = await fetch(url, {
      headers: {
        Authorization: "Bearer " + OPENAI_ADMIN_KEY,
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

async function fetchUsageSource(def, start, end) {
  const buckets = await fetchPaged(
    "https://api.openai.com/v1/organization/usage/" + def.path,
    usageParams(start, end, def.groupBy)
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

async function fetchCosts(start, end) {
  const params = [
    ["start_time", String(start)],
    ["end_time", String(end)],
    ["bucket_width", "1d"],
    ["limit", "180"],
    ["group_by", "project_id"],
    ["group_by", "api_key_id"],
    ["group_by", "line_item"]
  ];
  const buckets = await fetchPaged("https://api.openai.com/v1/organization/costs", params);
  const rows = [];
  for (const bucket of buckets) {
    for (const result of bucket.results || []) {
      rows.push({
        timestamp: new Date(bucket.start_time * 1000).toISOString(),
        start_time: num(bucket.start_time),
        end_time: num(bucket.end_time),
        project_id: result.project_id || "unassigned",
        api_key_id: result.api_key_id || "unassigned",
        line_item: result.line_item || "Uncategorized",
        amount: num(result.amount?.value),
        currency: result.amount?.currency || "usd"
      });
    }
  }
  return rows;
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


async function fetchJson(url) {
  const response = await fetch(url, {
    headers: { Authorization: "Bearer " + OPENAI_ADMIN_KEY, "Content-Type": "application/json" },
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

async function fetchGovernance() {
  const [limitResult, alertsResult] = await Promise.all([
    fetchJson("https://api.openai.com/v1/organization/spend_limit")
      .then(data => ({ ok: true, data }))
      .catch(error => ({ ok: false, error })),
    fetchJson("https://api.openai.com/v1/organization/spend_alerts?limit=100&order=asc")
      .then(data => ({ ok: true, data }))
      .catch(error => ({ ok: false, error }))
  ]);
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
    warnings: [
      ...(limitResult.ok ? [] : ["spend_limit: " + limitResult.error.message]),
      ...(alertsResult.ok ? [] : ["spend_alerts: " + alertsResult.error.message])
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

function buildAnalytics(days, start, previousStart, end, tokenRows, resourceRows, costRows, warnings, governance) {
  const currentRows = tokenRows.filter(r => r.start_time >= start && r.start_time < end);
  const previousRows = tokenRows.filter(r => r.start_time >= previousStart && r.start_time < start);
  const currentCosts = costRows.filter(r => r.start_time >= start && r.start_time < end);
  const previousCosts = costRows.filter(r => r.start_time >= previousStart && r.start_time < start);

  const current = summarizeUsage(currentRows, currentCosts);
  const previous = summarizeUsage(previousRows, previousCosts);
  const models = buildBreakdown(currentRows, [], "model");
  const projects = buildBreakdown(currentRows, currentCosts, "project_id");
  const sources = buildBreakdown(currentRows, [], "source");
  const apiKeys = buildBreakdown(currentRows, currentCosts, "api_key_id");
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
    resources: resourceSummary(resourceRows),
    raw: {
      usage: currentRows,
      costs: currentCosts
    }
  };
}

async function computeAnalytics(days) {
  if (!OPENAI_ADMIN_KEY) {
    const err = new Error("OPENAI_ADMIN_KEY is not configured on the server.");
    err.status = 503;
    throw err;
  }

  const end = Math.floor(Date.now() / 1000);
  const start = end - days * 86400;
  const previousStart = start - days * 86400;
  const warnings = [];

  const completionPromise = fetchUsageSource(CORE_SOURCES[0], previousStart, end);
  const optionalCorePromises = CORE_SOURCES.slice(1).map(def =>
    fetchUsageSource(def, previousStart, end)
      .then(rows => ({ ok: true, key: def.key, rows }))
      .catch(error => ({ ok: false, key: def.key, error }))
  );
  const resourcePromises = RESOURCE_SOURCES.map(def =>
    fetchUsageSource(def, start, end)
      .then(rows => ({ ok: true, key: def.key, rows }))
      .catch(error => ({ ok: false, key: def.key, error }))
  );
  const costPromise = fetchCosts(previousStart, end)
    .then(rows => ({ ok: true, rows }))
    .catch(error => ({ ok: false, error }));
  const governancePromise = fetchGovernance();

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

  return buildAnalytics(days, start, previousStart, end, tokenRows, resourceRows, costRows, warnings, governance);
}

async function loadAnalytics(days) {
  const key = "analytics:" + days;
  const fresh = cache.get(key);
  if (fresh && Date.now() - fresh.at < CACHE_TTL_MS) {
    return { ...fresh.value, cache_status: "hit", stale: false };
  }

  try {
    const value = await computeAnalytics(days);
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

function serveStatic(req, res) {
  const publicDir = path.join(__dirname, "public");
  const requestPath = new URL(req.url, "http://" + (req.headers.host || "localhost")).pathname;
  const rel = requestPath === "/" ? "index.html" : requestPath.replace(/^\/+/, "");
  const file = path.normalize(path.join(publicDir, rel));

  if (!file.startsWith(publicDir)) return text(res, 403, "Forbidden");

  fs.readFile(file, (err, data) => {
    if (err) return text(res, 404, "Not found");

    const ext = path.extname(file);
    const types = {
      ".html": "text/html; charset=utf-8",
      ".js": "text/javascript; charset=utf-8",
      ".css": "text/css; charset=utf-8",
      ".json": "application/json; charset=utf-8",
      ".svg": "image/svg+xml"
    };

    const headers = securityHeaders(types[ext] || "application/octet-stream");
    headers["Cache-Control"] = ext === ".html" ? "no-cache" : "public, max-age=300";
    res.writeHead(200, headers);
    res.end(data);
  });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, "http://" + (req.headers.host || "localhost"));

  if (url.pathname !== "/health" && !authOkay(req)) {
    return text(res, 401, "Authentication required", "text/plain; charset=utf-8", {
      "WWW-Authenticate": 'Basic realm="TokenTrack"'
    });
  }

  if (url.pathname.startsWith("/api/") && !rateLimitOkay(req)) {
    return json(res, 429, { error: "Too many requests. Try again shortly." });
  }

  if (url.pathname === "/health") {
    return json(res, 200, {
      ok: true,
      version: VERSION,
      key_configured: Boolean(OPENAI_ADMIN_KEY),
      password_protected: Boolean(DASHBOARD_PASSWORD),
      uptime_seconds: Math.floor(process.uptime()),
      time: new Date().toISOString()
    });
  }

  const rawDays = Number(url.searchParams.get("days") || 30);
  const days = Math.max(1, Math.min(180, Number.isFinite(rawDays) ? Math.floor(rawDays) : 30));

  if (url.pathname === "/api/analytics") {
    try {
      return json(res, 200, await loadAnalytics(days));
    } catch (error) {
      return json(res, error.status || 500, {
        error: error.message || "Unable to load analytics",
        generated_at: new Date().toISOString()
      });
    }
  }

  if (url.pathname === "/api/usage") {
    try {
      const data = await loadAnalytics(days);
      return json(res, 200, {
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
      return json(res, error.status || 500, {
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
      const data = await loadAnalytics(days);
      const csv = analyticsCsv(data, type);
      return text(res, 200, csv, "text/csv; charset=utf-8", {
        "Content-Disposition": 'attachment; filename="tokentrack-' + type + '-' + days + 'd.csv"'
      });
    } catch (error) {
      return json(res, error.status || 500, { error: error.message || "Unable to export usage" });
    }
  }

  return serveStatic(req, res);
});

server.listen(PORT, "0.0.0.0", () => {
  console.log("TokenTrack v" + VERSION + " listening on :" + PORT);

  if (OPENAI_ADMIN_KEY) {
    setTimeout(async () => {
      try {
        const data = await loadAnalytics(7);
        console.log(
          "TokenTrack analytics self-test OK" +
          " | version=" + VERSION +
          " | stale=" + Boolean(data.stale) +
          " | warnings=" + (data.warnings || []).length +
          " | models=" + (data.distribution?.models || []).length +
          " | projects=" + (data.distribution?.projects || []).length +
          " | api_keys=" + (data.distribution?.api_keys || []).length +
          " | resources=" + (data.resources || []).length
        );
      } catch (error) {
        console.error("TokenTrack analytics self-test FAILED | " + (error?.message || "unknown error"));
      }
    }, 1200);
  } else {
    console.warn("TokenTrack analytics self-test SKIPPED | OPENAI_ADMIN_KEY not configured");
  }
});
