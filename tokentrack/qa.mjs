import fs from "node:fs";
import path from "node:path";

const root=process.cwd();
const read=p=>fs.readFileSync(path.join(root,p),"utf8");
const fail=message=>{console.error("QA FAILED:",message);process.exitCode=1};

const required=["server.js","public/index.html","public/app.js","public/styles.css","public/sw.js","public/manifest.webmanifest","public/icon.svg"];
for(const file of required)if(!fs.existsSync(path.join(root,file)))fail("missing "+file);

try{new Function(read("public/app.js"));console.log("QA app.js syntax OK")}catch(e){fail("app.js syntax: "+e.message)}
try{new Function(read("public/sw.js"));console.log("QA sw.js syntax OK")}catch(e){fail("sw.js syntax: "+e.message)}
try{JSON.parse(read("public/manifest.webmanifest"));console.log("QA manifest JSON OK")}catch(e){fail("manifest JSON: "+e.message)}

const html=read("public/index.html"),app=read("public/app.js");
const ids=new Set([...html.matchAll(/id="([^"]+)"/g)].map(m=>m[1]));
const refs=[...app.matchAll(/\$\("([^"]+)"\)/g)].map(m=>m[1]);
const missing=[...new Set(refs.filter(id=>!ids.has(id)))];
if(missing.length)fail("missing DOM IDs: "+missing.join(", "));else console.log("QA DOM references OK");

const publicFiles=["public/index.html","public/app.js","public/styles.css","public/sw.js","public/manifest.webmanifest"];
for(const file of publicFiles){
  const content=read(file);
  if(/sk-(?:admin-)?[A-Za-z0-9_-]{16,}/.test(content))fail("secret-like OpenAI key found in "+file);
}
console.log("QA public secret scan OK");

const server=read("server.js");
for(const marker of ["Strict-Transport-Security","timingSafeEqual","configuration_locked","gracefulShutdown","path.relative"]){
  if(!server.includes(marker))fail("server hardening marker missing: "+marker);
}
if(!process.exitCode)console.log("TokenTrack QA PASS");
