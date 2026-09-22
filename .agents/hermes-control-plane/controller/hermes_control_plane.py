#!/usr/bin/env python3
"""GitHub queue -> local Hermes Runs API -> GitHub results."""
from __future__ import annotations
import argparse, base64, json, os, re, socket, time
from datetime import datetime, timezone
from urllib import error, parse, request

VERSION = "0.1.0"
JOB_RE = re.compile(r"^[A-Za-z0-9][A-Za-z0-9._-]{0,119}$")
TERMINAL = {"completed", "failed", "cancelled", "interrupted"}
Q, C, R, A, D = ("runtime/queue","runtime/claims","runtime/results",
                  "runtime/archive/jobs","runtime/dead-letter")

def now():
    return datetime.now(timezone.utc).isoformat().replace("+00:00","Z")

class HttpError(RuntimeError):
    def __init__(self, status, msg, body=None):
        super().__init__(f"HTTP {status}: {msg}"); self.status=status; self.body=body

def http(method, url, headers=None, body=None, timeout=30):
    data = None if body is None else json.dumps(body,separators=(",",":")).encode()
    h={"Accept":"application/json", **(headers or {})}
    if data is not None: h["Content-Type"]="application/json"
    req=request.Request(url,data=data,headers=h,method=method)
    try:
        with request.urlopen(req,timeout=timeout) as res:
            raw=res.read()
            return {} if not raw else json.loads(raw.decode())
    except error.HTTPError as exc:
        raw=exc.read().decode(errors="replace")
        try: payload=json.loads(raw) if raw else {}
        except json.JSONDecodeError: payload={"raw":raw[:1000]}
        msg=(payload.get("message") if isinstance(payload,dict) else None)
        if not msg and isinstance(payload,dict) and isinstance(payload.get("error"),dict):
            msg=payload["error"].get("message")
        raise HttpError(exc.code,msg or str(exc.reason),payload) from exc
    except error.URLError as exc:
        raise RuntimeError(f"Network error: {exc.reason}") from exc

class GitHub:
    def __init__(self, repo, branch, token):
        self.repo,self.branch=repo,branch
        self.base=f"https://api.github.com/repos/{repo}/contents"
        self.h={"Authorization":f"Bearer {token}","X-GitHub-Api-Version":"2022-11-28",
                "User-Agent":f"hermes-control-plane/{VERSION}"}
    def url(self,path,ref=False):
        p="/".join(parse.quote(x,safe="") for x in path.split("/"))
        return f"{self.base}/{p}" + (f"?ref={parse.quote(self.branch,safe='')}" if ref else "")
    def list(self,path):
        try: x=http("GET",self.url(path,True),self.h)
        except HttpError as e:
            if e.status==404: return []
            raise
        return x if isinstance(x,list) else []
    def read(self,path):
        x=http("GET",self.url(path,True),self.h)
        raw=base64.b64decode(x["content"].replace("\n","")).decode()
        return json.loads(raw),x["sha"]
    def put(self,path,obj,msg,sha=None):
        body={"message":msg,"content":base64.b64encode((json.dumps(obj,indent=2)+"\n").encode()).decode(),
              "branch":self.branch}
        if sha: body["sha"]=sha
        return http("PUT",self.url(path),self.h,body)
    def delete(self,path,sha,msg):
        return http("DELETE",self.url(path),self.h,{"message":msg,"sha":sha,"branch":self.branch})
    def exists(self,path):
        try: http("GET",self.url(path,True),self.h); return True
        except HttpError as e:
            if e.status==404: return False
            raise

