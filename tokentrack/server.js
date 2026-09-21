import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT || 3000);
const OPENAI_ADMIN_KEY = process.env.OPENAI_ADMIN_KEY || "";
const CACHE_TTL_MS = 30_000;

let cache = new Map();

function json(res, status, body) {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  });
  res.end(JSON.stringify(body));
}

async function fetchPaged(baseUrl, params) {
  const items = [];
  let page = null;

  do {
    const url = new URL(baseUrl);
    for (const [key, value] of params) {
      url.searchParams.append(key, value);
    }
    if (page) url.searchParams.set("page", page);

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${OPENAI_ADMIN_KEY}`,
        "Content-Type": "application/json"
      }
    });

    const text = await response.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = { error: { message: text || "Invalid upstream response" } };
    }

    if (!response.ok) {
      const message = data?.error?.message || `OpenAI API returned ${response.status}`;
      const err = new Error(message);
      err.status = response.status;
      throw err;
    }

    items.push(...(data.data || []));
    page = data.has_more ? data.next_page : null;
  } while (page);

  return items;
}

async function loadUsage(days) {
  if (!OPENAI_ADMIN_KEY) {
    const err = new Error("OPENAI_ADMIN_KEY is not configured on the server.");
    err.status = 503;
    throw err;
  }

  const cacheKey = String(days);
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) return cached.value;

  const end = Math.floor(Date.now() / 1000);
  const start = end - days * 86400;

  const usageParams = [
    ["start_time", String(start)],
    ["end_time", String(end)],
    ["bucket_width", "1d"],
    ["limit", "31"],
    ["group_by", "model"],
    ["group_by", "project_id"]
  ];

  const costParams = [
    ["start_time", String(start)],
    ["end_time", String(end)],
    ["bucket_width", "1d"],
    ["limit", "180"],
    ["group_by", "project_id"]
  ];

  const [usageBuckets, costBuckets] = await Promise.all([
    fetchPaged("https://api.openai.com/v1/organization/usage/completions", usageParams),
    fetchPaged("https://api.openai.com/v1/organization/costs", costParams)
  ]);

  const usage = [];
  for (const bucket of usageBuckets) {
    for (const result of bucket.results || []) {
      usage.push({
        timestamp: new Date(bucket.start_time * 1000).toISOString(),
        start_time: bucket.start_time,
        end_time: bucket.end_time,
        model: result.model || "unknown",
        project_id: result.project_id || "unassigned",
        input_tokens: Number(result.input_tokens || 0),
        output_tokens: Number(result.output_tokens || 0),
        cached_input_tokens: Number(result.input_cached_tokens || 0),
        requests: Number(result.num_model_requests || 0)
      });
    }
  }

  const costs = [];
  for (const bucket of costBuckets) {
    for (const result of bucket.results || []) {
      costs.push({
        timestamp: new Date(bucket.start_time * 1000).toISOString(),
        start_time: bucket.start_time,
        end_time: bucket.end_time,
        project_id: result.project_id || "unassigned",
        line_item: result.line_item || null,
        amount: Number(result.amount?.value || 0),
        currency: result.amount?.currency || "usd"
      });
    }
  }

  const totals = usage.reduce(
    (acc, row) => {
      acc.input_tokens += row.input_tokens;
      acc.output_tokens += row.output_tokens;
      acc.cached_input_tokens += row.cached_input_tokens;
      acc.requests += row.requests;
      return acc;
    },
    { input_tokens: 0, output_tokens: 0, cached_input_tokens: 0, requests: 0 }
  );

  totals.total_tokens = totals.input_tokens + totals.output_tokens;
  totals.cost = costs.reduce((sum, row) => sum + row.amount, 0);

  const value = {
    source: "openai-organization-usage",
    days,
    generated_at: new Date().toISOString(),
    totals,
    usage,
    costs
  };

  cache.set(cacheKey, { at: Date.now(), value });
  return value;
}

function serveStatic(req, res) {
  const publicDir = path.join(__dirname, "public");
  const requestPath = new URL(req.url, `http://${req.headers.host || "localhost"}`).pathname;
  const rel = requestPath === "/" ? "index.html" : requestPath.replace(/^\/+/, "");
  const file = path.normalize(path.join(publicDir, rel));

  if (!file.startsWith(publicDir)) {
    res.writeHead(403);
    return res.end("Forbidden");
  }

  fs.readFile(file, (err, data) => {
    if (err) {
      res.writeHead(404);
      return res.end("Not found");
    }
    const ext = path.extname(file);
    const types = {
      ".html": "text/html; charset=utf-8",
      ".js": "text/javascript; charset=utf-8",
      ".css": "text/css; charset=utf-8",
      ".json": "application/json; charset=utf-8"
    };
    res.writeHead(200, {
      "Content-Type": types[ext] || "application/octet-stream",
      "Cache-Control": ext === ".html" ? "no-cache" : "public, max-age=300"
    });
    res.end(data);
  });
}

const server = http.createServer(async (req, res) => {
  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    });
    return res.end();
  }

  const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);

  if (url.pathname === "/health") {
    return json(res, 200, {
      ok: true,
      key_configured: Boolean(OPENAI_ADMIN_KEY),
      time: new Date().toISOString()
    });
  }

  if (url.pathname === "/api/usage") {
    const rawDays = Number(url.searchParams.get("days") || 30);
    const days = Math.max(1, Math.min(180, Number.isFinite(rawDays) ? Math.floor(rawDays) : 30));

    try {
      return json(res, 200, await loadUsage(days));
    } catch (err) {
      return json(res, err.status || 500, {
        error: err.message || "Unable to load usage",
        generated_at: new Date().toISOString()
      });
    }
  }

  return serveStatic(req, res);
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`TokenTrack listening on :${PORT}`);
});
