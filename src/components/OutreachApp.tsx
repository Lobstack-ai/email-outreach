'use client'
import { useState, useRef, useCallback, useEffect } from 'react'

// ── Field IDs ─────────────────────────────────────────────────────────────────
const F = {
  COMPANY:'fldw3U1aoS6SoFWm4', CONTACT:'fldcnT6Jr61hnqqnv',
  EMAIL:'fldQeb1rQjWmoxkA5',   TITLE:'fldDsy1HSJr5dFbal',
  TYPE:'fldDQlh5FhkLQPcHU',    STATUS:'fldnpr8ffpRMdRhrm',
  GH_URL:'flde6D0qEzgE2TQqg',  WEBSITE:'fldoKw9zV0qMsn9en',
  STARS:'fldMGcyW0bC3oKqN7',   AI_TOOLS:'fldXEZGaOSum0w2X9',
  NOTES:'fldSjec95F5g3psKl',   SUBJ:'fldgXC37R2fztZwvz',
  BODY:'fldSRXPILbk5XX0on',    ADDED:'fldoCWwQs23CWqlDH',
  CONTACTED:'fldug7dtHgFP41y71', FOLLOWUP:'fldnLEqy8IZlqJNSE',
  SOURCE:'fldTlfl2errtmqEdT',
}
const LF = {
  CAMPID:'fldzJGFePGwhCe8Nd', COMPANY:'fldbWOIVtdNZ2dIZ7',
  EMAIL:'fldf2j9bFzl7yesh7',  SUBJECT:'fldIMDxiF1q8SNzKy',
  STEP:'fldbb7EYkZ3JIjOEj',   SENTAT:'fldYLFGNnC6PLsIRP',
  MSGID:'fldyHyHAu2aAHJXza',  RESULT:'fldoPu5TMdiVwNmDT',
}

const TARGETS = [
  {org:'e2b-dev',name:'E2B',type:'Dev Tools / DevOps'},
  {org:'inngest',name:'Inngest',type:'Dev Tools / DevOps'},
  {org:'triggerdotdev',name:'Trigger.dev',type:'Dev Tools / DevOps'},
  {org:'modal-labs',name:'Modal Labs',type:'Dev Tools / DevOps'},
  {org:'traceloop',name:'Traceloop',type:'Dev Tools / DevOps'},
  {org:'langfuse',name:'Langfuse',type:'Dev Tools / DevOps'},
  {org:'agentops-ai',name:'AgentOps',type:'AI/ML Startup'},
  {org:'crewaiinc',name:'CrewAI',type:'AI/ML Startup'},
  {org:'langgenius',name:'Dify.AI',type:'AI/ML Startup'},
  {org:'mendableai',name:'Mendable',type:'AI/ML Startup'},
  {org:'flowise-ai',name:'Flowiseai',type:'AI/ML Startup'},
  {org:'phidatahq',name:'Phidata',type:'AI/ML Startup'},
  {org:'superagent-ai',name:'Superagent',type:'AI/ML Startup'},
  {org:'replicate',name:'Replicate',type:'AI/ML Startup'},
  {org:'cohere-ai',name:'Cohere',type:'Enterprise Tech (500+)'},
  {org:'fly-apps',name:'Fly.io',type:'SaaS (50-500)'},
  {org:'render-oss',name:'Render',type:'SaaS (50-500)'},
  {org:'relevanceai',name:'Relevance AI',type:'AI/ML Startup'},
  {org:'steamship-core',name:'Steamship',type:'AI/ML Startup'},
  {org:'fixieai',name:'Fixie AI',type:'AI/ML Startup'},
]

type Lead = {
  id:string; company:string; contactName:string; contactEmail:string
  jobTitle:string; companyType:string; status:string
  githubOrgUrl:string; website:string; aiTools:string; notes:string
  emailSubject:string; emailBody:string; source:string
}
type Log = {t:string; msg:string; type:'i'|'o'|'w'|'e'}
type Health = {ok:boolean; airtable?:any; github?:any; anthropic?:any; smtp?:any; env?:any; timestamp?:string}

function mapRecord(r:any): Lead {
  const f = r.fields||{}
  const g = (id:string)=>{const v=f[id];if(!v)return '';if(typeof v==='object'&&'name' in v)return v.name;return String(v)}
  return {
    id:r.id, company:g(F.COMPANY), contactName:g(F.CONTACT),
    contactEmail:g(F.EMAIL), jobTitle:g(F.TITLE), companyType:g(F.TYPE),
    status:g(F.STATUS)||'New', githubOrgUrl:g(F.GH_URL), website:g(F.WEBSITE),
    aiTools:g(F.AI_TOOLS), notes:g(F.NOTES), emailSubject:g(F.SUBJ),
    emailBody:g(F.BODY), source:g(F.SOURCE),
  }
}

