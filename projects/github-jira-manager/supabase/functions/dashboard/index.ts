
function adminKey(): string {
  const raw = Deno.env.get("SUPABASE_SECRET_KEYS");
  if (raw) {
    const keys = JSON.parse(raw);
    if (keys.default) return keys.default;
  }
  const legacy = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (legacy) return legacy;
  throw new Error("Supabase admin key unavailable");
}

const esc = (v: unknown) => String(v ?? "")
  .replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;")
  .replaceAll('"',"&quot;").replaceAll("'","&#39;");

async function query(path: string) {
  const base = Deno.env.get("SUPABASE_URL")!;
  const res = await fetch(`${base}/rest/v1/${path}`, {
    headers: { "apikey": adminKey(), "Accept": "application/json" }
  });
  if (!res.ok) throw new Error(`database request failed: ${res.status}`);
  return await res.json();
}

Deno.serve(async () => {
  try {
    const projects = await query("gjm_projects?select=*&order=updated_at.desc");
    const activity = await query("gjm_project_activity?select=project_key,source,summary,detail,created_at&order=created_at.desc&limit=12");

    const cards = projects.map((p: any) => {
      const blocker = p.blocker ? `<div class="row"><b>Blocker</b><span class="warn">${esc(p.blocker)}</span></div>` : "";
      const links = [
        p.github_url ? `<a href="${esc(p.github_url)}" target="_blank" rel="noreferrer">GitHub</a>` : "",
        p.jira_url ? `<a href="${esc(p.jira_url)}" target="_blank" rel="noreferrer">Jira</a>` : "",
        p.runtime_url ? `<a href="${esc(p.runtime_url)}" target="_blank" rel="noreferrer">Runtime</a>` : ""
      ].filter(Boolean).join("");
      return `
        <section class="card">
          <div class="top"><div><h2>${esc(p.name)}</h2><p>${esc(p.summary)}</p></div><span class="status">${esc(p.status)}</span></div>
          <div class="meta"><span>Version <b>${esc(p.version || "—")}</b></span><span>${esc(p.progress_percent)}% complete</span></div>
          <div class="bar"><i style="width:${Number(p.progress_percent)||0}%"></i></div>
          <div class="row"><b>Now</b><span>${esc(p.current_focus || "—")}</span></div>
          <div class="row"><b>Next</b><span>${esc(p.next_step || "—")}</span></div>
          ${blocker}
          <div class="links">${links}</div>
        </section>`;
    }).join("");

    const feed = activity.map((a: any) => `
      <li><div><b>${esc(a.summary)}</b><small>${esc(a.project_key)} · ${esc(a.source)}</small></div>
      <span>${new Date(a.created_at).toLocaleString("en-CA", { timeZone: "America/Winnipeg", dateStyle:"medium", timeStyle:"short" })}</span></li>
    `).join("");

    const html = `<!doctype html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Project Knowledge Dashboard</title>
<style>
:root{font-family:Inter,system-ui,sans-serif;color:#151515;background:#f6f6f3}*{box-sizing:border-box}
body{margin:0}.wrap{max-width:1050px;margin:auto;padding:28px 18px 60px}header{margin-bottom:22px}
h1{margin:0 0 5px;font-size:30px}header p{margin:0;color:#666}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(320px,1fr));gap:16px}
.card,.activity{background:white;border:1px solid #e5e5df;border-radius:16px;padding:18px;box-shadow:0 2px 10px #00000008}
.top{display:flex;gap:12px;justify-content:space-between}.top h2{margin:0 0 6px;font-size:20px}.top p{margin:0;color:#626262;line-height:1.45}
.status{height:max-content;background:#eef4ff;padding:6px 9px;border-radius:999px;font-size:12px;font-weight:700}.meta{display:flex;justify-content:space-between;margin-top:16px;font-size:13px;color:#666}
.bar{height:7px;background:#ededeb;border-radius:99px;margin:8px 0 16px;overflow:hidden}.bar i{display:block;height:100%;background:#222;border-radius:99px}
.row{display:grid;grid-template-columns:62px 1fr;gap:8px;margin:10px 0;font-size:14px;line-height:1.4}.row b{color:#555}.warn{color:#9a4c00}
.links{display:flex;gap:8px;margin-top:15px}.links a{padding:7px 10px;border:1px solid #ddd;border-radius:9px;text-decoration:none;color:#222;font-size:13px}
.activity{margin-top:18px}.activity h2{font-size:18px;margin-top:0}.activity ul{list-style:none;padding:0;margin:0}.activity li{display:flex;justify-content:space-between;gap:14px;border-top:1px solid #eee;padding:11px 0;font-size:13px}.activity li:first-child{border-top:0}.activity small{display:block;color:#777;margin-top:3px}.activity li>span{color:#777;white-space:nowrap;font-size:12px}
footer{margin-top:18px;color:#777;font-size:12px}
@media(max-width:520px){.activity li{display:block}.activity li>span{display:block;margin-top:5px}.top{display:block}.status{display:inline-block;margin-top:10px}}
</style></head><body><div class="wrap">
<header><h1>Project Knowledge Dashboard</h1><p>Simple view of what is happening, what is blocked, and what comes next.</p></header>
<div class="grid">${cards}</div>
<section class="activity"><h2>Recent changes</h2><ul>${feed || "<li>No activity yet.</li>"}</ul></section>
<footer>GitHub is the source of truth · Jira tracks work · Supabase runs the dashboard and automation.</footer>
</div></body></html>`;

    return new Response(html, { headers: { "content-type":"text/html; charset=utf-8", "cache-control":"no-store" }});
  } catch (err) {
    return Response.json({ ok:false, error:String(err) }, { status:500 });
  }
});