class Hermes:
    def __init__(self,base,key):
        self.base=base.rstrip("/")
        self.h={"Authorization":f"Bearer {key}","User-Agent":f"hermes-control-plane/{VERSION}"}
    def get(self,path): return http("GET",self.base+path,self.h)
    def post(self,path,body=None,headers=None):
        return http("POST",self.base+path,{**self.h,**(headers or {})},body or {})
    def preflight(self):
        caps=self.get("/v1/capabilities")
        f=caps.get("features",{}) if isinstance(caps,dict) else {}
        missing=[x for x in ("run_submission","run_status") if not f.get(x)]
        if missing: raise RuntimeError("Hermes missing capabilities: "+", ".join(missing))
        return self.get("/health/detailed")
    def start(self,job):
        payload={"input":job["input"]}
        for k in ("session_id","model","provider","model_options","instructions"):
            v=job.get(k)
            if v not in (None,"",{}): payload[k]=v
        return self.post("/v1/runs",payload,{"Idempotency-Key":"hcp-"+job["job_id"]})
    def status(self,rid): return self.get("/v1/runs/"+parse.quote(rid,safe=""))
    def stop(self,rid): return self.post("/v1/runs/"+parse.quote(rid,safe="")+"/stop")

def validate(job,filename=None):
    e=[]
    if job.get("schema_version")!="1.0": e.append("schema_version must be 1.0")
    jid=job.get("job_id")
    if not isinstance(jid,str) or not JOB_RE.fullmatch(jid): e.append("invalid job_id")
    elif filename and filename!=jid+".json": e.append("filename must equal <job_id>.json")
    for k in ("created_at","submitted_by","input"):
        if not isinstance(job.get(k),str) or not job[k].strip(): e.append(k+" must be non-empty")
    t=job.get("timeout_seconds",1800); p=job.get("poll_seconds",5)
    if not isinstance(t,int) or not 30<=t<=86400: e.append("timeout_seconds out of range")
    if not isinstance(p,int) or not 1<=p<=300: e.append("poll_seconds out of range")
    allowed={"schema_version","job_id","created_at","submitted_by","input","instructions","session_id",
             "model","provider","model_options","timeout_seconds","poll_seconds","metadata"}
    u=sorted(set(job)-allowed)
    if u: e.append("unknown fields: "+", ".join(u))
    return e

def claim(g,job,qpath,qsha,cid):
    obj={"schema_version":"1.0","job_id":job["job_id"],"controller_id":cid,
         "claimed_at":now(),"queue_path":qpath,"queue_sha":qsha,"hermes_run_id":None}
    try: g.put(f"{C}/{job['job_id']}.json",obj,f"Claim Hermes job {job['job_id']}"); return True
    except HttpError as e:
        if e.status in (409,422): return False
        raise

def dead(g,path,sha,payload,errors,cid):
    stem=re.sub(r"[^A-Za-z0-9._-]+","-",path.rsplit("/",1)[-1][:-5])[:100] or "invalid"
    obj={"schema_version":"1.0","rejected_at":now(),"controller_id":cid,
         "source_path":path,"source_sha":sha,"errors":errors,"payload":payload}
    g.put(f"{D}/{stem}-{int(time.time())}.json",obj,f"Dead-letter Hermes job {stem}")
    g.delete(path,sha,f"Remove invalid Hermes job {stem}")

def update_claim(g,jid,rid):
    p=f"{C}/{jid}.json"; obj,sha=g.read(p); obj["hermes_run_id"]=rid; obj["submitted_at"]=now()
    g.put(p,obj,sha=sha,msg=f"Attach Hermes run {rid} to {jid}")

def run_job(g,h,job,qpath,qsha,cid):
    started=now(); rid=None; last={}; outcome="controller_error"; readiness=None
    try:
        readiness=h.preflight()
        started_run=h.start(job); rid=started_run.get("run_id")
        if not rid: raise RuntimeError("Hermes returned no run_id")
        update_claim(g,job["job_id"],rid)
        end=time.monotonic()+job.get("timeout_seconds",1800)
        poll=job.get("poll_seconds",5)
        while True:
            last=h.status(rid); st=str(last.get("status",""))
            if st in TERMINAL: outcome=st; break
            if st=="waiting_for_approval":
                h.stop(rid); outcome="blocked_approval"; break
            if time.monotonic()>=end:
                h.stop(rid); outcome="timed_out"; break
            time.sleep(poll)
        try: last=h.status(rid)
        except Exception: pass
        err=last.get("error")
    except Exception as exc:
        err=f"{type(exc).__name__}: {exc}"
    result={"schema_version":"1.0","job_id":job["job_id"],"status":outcome,"controller_id":cid,
            "started_at":started,"finished_at":now(),"source":{"queue_path":qpath,"queue_sha":qsha},
            "metadata":job.get("metadata",{}),
            "hermes":{"run_id":rid,"reported_status":last.get("status"),"session_id":last.get("session_id"),
                      "model":last.get("model"),"output":last.get("output"),"usage":last.get("usage"),
                      "runtime":last.get("runtime"),"error":err,
                      "readiness_status":readiness.get("status") if isinstance(readiness,dict) else None}}
    return result