// ── CSS ───────────────────────────────────────────────────────────────────────
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Geist:wght@100..900&family=Inter:wght@100..900&family=JetBrains+Mono:wght@100..800&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{
  --bg:#f4f4f4; --s1:#ffffff; --s2:#f7f7f7; --s3:#efefef;
  --border:#e8e8e8; --border2:#d4d4d4;
  --ink:#111111; --ink2:#444444; --ink3:#888888; --ink4:#bbbbbb;
  --dark:#0f1115; --dark2:#1a1d23;
  --red:#E84142; --red2:#D63839; --red3:#CE7878;
  --grad:linear-gradient(135deg,#E84142 0%,#D63839 50%,#CE7878 100%);
  --green:#16a34a; --yellow:#d97706; --blue:#2563eb;
  --sans:'Geist',sans-serif; --body:'Inter',sans-serif; --mono:'JetBrains Mono',monospace;
  --r:8px; --r2:12px;
  --shadow:0 1px 3px rgba(0,0,0,.08),0 1px 2px rgba(0,0,0,.05);
  --shadow-md:0 4px 12px rgba(0,0,0,.08),0 2px 4px rgba(0,0,0,.04);
}
body{background:var(--bg);color:var(--ink);font-family:var(--body);font-size:13px;line-height:1.5;-webkit-font-smoothing:antialiased}
::selection{background:#E8414220}

/* LAYOUT */
.shell{display:flex;flex-direction:column;min-height:100vh}
.topbar{
  display:flex;align-items:center;justify-content:space-between;
  padding:0 32px;height:56px;background:var(--s1);
  border-bottom:1px solid var(--border);position:sticky;top:0;z-index:100;
  box-shadow:var(--shadow);
}
.brand{display:flex;align-items:center;gap:10px}
.brand-name{font-family:var(--sans);font-weight:700;font-size:17px;letter-spacing:-0.4px;color:var(--ink)}
.brand-badge{
  font-family:var(--mono);font-size:9px;letter-spacing:1.5px;text-transform:uppercase;
  padding:2px 8px;border-radius:4px;font-weight:500;
  background:var(--dark);color:#fff;
}
.topbar-right{display:flex;align-items:center;gap:20px}
.sys-chip{display:flex;align-items:center;gap:5px;font-family:var(--mono);font-size:10px;color:var(--ink3)}
.dot{width:6px;height:6px;border-radius:50%;background:var(--border2);flex-shrink:0;transition:all .3s}
.dot.ok{background:var(--green);box-shadow:0 0 0 3px #16a34a20}
.dot.err{background:var(--red);box-shadow:0 0 0 3px #E8414220}
.dot.loading{background:var(--yellow);animation:pulse-dot 1s infinite}
@keyframes pulse-dot{0%,100%{opacity:1;box-shadow:0 0 0 0 #d9770640}50%{opacity:.6;box-shadow:0 0 0 4px #d9770620}}

/* NAV */
.nav{display:flex;background:var(--s1);border-bottom:1px solid var(--border);padding:0 32px;overflow-x:auto;gap:0}
.nb{
  display:flex;align-items:center;gap:6px;padding:0 16px;height:44px;
  font-family:var(--mono);font-size:11px;color:var(--ink3);cursor:pointer;
  background:none;border:none;border-bottom:2px solid transparent;
  white-space:nowrap;transition:all .15s;text-transform:uppercase;letter-spacing:.8px;
}
.nb:hover{color:var(--ink2)}
.nb.active{color:var(--ink);border-bottom-color:var(--red)}
.nb-icon{font-size:13px;opacity:.7}
.nn{
  font-size:9px;border-radius:4px;padding:1px 5px;min-width:16px;
  text-align:center;font-weight:600;background:var(--dark);color:#fff;
}
.nn.w{background:var(--red)}

/* PAGE */
.page{flex:1;padding:32px;max-width:1200px;margin:0 auto;width:100%}
.page-header{margin-bottom:28px}
.page-title{font-family:var(--sans);font-size:22px;font-weight:700;letter-spacing:-0.3px;color:var(--ink)}
.page-sub{font-size:13px;color:var(--ink3);margin-top:3px;font-family:var(--body)}

/* METRICS */
.metrics{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:28px}
.metric{
  background:var(--s1);border:1px solid var(--border);border-radius:var(--r2);
  padding:20px 22px;box-shadow:var(--shadow);cursor:default;transition:box-shadow .2s;
}
.metric:hover{box-shadow:var(--shadow-md)}
.mv{font-family:var(--sans);font-size:38px;font-weight:800;line-height:1;color:var(--ink);letter-spacing:-1px}
.mv.accent{background:var(--grad);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
.mv.green{color:var(--green)}
.mv.yellow{color:var(--yellow)}
.ml{font-family:var(--mono);font-size:10px;color:var(--ink3);text-transform:uppercase;letter-spacing:.8px;margin-top:8px}
.ms{font-size:11px;color:var(--ink4);margin-top:3px}

/* CARDS */
.card{background:var(--s1);border:1px solid var(--border);border-radius:var(--r2);padding:24px;margin-bottom:16px;box-shadow:var(--shadow)}
.card-hd{display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;gap:12px;flex-wrap:wrap}
.card-title{
  font-family:var(--mono);font-size:10px;font-weight:600;text-transform:uppercase;
  letter-spacing:1.5px;color:var(--ink3);display:flex;align-items:center;gap:8px;
}
.card-title::before{content:'';width:3px;height:12px;background:var(--grad);border-radius:2px;display:block;flex-shrink:0}

/* SYSTEM HEALTH CARDS */
.health-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:14px;margin-bottom:28px}
.hcard{
  background:var(--s1);border:1px solid var(--border);border-radius:var(--r2);
  padding:20px;box-shadow:var(--shadow);position:relative;overflow:hidden;
}
.hcard::after{content:'';position:absolute;top:0;left:0;right:0;height:3px;background:var(--border)}
.hcard.ok::after{background:var(--grad)}
.hcard.err::after{background:var(--red)}
.hcard.loading::after{background:linear-gradient(90deg,var(--border) 0%,var(--yellow) 50%,var(--border) 100%);background-size:200% 100%;animation:shimmer 1.5s infinite}
@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}
.hcard-top{display:flex;align-items:center;justify-content:space-between;margin-bottom:12px}
.hcard-icon{font-size:18px}
.hcard-status{
  font-family:var(--mono);font-size:10px;font-weight:600;text-transform:uppercase;
  letter-spacing:.8px;padding:3px 8px;border-radius:4px;
}
.hcard-status.ok{background:#16a34a15;color:var(--green)}
.hcard-status.err{background:#E8414215;color:var(--red)}
.hcard-status.loading{background:#d9770615;color:var(--yellow)}
.hcard-status.unknown{background:var(--s3);color:var(--ink3)}
.hcard-name{font-family:var(--sans);font-size:14px;font-weight:700;color:var(--ink);margin-bottom:4px}
.hcard-detail{font-size:12px;color:var(--ink3);font-family:var(--body)}
.hcard-meta{margin-top:10px;padding-top:10px;border-top:1px solid var(--border);display:flex;flex-wrap:wrap;gap:8px}
.hcard-tag{font-family:var(--mono);font-size:10px;color:var(--ink3);background:var(--s3);padding:2px 7px;border-radius:4px}
.hcard-tag.g{background:#16a34a10;color:var(--green)}
.hcard-tag.r{background:#E8414210;color:var(--red)}
.hcard-tag.y{background:#d9770610;color:var(--yellow)}

/* PIPELINE STATUS */
.pipeline{display:grid;grid-template-columns:repeat(4,1fr);gap:0;margin-bottom:28px;background:var(--s1);border:1px solid var(--border);border-radius:var(--r2);overflow:hidden;box-shadow:var(--shadow)}
.pipe-step{padding:20px 22px;border-right:1px solid var(--border);position:relative}
.pipe-step:last-child{border-right:none}
.pipe-num{font-family:var(--mono);font-size:10px;color:var(--ink4);letter-spacing:.5px;margin-bottom:8px}
.pipe-name{font-family:var(--sans);font-size:13px;font-weight:700;color:var(--ink);margin-bottom:6px}
.pipe-val{font-family:var(--sans);font-size:28px;font-weight:800;color:var(--ink);letter-spacing:-0.5px;line-height:1}
.pipe-val.done{color:var(--green)}
.pipe-val.partial{color:var(--yellow)}
.pipe-sub{font-size:11px;color:var(--ink3);margin-top:4px}
.pipe-action{
  margin-top:12px;display:inline-flex;align-items:center;gap:4px;
  font-family:var(--mono);font-size:10px;color:var(--red2);cursor:pointer;
  text-decoration:none;letter-spacing:.3px;
}
.pipe-action:hover{text-decoration:underline}
.pipe-bar{position:absolute;bottom:0;left:0;height:3px;background:var(--grad);transition:width .5s ease}

/* QUICK ACTIONS */
.qa-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:28px}
.qa{
  background:var(--s1);border:1px solid var(--border);border-radius:var(--r2);
  padding:18px 20px;cursor:pointer;transition:all .15s;box-shadow:var(--shadow);
  display:flex;align-items:flex-start;gap:14px;
}
.qa:hover{border-color:var(--red3);box-shadow:var(--shadow-md);transform:translateY(-1px)}
.qa:disabled{opacity:.5;cursor:not-allowed;transform:none}
.qa-icon{font-size:20px;flex-shrink:0;margin-top:1px}
.qa-text{}
.qa-title{font-family:var(--sans);font-size:13px;font-weight:700;color:var(--ink);margin-bottom:3px}
.qa-sub{font-size:11px;color:var(--ink3)}

/* ACTIVITY LOG */
.activity{background:var(--dark);border-radius:var(--r2);padding:16px;max-height:200px;overflow-y:auto}
.al{display:flex;gap:12px;padding:2px 0}
.al-time{font-family:var(--mono);font-size:10px;color:#4a5568;min-width:68px;flex-shrink:0;padding-top:1px}
.al-msg{font-family:var(--mono);font-size:11px;line-height:1.5}
.al-i{color:#94a3b8}.al-o{color:#86efac}.al-w{color:#fcd34d}.al-e{color:#fca5a5}
.al-empty{font-family:var(--mono);font-size:11px;color:#4a5568;text-align:center;padding:20px 0}

/* FORM */
.field{margin-bottom:16px}
.field label{display:block;font-family:var(--mono);font-size:10px;color:var(--ink3);text-transform:uppercase;letter-spacing:1px;margin-bottom:6px;font-weight:600}
.field input,.field select{
  width:100%;background:var(--bg);border:1.5px solid var(--border2);border-radius:var(--r);
  padding:9px 12px;color:var(--ink);font-family:var(--mono);font-size:12px;
  outline:none;transition:border-color .15s,box-shadow .15s;
}
.field input:focus,.field select:focus{border-color:var(--red2);box-shadow:0 0 0 3px #E8414210}
.field input::placeholder{color:var(--ink4)}
.g2{display:grid;grid-template-columns:1fr 1fr;gap:14px}
.s2{grid-column:1/-1}

/* BUTTONS */
.btn{
  display:inline-flex;align-items:center;gap:7px;padding:9px 20px;
  border-radius:999px;font-family:var(--mono);font-size:11px;font-weight:500;
  cursor:pointer;border:none;transition:all .15s;letter-spacing:.3px;white-space:nowrap;
}
.btn:disabled{opacity:.45;cursor:not-allowed;pointer-events:none}
.btn-dark{background:var(--dark);color:#fff}
.btn-dark:hover{background:var(--dark2);transform:translateY(-1px);box-shadow:0 4px 12px rgba(15,17,21,.25)}
.btn-red{background:var(--grad);color:#fff}
.btn-red:hover{opacity:.9;transform:translateY(-1px);box-shadow:0 4px 12px rgba(232,65,66,.3)}
.btn-ghost{background:transparent;border:1.5px solid var(--border2);color:var(--ink2)}
.btn-ghost:hover{border-color:var(--ink3);color:var(--ink)}
.btn-sm{padding:5px 14px;font-size:10px}
.btn-xs{padding:3px 10px;font-size:9px}
.btn-row{display:flex;gap:10px;align-items:center;flex-wrap:wrap}

/* ALERTS */
.alert{padding:12px 16px;border-radius:var(--r);font-size:12px;margin-bottom:16px;line-height:1.6;border:1px solid;display:flex;gap:10px;align-items:flex-start}
.alert-icon{flex-shrink:0;margin-top:1px}
.alert-body{flex:1}
.alert-title{font-weight:600;margin-bottom:2px;font-family:var(--sans);font-size:13px}
.ai{background:#E8414206;border-color:#E8414225;color:#7f1d1e}
.ao{background:#16a34a06;border-color:#16a34a25;color:#14532d}
.aw{background:#d9770606;border-color:#d9770625;color:#78350f}
.ae{background:#E8414210;border-color:#E8414235;color:#7f1d1e}

/* PROVIDER TOGGLE */
.pt{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:18px}
.po{padding:16px;border-radius:var(--r);cursor:pointer;border:1.5px solid var(--border2);background:var(--s2);transition:all .15s}
.po:hover{border-color:var(--ink3)}
.po.a{border-color:var(--red2);background:#E8414204}
.pon{font-family:var(--sans);font-weight:700;font-size:13px;margin-bottom:3px}
.po.a .pon{color:var(--red2)}
.pos{font-size:11px;color:var(--ink3);font-family:var(--body)}

/* SCRAPE GRID */
.sg{display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:10px;margin:14px 0}
.scard{padding:14px;border-radius:var(--r);background:var(--s1);border:1.5px solid var(--border);cursor:pointer;transition:all .2s;box-shadow:var(--shadow)}
.scard:hover{border-color:var(--ink3);box-shadow:var(--shadow-md)}
.scard.done{border-color:var(--green);background:#16a34a04}
.scard.running{border-color:var(--yellow);background:#d9770604;animation:pb .9s infinite}
.scard.fail{border-color:var(--red);background:#E8414204;cursor:pointer}
@keyframes pb{0%,100%{border-color:var(--yellow)}50%{border-color:#d9770650}}
.sn{font-family:var(--sans);font-weight:700;font-size:13px;margin-bottom:2px;color:var(--ink)}
.st{font-family:var(--mono);font-size:10px;color:var(--ink3)}
.ss{font-family:var(--mono);font-size:11px;color:var(--yellow);margin-top:4px}
.sr{font-size:10px;color:var(--ink3);margin-top:2px;font-family:var(--mono);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.sc-status{font-family:var(--mono);font-size:10px;margin-top:6px}

/* TABLE */
.tw{overflow-x:auto;border-radius:var(--r);border:1px solid var(--border);background:var(--s1);box-shadow:var(--shadow)}
table{width:100%;border-collapse:collapse;font-size:12px}
thead th{
  padding:10px 14px;text-align:left;font-family:var(--mono);font-size:10px;
  text-transform:uppercase;letter-spacing:.8px;color:var(--ink3);
  background:var(--s2);border-bottom:1px solid var(--border);white-space:nowrap;font-weight:600;
}
tbody td{padding:12px 14px;border-bottom:1px solid var(--border);vertical-align:middle;max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
tbody tr:last-child td{border-bottom:none}
tbody tr:hover td{background:var(--s2)}
tbody tr.sel td{background:#E8414206}
.ck{width:14px;height:14px;accent-color:var(--red2);cursor:pointer}

/* PILLS */
.pill{display:inline-flex;align-items:center;padding:2px 9px;border-radius:999px;font-family:var(--mono);font-size:10px;font-weight:500;text-transform:uppercase;letter-spacing:.3px;white-space:nowrap;border:1px solid}
.pn{background:var(--s3);color:var(--ink3);border-color:var(--border2)}
.ps{background:#d9770610;color:#92400e;border-color:#d9770630}
.pr{background:#16a34a10;color:#166534;border-color:#16a34a30}
.pb2{background:#E8414210;color:#7f1d1e;border-color:#E8414230}

/* PROGRESS */
.prog-wrap{margin:12px 0}
.prog{height:3px;background:var(--border);border-radius:2px;overflow:hidden}
.pf{height:100%;background:var(--grad);transition:width .4s ease;border-radius:2px}
.prog-label{display:flex;justify-content:space-between;font-family:var(--mono);font-size:10px;color:var(--ink3);margin-bottom:6px}

/* EMAIL PREVIEW */
.ep{background:var(--bg);border:1.5px solid var(--border);border-radius:var(--r);padding:20px;font-size:13px;line-height:1.75;white-space:pre-wrap;max-height:280px;overflow-y:auto;font-family:var(--body);color:var(--ink)}
.em{font-family:var(--mono);font-size:11px;color:var(--ink3);margin-bottom:14px;padding-bottom:14px;border-bottom:1px solid var(--border);display:flex;flex-direction:column;gap:4px}
.em span{color:var(--ink);font-weight:500}

/* CHECKLIST */
.cklist{display:flex;flex-direction:column;gap:4px}
.crow{display:flex;align-items:center;gap:10px;font-size:12px;padding:5px 8px;border-radius:6px;transition:background .1s}
.crow:hover{background:var(--s2)}
.ci{font-size:12px;width:18px;text-align:center;flex-shrink:0}

/* EMPTY STATE */
.empty{padding:48px 24px;text-align:center;color:var(--ink3)}
.empty-icon{font-size:32px;margin-bottom:12px}
.empty-title{font-family:var(--sans);font-size:15px;font-weight:600;color:var(--ink2);margin-bottom:6px}
.empty-sub{font-size:12px;margin-bottom:20px;max-width:320px;margin-left:auto;margin-right:auto;line-height:1.6}

/* TOAST */
.toasts{position:fixed;bottom:24px;right:24px;z-index:1000;display:flex;flex-direction:column;gap:8px;pointer-events:none}
.toast{
  display:flex;align-items:center;gap:10px;
  padding:12px 16px;border-radius:var(--r);
  background:var(--dark);color:#fff;
  font-family:var(--mono);font-size:11px;
  box-shadow:0 8px 24px rgba(0,0,0,.2);
  animation:slide-in .2s ease;pointer-events:all;
  max-width:320px;
}
@keyframes slide-in{from{transform:translateY(8px);opacity:0}to{transform:translateY(0);opacity:1}}
.toast-dot{width:6px;height:6px;border-radius:50%;flex-shrink:0}
.toast-dot.o{background:#86efac}
.toast-dot.w{background:#fcd34d}
.toast-dot.e{background:#fca5a5}

/* MISC */
hr{border:none;border-top:1px solid var(--border);margin:20px 0}
.stitle{font-family:var(--mono);font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:1.5px;color:var(--ink3);margin-bottom:12px}
.muted{color:var(--ink3)} .ok-text{color:var(--green)} .err-text{color:var(--red)}
code{background:var(--dark);color:#e2e8f0;padding:2px 7px;border-radius:4px;font-size:11px;font-family:var(--mono)}
.flex{display:flex}.gap8{gap:8px}.gap12{gap:12px}.gap16{gap:16px}
.items-center{align-items:center}.wrap{flex-wrap:wrap}.grow{flex:1}
.mb8{margin-bottom:8px}.mb16{margin-bottom:16px}.mb24{margin-bottom:24px}
::-webkit-scrollbar{width:5px;height:5px}
::-webkit-scrollbar-track{background:transparent}
::-webkit-scrollbar-thumb{background:var(--border2);border-radius:3px}
`

// ── TOAST ─────────────────────────────────────────────────────────────────────
let toastId = 0
function useToast() {
  const [toasts, setToasts] = useState<{id:number;msg:string;type:'o'|'w'|'e'}[]>([])
  const toast = useCallback((msg:string, type:'o'|'w'|'e'='o') => {
    const id = toastId++
    setToasts(p => [...p, {id, msg, type}])
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 3500)
  }, [])
  return {toasts, toast}
}

// ── APP ───────────────────────────────────────────────────────────────────────
export default function OutreachApp() {
  const [tab, setTab] = useState('mission')
  const [leads, setLeads] = useState<Lead[]>([])
  const [health, setHealth] = useState<Health|null>(null)
  const [healthLoading, setHealthLoading] = useState(false)
  const [scrSt, setScrSt] = useState<Record<string,'idle'|'running'|'done'|'fail'>>({})
  const [scraped, setScraped] = useState<Record<string,any>>({})
  const [sel, setSel] = useState<Set<string>>(new Set())
  const [genning, setGenning] = useState(false)
  const [genProgress, setGenProgress] = useState(0)
  const [sending, setSending] = useState(false)
  const [sendPct, setSendPct] = useState(0)
  const [preview, setPreview] = useState<Lead|null>(null)
  const [log, setLog] = useState<Log[]>([])
  const [provider, setProvider] = useState<'privateemail'|'gmail'>('privateemail')
  const logRef = useRef<HTMLDivElement>(null)
  const {toasts, toast} = useToast()

  const addLog = useCallback((msg:string, type:Log['type']='i') => {
    const t = new Date().toLocaleTimeString('en-US',{hour12:false})
    setLog(p => [...p.slice(-200),{t,msg,type}])
    setTimeout(()=>logRef.current&&(logRef.current.scrollTop=logRef.current.scrollHeight),40)
  },[])

  // Load health on mount
  useEffect(() => { runHealthCheck() }, [])

  // Load leads after health OK
  useEffect(() => {
    if (health?.airtable?.ok) loadLeads()
  }, [health?.airtable?.ok])

  // ── HEALTH ──
  const runHealthCheck = async () => {
    setHealthLoading(true)
    try {
      const r = await fetch('/api/health').then(r => r.json())
      setHealth(r)
      if (r.airtable?.ok) addLog(`✓ Airtable connected — ${r.airtable.leadsCount} leads, ${r.airtable.logsCount} logged`, 'o')
      else addLog(`✗ Airtable: ${r.airtable?.error || 'not configured'}`, 'e')
      if (r.github?.ok) addLog(`✓ GitHub — ${r.github.remaining}/${r.github.limit} req/hr remaining`, 'o')
      if (r.smtp?.ok) addLog(`✓ PrivateEmail SMTP — ${r.smtp.email}`, 'o')
      else if (r.env?.smtpEmail) addLog(`✗ SMTP auth failed: ${r.smtp?.error}`, 'e')
      if (r.anthropic?.ok) addLog(`✓ Anthropic API configured`, 'o')
    } catch(e:any) {
      addLog(`✗ Health check failed: ${e.message}`, 'e')
    }
    setHealthLoading(false)
  }

  // ── LEADS ──
  const loadLeads = async (silent=false) => {
    if (!silent) addLog('Loading leads from Airtable...', 'i')
    try {
      const r = await fetch('/api/airtable').then(r => r.json())
      if (!r.ok) { addLog(`✗ ${r.error}`, 'e'); return }
      setLeads(r.records.map(mapRecord))
      if (!silent) { addLog(`✓ ${r.records.length} leads loaded`, 'o'); toast(`${r.records.length} leads loaded`) }
    } catch(e:any) { addLog(`✗ ${e.message}`, 'e') }
  }

  // ── SCRAPE ──
  const scrapeOne = async (tgt:typeof TARGETS[0]) => {
    setScrSt(p => ({...p,[tgt.org]:'running'}))
    try {
      const r = await fetch(`/api/scrape?org=${tgt.org}`).then(r => r.json())
      if (!r.ok) throw new Error(r.error)
      setScraped(p => ({...p,[tgt.org]:r.data}))
      setScrSt(p => ({...p,[tgt.org]:'done'}))
      addLog(`  ✓ ${tgt.name} — ⭐${r.data.githubStars?.toLocaleString()} | ${r.data.topRepos}`, 'o')
    } catch(e:any) {
      setScrSt(p => ({...p,[tgt.org]:'fail'}))
      addLog(`  ✗ ${tgt.name}: ${e.message}`, 'e')
    }
  }

  const scrapeAll = async () => {
    addLog('=== GitHub scrape started ===', 'i')
    const rl = await fetch('/api/scrape?org=ratelimit').then(r=>r.json()).catch(()=>null)
    if (rl?.ok) addLog(`GitHub: ${rl.remaining}/${rl.limit} req remaining`, rl.remaining < 40 ? 'w' : 'i')
    for (const tgt of TARGETS) {
      if (scrSt[tgt.org]==='done') continue
      await scrapeOne(tgt)
      await new Promise(r=>setTimeout(r,250))
    }
    addLog('=== Scrape complete ===', 'o')
    toast(`${Object.values(scrSt).filter(s=>s==='done').length} orgs scraped`, 'o')
  }

  const saveToAirtable = async () => {
    const toSave = Object.values(scraped)
    if (!toSave.length) { toast('Nothing scraped yet', 'w'); return }
    addLog(`Saving ${toSave.length} leads to Airtable...`, 'i')
    let ok = 0
    for (const d of toSave) {
      try {
        const r = await fetch('/api/airtable',{
          method:'POST',headers:{'Content-Type':'application/json'},
          body:JSON.stringify({action:'create',fields:{
            [F.COMPANY]:d.company,[F.WEBSITE]:d.website||'',
            [F.GH_URL]:d.githubOrgUrl,[F.STARS]:d.githubStars,
            [F.TYPE]:d.companyType,[F.AI_TOOLS]:d.aiTools,
            [F.STATUS]:'New',[F.SOURCE]:'GitHub Scrape',
            [F.ADDED]:new Date().toISOString().split('T')[0],
            [F.NOTES]:d.description||'',
          }})
        }).then(r=>r.json())
        if (r.ok) {ok++; addLog(`  ✓ ${d.company}`,'o')}
        else addLog(`  ✗ ${d.company}: ${r.error}`,'e')
      } catch(e:any) { addLog(`  ✗ ${e.message}`,'e') }
      await new Promise(r=>setTimeout(r,200))
    }
    addLog(`Saved ${ok}/${toSave.length}`, ok===toSave.length?'o':'w')
    toast(`${ok} leads saved to CRM`, ok>0?'o':'e')
    await loadLeads(true)
  }

  // ── GENERATE ──
  const genEmails = async () => {
    const targets = leads.filter(l=>!l.emailBody&&(sel.size===0||sel.has(l.id)))
    if (!targets.length) { toast('No leads need emails', 'w'); return }
    setGenning(true); setGenProgress(0)
    addLog(`=== Generating ${targets.length} emails ===`,'i')
    for (let i=0;i<targets.length;i++) {
      const lead = targets[i]
      addLog(`Writing for ${lead.company}...`,'i')
      try {
        const r = await fetch('/api/generate',{
          method:'POST',headers:{'Content-Type':'application/json'},
          body:JSON.stringify({lead,senderName:'The Lobstack Team'})
        }).then(r=>r.json())
        if (!r.ok) throw new Error(r.error)
        await fetch('/api/airtable',{
          method:'POST',headers:{'Content-Type':'application/json'},
          body:JSON.stringify({action:'update',recordId:lead.id,fields:{[F.SUBJ]:r.subject,[F.BODY]:r.body}})
        })
        setLeads(p=>p.map(l=>l.id===lead.id?{...l,emailSubject:r.subject,emailBody:r.body}:l))
        addLog(`  ✓ "${r.subject}"`,'o')
      } catch(e:any) { addLog(`  ✗ ${lead.company}: ${e.message}`,'e') }
      setGenProgress(Math.round(((i+1)/targets.length)*100))
      await new Promise(r=>setTimeout(r,600))
    }
    setGenning(false)
    addLog('=== Generation complete ===','o')
    toast('Emails generated and saved to Airtable','o')
  }

  // ── SEND ──
  const runCampaign = async () => {
    const ready = leads.filter(l=>l.emailBody&&l.emailSubject&&l.contactEmail&&l.status==='New'&&(sel.size===0||sel.has(l.id)))
    if (!ready.length) { toast('No ready leads — add contact emails in Airtable first','w'); return }
    setSending(true); setSendPct(0)
    addLog(`=== Campaign: ${ready.length} leads via ${provider} ===`,'i')
    for (let i=0;i<ready.length;i++) {
      const lead = ready[i]
      addLog(`Sending → ${lead.company} (${lead.contactEmail})`,'i')
      try {
        let msgId = `sent-${Date.now()}`
        if (provider==='privateemail') {
          const r = await fetch('/api/send',{
            method:'POST',headers:{'Content-Type':'application/json'},
            body:JSON.stringify({to:lead.contactEmail,subject:lead.emailSubject,body:lead.emailBody})
          }).then(r=>r.json())
          if (!r.ok) throw new Error(r.error)
          msgId = r.messageId
        }
        await fetch('/api/airtable',{method:'POST',headers:{'Content-Type':'application/json'},
          body:JSON.stringify({action:'update',recordId:lead.id,fields:{
            [F.STATUS]:'Email Sent',[F.CONTACTED]:new Date().toISOString().split('T')[0],[F.FOLLOWUP]:1
          }})})
        await fetch('/api/airtable',{method:'POST',headers:{'Content-Type':'application/json'},
          body:JSON.stringify({action:'log',fields:{
            [LF.CAMPID]:`CAM-${Date.now()}`,[LF.COMPANY]:lead.company,
            [LF.EMAIL]:lead.contactEmail,[LF.SUBJECT]:lead.emailSubject,
            [LF.STEP]:'Cold Email #1',[LF.SENTAT]:new Date().toISOString(),
            [LF.MSGID]:msgId,[LF.RESULT]:'Sent',
          }})})
        setLeads(p=>p.map(l=>l.id===lead.id?{...l,status:'Email Sent'}:l))
        addLog(`  ✓ Sent to ${lead.company}`,'o')
      } catch(e:any) { addLog(`  ✗ ${lead.company}: ${e.message}`,'e') }
      setSendPct(Math.round(((i+1)/ready.length)*100))
      if (i<ready.length-1) {
        addLog('  ⏳ 45s cooldown...','w')
        await new Promise(r=>setTimeout(r,45000))
      }
    }
    setSending(false)
    toast(`Campaign complete — ${ready.length} emails sent`,'o')
    addLog('=== Campaign complete ===','o')
  }

  // ── STATS ──
  const stats = {
    total: leads.length,
    hasEmail: leads.filter(l=>l.emailBody).length,
    hasContact: leads.filter(l=>l.contactEmail).length,
    sent: leads.filter(l=>l.status==='Email Sent').length,
    replied: leads.filter(l=>l.status==='Replied').length,
    booked: leads.filter(l=>l.status==='Booked Call').length,
  }
  const scrapedCount = Object.values(scrSt).filter(s=>s==='done').length
  const readyCount = leads.filter(l=>l.emailBody&&l.emailSubject&&l.contactEmail&&l.status==='New').length

  const hStatus = (h:any) => !h ? 'unknown' : h.ok ? 'ok' : 'err'
  const hLabel  = (h:any) => !h ? 'Not checked' : h.ok ? 'Connected' : 'Error'

  const LogPanel = ({maxH='180px'}:{maxH?:string}) => (
    <div className="activity" ref={logRef} style={{maxHeight:maxH}}>
      {log.length===0
        ? <div className="al-empty">System log appears here</div>
        : log.map((l,i)=>(
          <div key={i} className="al">
            <span className="al-time">{l.t}</span>
            <span className={`al-msg al-${l.type}`}>{l.msg}</span>
          </div>
        ))}
    </div>
  )

  // ── MISSION CONTROL ──
  const MissionControl = () => (
    <>
      <div className="page-header">
        <div className="page-title">Mission Control</div>
        <div className="page-sub">Live system status and pipeline overview for Lobstack B2B outreach</div>
      </div>

      {/* SYSTEM HEALTH */}
      <div className="stitle">System Health</div>
      <div className="health-grid">
        {[
          {
            key:'airtable', icon:'🗄️', name:'Airtable CRM',
            detail: health?.airtable?.ok
              ? `${health.airtable.leadsCount} leads · ${health.airtable.logsCount} logged`
              : health?.airtable?.error || 'Not connected',
            tags: health?.airtable?.ok
              ? [{l:'Lobstack CRM',c:'g'},{l:'tblMgthKziXfnIPBV',c:''},{l:'Read + Write',c:'g'}]
              : [{l:'Check AIRTABLE_API_KEY in Vercel',c:'r'}],
            h: health?.airtable,
          },
          {
            key:'smtp', icon:'✉️', name:'PrivateEmail SMTP',
            detail: health?.smtp?.ok
              ? `Authenticated as ${health.smtp.email}`
              : health?.smtp?.email
                ? `Auth failed — ${health.smtp.error?.slice(0,50)}`
                : 'SMTP_EMAIL / SMTP_PASSWORD not set',
            tags: health?.smtp?.ok
              ? [{l:'mail.privateemail.com:587',c:'g'},{l:'STARTTLS',c:'g'}]
              : [{l:'Set credentials in Vercel env vars',c:'r'}],
            h: health?.smtp,
          },
          {
            key:'github', icon:'🐙', name:'GitHub API',
            detail: health?.github?.ok
              ? `${health.github.remaining}/${health.github.limit} requests remaining`
              : 'Not reachable',
            tags: health?.github
              ? [
                  {l: health.github.authenticated ? 'Token ✓' : 'Unauthenticated', c: health.github.authenticated ? 'g' : 'y'},
                  {l:`${health.github.limit}/hr limit`, c: health.github.limit===5000 ? 'g' : 'y'},
                ]
              : [{l:'Checking...',c:''}],
            h: health?.github,
          },
          {
            key:'anthropic', icon:'🤖', name:'Anthropic API',
            detail: health?.env?.anthropic
              ? 'API key configured — email generation ready'
              : 'ANTHROPIC_API_KEY not set in Vercel',
            tags: health?.env?.anthropic
              ? [{l:'claude-sonnet-4-20250514',c:'g'},{l:'Email generation',c:'g'}]
              : [{l:'Add key in Vercel → Settings → Env Vars',c:'r'}],
            h: health?.anthropic,
          },
        ].map(({key,icon,name,detail,tags,h}) => {
          const st = healthLoading ? 'loading' : hStatus(h)
          return (
            <div key={key} className={`hcard ${st}`}>
              <div className="hcard-top">
                <span className="hcard-icon">{icon}</span>
                <span className={`hcard-status ${st}`}>
                  {healthLoading ? 'Checking...' : hLabel(h)}
                </span>
              </div>
              <div className="hcard-name">{name}</div>
              <div className="hcard-detail">{detail}</div>
              {tags.length>0 && (
                <div className="hcard-meta">
                  {tags.map((t,i)=><span key={i} className={`hcard-tag ${t.c}`}>{t.l}</span>)}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* PIPELINE */}
      <div className="stitle">Campaign Pipeline</div>
      <div className="pipeline mb24">
        {[
          {num:'01', name:'Leads Scraped', val:scrapedCount||stats.total, total:TARGETS.length, sub:`of ${TARGETS.length} orgs targeted`, action:'Go to Scrape →', tab:'scrape'},
          {num:'02', name:'Emails Written', val:stats.hasEmail, total:stats.total||1, sub:`${stats.total-stats.hasEmail} remaining`, action:'Generate now →', tab:'generate'},
          {num:'03', name:'Contacts Added', val:stats.hasContact, total:stats.total||1, sub:'contact emails filled', action:'Open in Airtable →', tab:'crm'},
          {num:'04', name:'Emails Sent', val:stats.sent, total:stats.total||1, sub:`${stats.replied} replied · ${stats.booked} booked`, action:'Launch campaign →', tab:'send'},
        ].map(({num,name,val,total,sub,action,tab:t})=>{
          const pct = total>0 ? Math.round((val/total)*100) : 0
          const done = pct===100
          const partial = pct>0&&pct<100
          return (
            <div key={num} className="pipe-step">
              <div className="pipe-num">{num}</div>
              <div className="pipe-name">{name}</div>
              <div className={`pipe-val ${done?'done':partial?'partial':''}`}>{val}</div>
              <div className="pipe-sub">{sub}</div>
              <button className="pipe-action" onClick={()=>setTab(t)}>{action}</button>
              <div className="pipe-bar" style={{width:`${pct}%`}}/>
            </div>
          )
        })}
      </div>

      {/* QUICK ACTIONS */}
      <div className="stitle">Quick Actions</div>
      <div className="qa-grid mb24">
        {[
          {icon:'🔄', title:'Refresh Health', sub:'Re-ping all systems and reload lead count', action:runHealthCheck, disabled:healthLoading},
          {icon:'⭐', title:'Scrape GitHub', sub:'Pull latest data from all 20 target orgs', action:()=>setTab('scrape'), disabled:false},
          {icon:'✦', title:'Generate Emails', sub:`${leads.filter(l=>!l.emailBody).length} leads still need emails`, action:()=>setTab('generate'), disabled:false},
          {icon:'📋', title:'View CRM', sub:`${stats.total} leads · ${stats.hasContact} with contact emails`, action:()=>setTab('crm'), disabled:false},
          {icon:'🚀', title:'Send Campaign', sub:`${readyCount} leads ready to send`, action:()=>setTab('send'), disabled:readyCount===0},
          {icon:'🔗', title:'Open Airtable', sub:'Manage leads and add contact emails', action:()=>window.open('https://airtable.com/appnF2fNAyEYnscvo','_blank'), disabled:false},
        ].map(({icon,title,sub,action,disabled})=>(
          <button key={title} className="qa" onClick={action} disabled={disabled}>
            <div className="qa-icon">{icon}</div>
            <div className="qa-text">
              <div className="qa-title">{title}</div>
              <div className="qa-sub">{sub}</div>
            </div>
          </button>
        ))}
      </div>

      {/* LOG */}
      <div className="stitle">System Log</div>
      <LogPanel maxH="200px" />

      {/* ENV CHECKLIST */}
      {health && (
        <>
          <div className="stitle" style={{marginTop:24}}>Environment Variables</div>
          <div className="card" style={{padding:16}}>
            <div className="cklist">
              {[
                {label:'AIRTABLE_API_KEY', ok:!!health.env?.airtable, hint:'airtable.com/create/tokens — data.records read+write'},
                {label:'ANTHROPIC_API_KEY', ok:!!health.env?.anthropic, hint:'console.anthropic.com'},
                {label:'SMTP_EMAIL', ok:!!health.env?.smtpEmail, hint:`hello@lobstack.ai${health.env?.smtpEmailVal?' ('+health.env.smtpEmailVal+')':''}`},
                {label:'SMTP_PASSWORD', ok:!!health.env?.smtpPass, hint:'Your PrivateEmail password'},
                {label:'GITHUB_TOKEN', ok:!!health.env?.githubToken, hint:'Optional — raises rate limit 60→5000/hr'},
              ].map(({label,ok,hint})=>(
                <div key={label} className="crow">
                  <span className="ci" style={{color:ok?'var(--green)':'var(--ink4)'}}>{ok?'✓':'○'}</span>
                  <code style={{fontSize:11}}>{label}</code>
                  <span className="muted" style={{fontSize:11}}>{hint}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </>
  )

  // ── RENDER ──
  return (
    <>
      <style dangerouslySetInnerHTML={{__html:CSS}}/>

      {/* TOASTS */}
      <div className="toasts">
        {toasts.map(t=>(
          <div key={t.id} className="toast">
            <div className={`toast-dot ${t.type}`}/>
            {t.msg}
          </div>
        ))}
      </div>

      <div className="shell">
        {/* TOPBAR */}
        <div className="topbar">
          <div className="brand">
            <div className="brand-name">Lobstack</div>
            <div className="brand-badge">Outreach</div>
          </div>
          <div className="topbar-right">
            <div className="sys-chip">
              <div className={`dot ${healthLoading?'loading':health?.airtable?.ok?'ok':health?'err':''}`}/>
              Airtable
            </div>
            <div className="sys-chip">
              <div className={`dot ${healthLoading?'loading':health?.smtp?.ok?'ok':health?.env?.smtpEmail?'err':''}`}/>
              PrivateEmail
            </div>
            <div className="sys-chip">
              <div className={`dot ${health?.github?.ok?'ok':''}`}/>
              GitHub {health?.github?.remaining!=null?`${health.github.remaining}/hr`:''}
            </div>
            <button className="btn btn-ghost btn-xs" onClick={runHealthCheck} disabled={healthLoading}>
              {healthLoading?'Checking...':'↻ Refresh'}
            </button>
          </div>
        </div>

        {/* NAV */}
        <div className="nav">
          {[
            {id:'mission', icon:'⬡', label:'Mission Control'},
            {id:'scrape',  icon:'⭐', label:'Scrape', num:scrapedCount||null},
            {id:'crm',     icon:'◈',  label:'CRM', num:stats.total||null},
            {id:'generate',icon:'✦',  label:'Generate', num:stats.hasEmail||null},
            {id:'send',    icon:'▶',  label:'Send', num:readyCount||null, warn:readyCount===0&&stats.hasEmail>0},
          ].map(({id,icon,label,num,warn})=>(
            <button key={id} className={`nb ${tab===id?'active':''}`} onClick={()=>setTab(id)}>
              <span className="nb-icon">{icon}</span>
              {label}
              {num!=null&&<span className={`nn ${warn?'w':''}`}>{num}</span>}
            </button>
          ))}
        </div>

        {/* METRICS BAR */}
        <div style={{background:'var(--s1)',borderBottom:'1px solid var(--border)',padding:'0 32px'}}>
          <div style={{maxWidth:1200,margin:'0 auto',display:'grid',gridTemplateColumns:'repeat(6,1fr)',gap:0}}>
            {[
              {label:'Total Leads', val:stats.total},
              {label:'Emails Written', val:stats.hasEmail},
              {label:'Contacts Added', val:stats.hasContact},
              {label:'Emails Sent', val:stats.sent},
              {label:'Replies', val:stats.replied},
              {label:'Calls Booked', val:stats.booked},
            ].map(({label,val},i)=>(
              <div key={label} style={{
                padding:'12px 20px',
                borderRight:i<5?'1px solid var(--border)':'none',
                display:'flex',flexDirection:'column',gap:2,
              }}>
                <div style={{fontFamily:'var(--sans)',fontWeight:700,fontSize:18,color:val>0?'var(--ink)':'var(--ink4)'}}>{val}</div>
                <div style={{fontFamily:'var(--mono)',fontSize:9,color:'var(--ink3)',textTransform:'uppercase',letterSpacing:'.8px'}}>{label}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="page">

          {/* ── MISSION CONTROL ── */}
          {tab==='mission' && <MissionControl />}

          {/* ── SCRAPE ── */}
          {tab==='scrape' && <>
            <div className="page-header">
              <div className="page-title">GitHub Lead Scraper</div>
              <div className="page-sub">Enriching {TARGETS.length} AI-forward orgs — stars, repos, AI tool detection</div>
            </div>
            <div className="card">
              <div className="card-hd">
                <div className="card-title">Target Orgs</div>
                <div className="btn-row">
                  <button className="btn btn-dark" onClick={scrapeAll} disabled={Object.values(scrSt).some(s=>s==='running')}>
                    ⭐ Scrape All
                  </button>
                  <button className="btn btn-red" onClick={saveToAirtable} disabled={!scrapedCount}>
                    ↑ Save {scrapedCount} to CRM
                  </button>
                  <button className="btn btn-ghost btn-sm" onClick={()=>loadLeads()}>↻ Reload CRM</button>
                </div>
              </div>
              {health?.github && !health.github.ok && (
                <div className="alert ae mb16">
                  <span className="alert-icon">⚠</span>
                  <div className="alert-body">
                    <div className="alert-title">GitHub API unreachable</div>
                    Check your GITHUB_TOKEN env var in Vercel.
                  </div>
                </div>
              )}
              {health?.github?.remaining < 40 && (
                <div className="alert aw mb16">
                  <span className="alert-icon">⚡</span>
                  <div className="alert-body">
                    <div className="alert-title">Low rate limit — {health.github.remaining} requests remaining</div>
                    {health.github.authenticated ? 'Wait for reset.' : 'Add GITHUB_TOKEN to Vercel env vars for 5,000/hr.'}
                  </div>
                </div>
              )}
              <div className="sg">
                {TARGETS.map(tgt=>{
                  const st=scrSt[tgt.org]||'idle', d=scraped[tgt.org]
                  return (
                    <div key={tgt.org} className={`scard ${st==='done'?'done':st==='running'?'running':st==='fail'?'fail':''}`}
                      onClick={()=>(st==='idle'||st==='fail')&&scrapeOne(tgt)}>
                      <div className="sn">{tgt.name}</div>
                      <div className="st">{tgt.type}</div>
                      {d ? <>
                        <div className="ss">⭐ {d.githubStars?.toLocaleString()}</div>
                        <div className="sr">{d.topRepos}</div>
                        <div className="sc-status" style={{color:'var(--green)'}}>✓ ready</div>
                      </> : (
                        <div className="sc-status" style={{color:st==='running'?'var(--yellow)':st==='fail'?'var(--red)':'var(--ink4)'}}>
                          {st==='running'?'⏳ scraping...':st==='fail'?'✗ retry':st==='idle'?'click to scrape':''}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
            <div className="card">
              <div className="card-title" style={{marginBottom:14}}>Scrape Log</div>
              <LogPanel />
            </div>
          </>}

          {/* ── CRM ── */}
          {tab==='crm' && <>
            <div className="page-header">
              <div className="page-title">Lead CRM</div>
              <div className="page-sub">All leads from Lobstack CRM · Airtable: appnF2fNAyEYnscvo</div>
            </div>
            <div className="card">
              <div className="card-hd">
                <div className="card-title">Lobstack Leads</div>
                <div className="btn-row">
                  <button className="btn btn-ghost btn-sm" onClick={()=>loadLeads()}>↻ Refresh</button>
                  {sel.size>0&&<button className="btn btn-ghost btn-sm" onClick={()=>setSel(new Set())}>Clear {sel.size}</button>}
                  <button className="btn btn-ghost btn-sm" onClick={()=>window.open('https://airtable.com/appnF2fNAyEYnscvo','_blank')}>
                    ↗ Open Airtable
                  </button>
                  <span className="muted" style={{fontSize:11,fontFamily:'var(--mono)'}}>{stats.total} total · {stats.hasContact} contacts</span>
                </div>
              </div>
              {leads.length===0 ? (
                <div className="empty">
                  <div className="empty-icon">◈</div>
                  <div className="empty-title">No leads yet</div>
                  <div className="empty-sub">Scrape GitHub orgs then save to Airtable, or add leads directly in Airtable.</div>
                  <button className="btn btn-dark" onClick={()=>setTab('scrape')}>⭐ Go to Scraper</button>
                </div>
              ) : (
                <div className="tw">
                  <table>
                    <thead><tr>
                      <th><input type="checkbox" className="ck" onChange={e=>setSel(e.target.checked?new Set(leads.map(l=>l.id)):new Set())}/></th>
                      <th>Company</th><th>Type</th><th>Contact Email</th>
                      <th>Status</th><th>AI Tools</th><th>Email</th><th></th>
                    </tr></thead>
                    <tbody>
                      {leads.map(lead=>(
                        <tr key={lead.id} className={sel.has(lead.id)?'sel':''}>
                          <td><input type="checkbox" className="ck" checked={sel.has(lead.id)} onChange={e=>{const s=new Set(sel);e.target.checked?s.add(lead.id):s.delete(lead.id);setSel(s)}}/></td>
                          <td><strong>{lead.company}</strong></td>
                          <td><span className="muted">{lead.companyType}</span></td>
                          <td>
                            {lead.contactEmail
                              ? <span style={{color:'var(--ink)'}}>{lead.contactEmail}</span>
                              : <span className="muted" style={{fontStyle:'italic'}}>— add in Airtable</span>}
                          </td>
                          <td><span className={`pill ${lead.status==='Email Sent'?'ps':lead.status==='Replied'?'pr':lead.status==='Booked Call'?'pb2':'pn'}`}>{lead.status||'New'}</span></td>
                          <td><span className="muted">{lead.aiTools||'—'}</span></td>
                          <td>
                            {lead.emailBody
                              ? <span style={{color:'var(--green)',fontFamily:'var(--mono)',fontSize:10}}>✓ written</span>
                              : <span className="muted" style={{fontSize:10}}>—</span>}
                          </td>
                          <td>
                            {lead.emailBody&&<button className="btn btn-ghost btn-xs" onClick={()=>setPreview(lead)}>Preview</button>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            {preview&&(
              <div className="card">
                <div className="card-hd">
                  <div className="card-title">{preview.company} — Email Preview</div>
                  <button className="btn btn-ghost btn-sm" onClick={()=>setPreview(null)}>✕ Close</button>
                </div>
                <div className="em">
                  <div>To: <span>{preview.contactEmail||'(no contact email)'}</span></div>
                  <div>Subject: <span>{preview.emailSubject}</span></div>
                </div>
                <div className="ep">{preview.emailBody}</div>
              </div>
            )}
            <div className="alert ai">
              <span className="alert-icon">💡</span>
              <div className="alert-body">
                <div className="alert-title">Add contact emails to unlock sending</div>
                Open Airtable → Lobstack Leads → fill in the Contact Email column. Target CTOs, VPs Engineering, or founders.
                Use <strong>Hunter.io</strong>, <strong>Apollo.io</strong>, or <strong>LinkedIn Sales Navigator</strong>.
              </div>
            </div>
          </>}

          {/* ── GENERATE ── */}
          {tab==='generate' && <>
            <div className="page-header">
              <div className="page-title">Email Generation</div>
              <div className="page-sub">Claude writes personalised cold emails per lead, saved directly to Airtable</div>
            </div>
            <div className="card">
              <div className="card-hd">
                <div className="card-title">Generate Emails</div>
                <div className="btn-row">
                  <button className="btn btn-dark" onClick={genEmails} disabled={genning||!leads.length}>
                    {genning?'⏳ Generating...':'✦ Generate'}
                  </button>
                  <span className="muted" style={{fontFamily:'var(--mono)',fontSize:11}}>{stats.hasEmail}/{stats.total} done</span>
                </div>
              </div>
              {!health?.env?.anthropic&&(
                <div className="alert ae mb16">
                  <span className="alert-icon">⚠</span>
                  <div className="alert-body">
                    <div className="alert-title">ANTHROPIC_API_KEY not set</div>
                    Add it in Vercel → Settings → Environment Variables, then redeploy.
                  </div>
                </div>
              )}
              {genning&&(
                <div className="prog-wrap">
                  <div className="prog-label"><span>Generating...</span><span>{genProgress}%</span></div>
                  <div className="prog"><div className="pf" style={{width:`${genProgress}%`}}/></div>
                </div>
              )}
              {leads.length===0?(
                <div className="empty">
                  <div className="empty-icon">✦</div>
                  <div className="empty-title">No leads loaded</div>
                  <div className="empty-sub">Scrape and save GitHub orgs first, then come back to generate emails.</div>
                  <button className="btn btn-dark" onClick={()=>setTab('scrape')}>⭐ Go to Scraper</button>
                </div>
              ):(
                <LogPanel />
              )}
            </div>
            {leads.filter(l=>l.emailBody).length>0&&(
              <div className="card">
                <div className="card-title" style={{marginBottom:18}}>Generated Emails</div>
                {leads.filter(l=>l.emailBody).slice(0,5).map(lead=>(
                  <div key={lead.id} style={{marginBottom:20,paddingBottom:20,borderBottom:'1px solid var(--border)'}}>
                    <div className="flex items-center gap8 mb8">
                      <strong>{lead.company}</strong>
                      <span className="muted">{lead.companyType}</span>
                    </div>
                    <div className="em"><div>Subject: <span>{lead.emailSubject}</span></div></div>
                    <div className="ep" style={{maxHeight:120}}>{lead.emailBody}</div>
                  </div>
                ))}
                {leads.filter(l=>l.emailBody).length>5&&(
                  <div className="muted" style={{fontSize:12,textAlign:'center'}}>
                    +{leads.filter(l=>l.emailBody).length-5} more — view all in CRM tab
                  </div>
                )}
              </div>
            )}
          </>}

          {/* ── SEND ── */}
          {tab==='send' && <>
            <div className="page-header">
              <div className="page-title">Send Campaign</div>
              <div className="page-sub">Deploy emails via PrivateEmail SMTP · 45s cooldown between sends</div>
            </div>

            {/* PROVIDER */}
            <div className="card">
              <div className="card-title" style={{marginBottom:16}}>Email Provider</div>
              <div className="pt">
                {[
                  {id:'privateemail',name:'PrivateEmail (Namecheap)',sub:'mail.privateemail.com · STARTTLS :587 · Sends from Vercel server directly'},
                  {id:'gmail',name:'Gmail',sub:'Via Claude Gmail MCP integration'},
                ].map(p=>(
                  <div key={p.id} className={`po ${provider===p.id?'a':''}`} onClick={()=>setProvider(p.id as any)}>
                    <div className="pon">{provider===p.id?'● ':''}{p.name}</div>
                    <div className="pos">{p.sub}</div>
                  </div>
                ))}
              </div>

              <div className="card-hd" style={{marginBottom:0}}>
                <div className="card-title">Launch</div>
                <div className="btn-row">
                  <button className="btn btn-red" onClick={runCampaign} disabled={sending||!readyCount}>
                    {sending?`⏳ Sending... ${sendPct}%`:`▶ Send Campaign (${readyCount} ready)`}
                  </button>
                  <span className="muted" style={{fontSize:11,fontFamily:'var(--mono)'}}>{stats.sent} sent · {stats.replied} replied</span>
                </div>
              </div>

              {sending&&(
                <div className="prog-wrap" style={{marginTop:12}}>
                  <div className="prog-label"><span>Sending...</span><span>{sendPct}%</span></div>
                  <div className="prog"><div className="pf" style={{width:`${sendPct}%`}}/></div>
                </div>
              )}
            </div>

            {/* CHECKLIST */}
            <div className="card">
              <div className="card-title" style={{marginBottom:16}}>Pre-Send Checklist</div>
              <div className="cklist">
                {[
                  {label:'Airtable connected', ok:health?.airtable?.ok??false},
                  {label:`SMTP credentials verified`, ok:health?.smtp?.ok??false, soft:!!health?.env?.smtpEmail&&!health?.smtp?.ok},
                  {label:`Anthropic API configured`, ok:!!health?.env?.anthropic},
                  {label:`Leads loaded (${stats.total})`, ok:stats.total>0},
                  {label:`Emails generated (${stats.hasEmail})`, ok:stats.hasEmail>0},
                  {label:`Contact emails filled (${stats.hasContact})`, ok:stats.hasContact>0, soft:stats.hasContact<stats.total},
                  {label:`${readyCount} leads ready to send`, ok:readyCount>0},
                ].map(({label,ok,soft}:{label:string,ok:boolean,soft?:boolean})=>(
                  <div key={label} className="crow">
                    <span className="ci" style={{color:ok?'var(--green)':soft?'var(--yellow)':'var(--ink4)'}}>{ok?'✓':soft?'⚠':'○'}</span>
                    <span style={{color:ok?'var(--ink)':'var(--ink3)'}}>{label}</span>
                  </div>
                ))}
              </div>

              <div style={{marginTop:16,padding:'14px 16px',background:'var(--s2)',borderRadius:'var(--r)',border:'1px solid var(--border)'}}>
                <div style={{fontFamily:'var(--mono)',fontSize:10,color:'var(--ink3)',textTransform:'uppercase',letterSpacing:'1px',marginBottom:8}}>Contact Emails</div>
                <p style={{fontSize:12,color:'var(--ink3)',lineHeight:1.6}}>
                  Open <button className="pipe-action" onClick={()=>window.open('https://airtable.com/appnF2fNAyEYnscvo','_blank')}>Airtable → Lobstack Leads ↗</button> and fill in the Contact Email column.
                  Target CTOs, VPs Engineering, or founders. Use <strong>Hunter.io</strong>, <strong>Apollo.io</strong>, or <strong>LinkedIn Sales Navigator</strong>.
                </p>
              </div>
            </div>

            {/* LOG */}
            <div className="card">
              <div className="card-title" style={{marginBottom:14}}>Campaign Log</div>
              <LogPanel />
            </div>
          </>}

        </div>
      </div>
    </>
  )
}
