
const EXPECTED_ISSUER = "https://token.actions.githubusercontent.com";
const EXPECTED_AUDIENCE = "gjm-supabase";
const EXPECTED_REPOSITORY = "Jaskeeratsingh27/Jaskeeratsingh";

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
async function db(path: string, init: RequestInit = {}) {
  const base = Deno.env.get("SUPABASE_URL")!;
  const headers = new Headers(init.headers || {});
  headers.set("apikey", adminKey());
  headers.set("content-type", "application/json");
  headers.set("accept", "application/json");
  return await fetch(`${base}/rest/v1/${path}`, { ...init, headers });
}
function decodeB64Url(input: string): Uint8Array {
  const base64 = input.replaceAll("-", "+").replaceAll("_", "/") + "=".repeat((4 - input.length % 4) % 4);
  const binary = atob(base64);
  return Uint8Array.from(binary, c => c.charCodeAt(0));
}
function decodeJson(part: string): any {
  return JSON.parse(new TextDecoder().decode(decodeB64Url(part)));
}
let jwksCache: {expires:number, keys:any[]} | null = null;
async function oidcKeys(): Promise<any[]> {
  if (jwksCache && jwksCache.expires > Date.now()) return jwksCache.keys;
  const cfgRes = await fetch(EXPECTED_ISSUER + "/.well-known/openid-configuration");
  if (!cfgRes.ok) throw new Error("OIDC discovery failed");
  const cfg = await cfgRes.json();
  const keysRes = await fetch(cfg.jwks_uri);
  if (!keysRes.ok) throw new Error("OIDC JWKS fetch failed");
  const jwks = await keysRes.json();
  jwksCache = { expires: Date.now() + 60 * 60 * 1000, keys: jwks.keys || [] };
  return jwksCache.keys;
}
async function verifyOidc(token: string): Promise<any> {
  const parts = token.split(".");
  if (parts.length !== 3) throw new Error("Malformed OIDC token");
  const header = decodeJson(parts[0]);
  const claims = decodeJson(parts[1]);
  if (header.alg !== "RS256" || !header.kid) throw new Error("Unsupported OIDC signing algorithm");
  const now = Math.floor(Date.now()/1000);
  if (claims.iss !== EXPECTED_ISSUER) throw new Error("Invalid OIDC issuer");
  const audiences = Array.isArray(claims.aud) ? claims.aud : [claims.aud];
  if (!audiences.includes(EXPECTED_AUDIENCE)) throw new Error("Invalid OIDC audience");
  if (claims.repository !== EXPECTED_REPOSITORY) throw new Error("Untrusted repository");
  if (!claims.exp || claims.exp < now || (claims.nbf && claims.nbf > now + 30)) throw new Error("Expired/not-yet-valid OIDC token");
  const jwk = (await oidcKeys()).find(k => k.kid === header.kid);
  if (!jwk) throw new Error("OIDC signing key not found");
  const key = await crypto.subtle.importKey("jwk", jwk, { name:"RSASSA-PKCS1-v1_5", hash:"SHA-256" }, false, ["verify"]);
  const ok = await crypto.subtle.verify(
    { name:"RSASSA-PKCS1-v1_5" },
    key,
    decodeB64Url(parts[2]),
    new TextEncoder().encode(parts[0] + "." + parts[1])
  );
  if (!ok) throw new Error("Invalid OIDC signature");
  return claims;
}
async function sha256Hex(text: string): Promise<string> {
  const digest = new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text)));
  return [...digest].map(b => b.toString(16).padStart(2,"0")).join("");
}
function issueKey(...values: unknown[]): string | null {
  const text = values.filter(Boolean).join(" ");
  const m = text.match(/\b[A-Z][A-Z0-9]+-\d+\b/);
  return m ? m[0] : null;
}
async function audit(action:string, detail:any, workItem:string|null, eventId:string|null, operationId:string|null=null) {
  await db("gjm_audit_log", { method:"POST", body:JSON.stringify({
    work_item_id:workItem,event_id:eventId,operation_id:operationId,actor:"github-actions",action,detail
  })});
}
async function activity(summary:string, detail:string, dedupe:string) {
  await db("gjm_project_activity?on_conflict=dedupe_key", {
    method:"POST",
    headers:{Prefer:"resolution=ignore-duplicates"},
    body:JSON.stringify({project_key:"github-jira-manager",source:"github",summary,detail,dedupe_key:dedupe})
  });
  await db("gjm_projects?project_key=eq.github-jira-manager", {
    method:"PATCH", body:JSON.stringify({updated_at:new Date().toISOString()})
  });
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") return new Response("method not allowed",{status:405});
  try {
    const auth = req.headers.get("authorization") || "";
    if (!auth.startsWith("Bearer ")) return new Response("missing GitHub OIDC token",{status:401});
    const claims = await verifyOidc(auth.slice(7));
    const raw = await req.text();
    const input = JSON.parse(raw);
    if (input.repository !== EXPECTED_REPOSITORY) return new Response("repository mismatch",{status:403});

    const eventId = `github:${input.run_id}:${input.run_attempt || 1}`;
    const payloadHash = await sha256Hex(raw);
    const key = issueKey(input.head_ref, input.pr_title, input.ref);
    const eventType = `${input.event_name || "unknown"}:${input.action || "none"}`;

    const insertEvent = await db("gjm_events?on_conflict=event_id", {
      method:"POST",
      headers:{Prefer:"resolution=ignore-duplicates,return=representation"},
      body:JSON.stringify({event_id:eventId,source:"github",event_type:eventType,payload_sha256:payloadHash,work_item_id:key,status:"RECEIVED"})
    });
    if (!insertEvent.ok) throw new Error("event insert failed: " + insertEvent.status);
    const inserted = await insertEvent.json();
    if (!inserted.length) {
      const existingRes = await db(`gjm_events?event_id=eq.${encodeURIComponent(eventId)}&select=payload_sha256`);
      const existing = await existingRes.json();
      if (!existing[0] || existing[0].payload_sha256 !== payloadHash) {
        await audit("delivery_conflict",{event_id:eventId},key,eventId);
        return Response.json({ok:false,error:"delivery id reused with different payload"},{status:409});
      }
      return Response.json({ok:true,duplicate:true,event_id:eventId});
    }

    const ciPass = input.ci_result === "success";
    const qaPass = input.qa_result === "success";
    const humanMerge = Boolean(input.merged && input.merged_by && !String(input.merged_by).endsWith("[bot]"));

    let evidence = {ci_pass:ciPass,qa_pass:qaPass,human_merge_approved:humanMerge};
    if (key) {
      const oldRes = await db(`gjm_evidence?work_item_id=eq.${encodeURIComponent(key)}&select=*`);
      const old = (await oldRes.json())[0];
      if (old) evidence.human_merge_approved = old.human_merge_approved || humanMerge;
      await db("gjm_evidence?on_conflict=work_item_id", {
        method:"POST",
        headers:{Prefer:"resolution=merge-duplicates"},
        body:JSON.stringify({work_item_id:key,...evidence,updated_at:new Date().toISOString()})
      });
    }

    const ops:any[] = [];
    if (key) {
      if (!ciPass) {
        ops.push({operation:"jira.add_label",payload:{issue_key:key,label:"ci-blocked"}});
        ops.push({operation:"jira.transition",payload:{issue_key:key,target_status:"In Progress"}});
      } else {
        ops.push({operation:"jira.remove_label",payload:{issue_key:key,label:"ci-blocked"}});
      }
      if (["opened","reopened","synchronize"].includes(input.action) && !input.merged) {
        ops.push({operation:"jira.transition",payload:{issue_key:key,target_status:"In Progress"}});
      }
      if (input.action === "ready_for_review" && ciPass && qaPass) {
        ops.push({operation:"jira.transition",payload:{issue_key:key,target_status:"In Review"}});
      }
      if (input.action === "closed" && input.merged && ciPass && qaPass && evidence.human_merge_approved) {
        ops.push({operation:"jira.transition",payload:{issue_key:key,target_status:"Done"}});
      }
    }

    const unique = new Map<string,any>();
    for (const op of ops) unique.set(op.operation + ":" + JSON.stringify(op.payload), op);
    let n=0;
    for (const op of unique.values()) {
      const opId = `${eventId}:${++n}:${op.operation}`;
      const r = await db("gjm_outbox?on_conflict=operation_id", {
        method:"POST",headers:{Prefer:"resolution=ignore-duplicates"},
        body:JSON.stringify({operation_id:opId,event_id:eventId,operation:op.operation,payload:op.payload,status:"PENDING"})
      });
      if (!r.ok) throw new Error("outbox insert failed: " + r.status);
    }

    await db(`gjm_events?event_id=eq.${encodeURIComponent(eventId)}`, {
      method:"PATCH", body:JSON.stringify({status:"DECIDED",decision:{ci_pass:ciPass,qa_pass:qaPass,human_merge_approved:evidence.human_merge_approved,queued_operations:unique.size},updated_at:new Date().toISOString()})
    });
    await audit("event_decided",{event_type:eventType,ci_pass:ciPass,qa_pass:qaPass,operations:unique.size,oidc_actor:claims.actor},key,eventId);
    await activity(
      key ? `${key}: GitHub validation received` : "GitHub validation received",
      `Event ${eventType}; CI ${ciPass ? "passed" : "failed"}; QA ${qaPass ? "passed" : "failed"}; ${unique.size} operation(s) queued.`,
      eventId
    );

    return Response.json({ok:true,event_id:eventId,work_item_id:key,queued_operations:unique.size,ci_pass:ciPass,qa_pass:qaPass});
  } catch (err) {
    return Response.json({ok:false,error:String(err)},{status:401});
  }
});