def finish(g,job,qpath,qsha,result):
    jid=job["job_id"]; rp=f"{R}/{jid}.json"; ap=f"{A}/{jid}.json"; cp=f"{C}/{jid}.json"
    if not g.exists(rp): g.put(rp,result,f"Record Hermes result {jid}")
    if not g.exists(ap): g.put(ap,job,f"Archive Hermes job {jid}")
    g.delete(qpath,qsha,f"Complete Hermes job {jid}")
    if g.exists(cp):
        _,sha=g.read(cp); g.delete(cp,sha,f"Release Hermes claim {jid}")

def cycle(g,h,cid):
    n=0
    for ent in sorted(g.list(Q),key=lambda x:x.get("name","")):
        name=ent.get("name","")
        if ent.get("type")!="file" or not name.endswith(".json"): continue
        path=f"{Q}/{name}"
        try: job,sha=g.read(path)
        except Exception as exc:
            if ent.get("sha"): dead(g,path,ent["sha"],{"unparsed":True},[str(exc)],cid); n+=1
            continue
        errors=validate(job,name)
        if errors: dead(g,path,sha,job,errors,cid); n+=1; continue
        if g.exists(f"{R}/{job['job_id']}.json"):
            g.delete(path,sha,f"Remove already-completed Hermes job {job['job_id']}"); n+=1; continue
        if not claim(g,job,path,sha,cid): continue
        result=run_job(g,h,job,path,sha,cid); finish(g,job,path,sha,result); n+=1
    return n

def settings():
    req={k:os.environ.get(k,"").strip() for k in ("GITHUB_TOKEN","HCP_RUNTIME_REPO","HERMES_API_KEY")}
    missing=[k for k,v in req.items() if not v]
    if missing: raise SystemExit("Missing env: "+", ".join(missing))
    if "/" not in req["HCP_RUNTIME_REPO"]: raise SystemExit("HCP_RUNTIME_REPO must be owner/repo")
    return req,os.environ.get("HCP_BRANCH","main"),os.environ.get("HERMES_API_URL","http://127.0.0.1:8642"),            max(1,int(os.environ.get("HCP_POLL_SECONDS","15"))),os.environ.get("HCP_CONTROLLER_ID") or socket.gethostname()

def main():
    ap=argparse.ArgumentParser(); ap.add_argument("--once",action="store_true"); ap.add_argument("--health",action="store_true")
    a=ap.parse_args(); s,branch,hurl,delay,cid=settings()
    g=GitHub(s["HCP_RUNTIME_REPO"],branch,s["GITHUB_TOKEN"]); h=Hermes(hurl,s["HERMES_API_KEY"])
    if a.health:
        print(json.dumps({"controller_version":VERSION,"controller_id":cid,"hermes":h.preflight()},indent=2)); return 0
    if a.once: print("processed="+str(cycle(g,h,cid))); return 0
    print(f"Hermes Control Plane v{VERSION} controller={cid} repo={s['HCP_RUNTIME_REPO']}",flush=True)
    while True:
        try:
            n=cycle(g,h,cid)
            if n: print(f"{now()} processed={n}",flush=True)
        except KeyboardInterrupt: return 0
        except Exception as exc: print(f"{now()} error={type(exc).__name__}: {exc}",flush=True)
        time.sleep(delay)

if __name__=="__main__": raise SystemExit(main())
