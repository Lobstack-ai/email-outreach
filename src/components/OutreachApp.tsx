'use client'
import { useState, useRef, useCallback, useEffect } from 'react'

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
  {org:'e2b-dev',name:'E2B',type:'Dev Tools'},
  {org:'inngest',name:'Inngest',type:'Dev Tools'},
  {org:'triggerdotdev',name:'Trigger.dev',type:'Dev Tools'},
  {org:'modal-labs',name:'Modal Labs',type:'Dev Tools'},
  {org:'traceloop',name:'Traceloop',type:'Dev Tools'},
  {org:'langfuse',name:'Langfuse',type:'Dev Tools'},
  {org:'agentops-ai',name:'AgentOps',type:'AI Startup'},
  {org:'crewaiinc',name:'CrewAI',type:'AI Startup'},
  {org:'langgenius',name:'Dify.AI',type:'AI Startup'},
  {org:'mendableai',name:'Mendable',type:'AI Startup'},
  {org:'FlowiseAI',name:'Flowiseai',type:'AI Startup'},
  {org:'phidatahq',name:'Phidata',type:'AI Startup'},
  {org:'superagent-ai',name:'Superagent',type:'AI Startup'},
  {org:'replicate',name:'Replicate',type:'AI Startup'},
  {org:'cohere-ai',name:'Cohere',type:'Enterprise'},
  {org:'fly-apps',name:'Fly.io',type:'SaaS'},
  {org:'render-oss',name:'Render',type:'SaaS'},
  {org:'relevanceai',name:'Relevance AI',type:'AI Startup'},
  {org:'steamship-core',name:'Steamship',type:'AI Startup'},
  {org:'fixieai',name:'Fixie AI',type:'AI Startup'},
]

type Lead={id:string;company:string;contactName:string;contactEmail:string;jobTitle:string;companyType:string;status:string;githubOrgUrl:string;website:string;aiTools:string;notes:string;emailSubject:string;emailBody:string;source:string}
type Log={t:string;msg:string;type:'i'|'o'|'w'|'e'}

function mapRecord(r:any):Lead{
  const f=r.fields||{}
  const g=(id:string)=>{const v=f[id];if(!v)return '';if(typeof v==='object'&&'name' in v)return v.name;return String(v)}
  return{id:r.id,company:g(F.COMPANY),contactName:g(F.CONTACT),contactEmail:g(F.EMAIL),jobTitle:g(F.TITLE),companyType:g(F.TYPE),status:g(F.STATUS)||'New',githubOrgUrl:g(F.GH_URL),website:g(F.WEBSITE),aiTools:g(F.AI_TOOLS),notes:g(F.NOTES),emailSubject:g(F.SUBJ),emailBody:g(F.BODY),source:g(F.SOURCE)}
}

const CSS=`
@import url('https://fonts.googleapis.com/css2?family=Geist:wght@100..900&family=Inter:wght@100..900&family=JetBrains+Mono:wght@100..800&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{
  --bg:#f4f4f4;--s1:#fff;--s2:#f7f7f7;--s3:#efefef;
  --b:#e8e8e8;--b2:#d4d4d4;
  --ink:#111;--ink2:#444;--ink3:#888;--ink4:#bbb;
  --dark:#0f1115;--dark2:#1c2029;
  --red:#E84142;--red2:#D63839;--red3:#CE7878;
  --grad:linear-gradient(135deg,#E84142 0%,#D63839 50%,#CE7878 100%);
  --green:#16a34a;--yellow:#d97706;
  --sans:'Geist',sans-serif;--body:'Inter',sans-serif;--mono:'JetBrains Mono',monospace;
  --r:8px;--r2:12px;
  --sh:0 1px 3px rgba(0,0,0,.07),0 1px 2px rgba(0,0,0,.04);
  --sh2:0 4px 16px rgba(0,0,0,.08),0 2px 6px rgba(0,0,0,.04);
}
body{background:var(--bg);color:var(--ink);font-family:var(--body);font-size:13px;line-height:1.5;-webkit-font-smoothing:antialiased}
::selection{background:#E8414220}
.shell{display:flex;flex-direction:column;min-height:100vh}

/* TOPBAR */
.topbar{display:flex;align-items:center;justify-content:space-between;padding:0 32px;height:54px;background:var(--s1);border-bottom:1px solid var(--b);position:sticky;top:0;z-index:100;box-shadow:var(--sh)}
.brand{display:flex;align-items:center;gap:10px}
.brand-name{font-family:var(--sans);font-weight:700;font-size:16px;letter-spacing:-.4px}
.brand-tag{font-family:var(--mono);font-size:9px;letter-spacing:1.5px;text-transform:uppercase;padding:2px 8px;border-radius:4px;background:var(--dark);color:#fff;font-weight:500}
.topbar-r{display:flex;align-items:center;gap:14px}
.chip{display:flex;align-items:center;gap:5px;font-family:var(--mono);font-size:10px;color:var(--ink3);padding:4px 10px;border-radius:20px;border:1px solid var(--b);background:var(--s2);transition:all .2s}
.chip.ok{border-color:#16a34a30;background:#16a34a06;color:#166534}
.chip.err{border-color:#E8414230;background:#E8414206;color:#7f1d1e}
.dot{width:6px;height:6px;border-radius:50%;background:var(--b2);flex-shrink:0;transition:all .3s}
.dot.ok{background:var(--green)}
.dot.err{background:var(--red)}
.dot.spin{background:var(--yellow);animation:pdot 1s infinite}
@keyframes pdot{0%,100%{opacity:1}50%{opacity:.3}}

/* NAV */
.nav{display:flex;background:var(--s1);border-bottom:1px solid var(--b);padding:0 32px;overflow-x:auto}
.nb{display:flex;align-items:center;gap:7px;padding:0 18px;height:42px;font-family:var(--mono);font-size:10px;color:var(--ink3);cursor:pointer;background:none;border:none;border-bottom:2px solid transparent;white-space:nowrap;transition:all .15s;text-transform:uppercase;letter-spacing:1px}
.nb:hover{color:var(--ink)}
.nb.active{color:var(--ink);border-bottom-color:var(--red)}
.nn{font-size:9px;border-radius:4px;padding:1px 5px;min-width:16px;text-align:center;font-weight:600;background:var(--dark);color:#fff}
.nn.warn{background:var(--red)}

/* STATS STRIP */
.strip{background:var(--s1);border-bottom:1px solid var(--b)}
.strip-inner{max-width:1200px;margin:0 auto;display:grid;grid-template-columns:repeat(5,1fr)}
.scell{padding:14px 20px;border-right:1px solid var(--b);display:flex;align-items:center;gap:12px}
.scell:last-child{border-right:none}
.sval{font-family:var(--sans);font-size:22px;font-weight:800;letter-spacing:-.5px;line-height:1;color:var(--ink4)}
.sval.on{color:var(--ink)}
.sval.live{background:var(--grad);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
.slbl{font-family:var(--mono);font-size:9px;color:var(--ink3);text-transform:uppercase;letter-spacing:.8px;margin-top:3px}
.sico{font-size:18px;opacity:.12}

/* PAGE */
.page{flex:1;padding:32px;max-width:1200px;margin:0 auto;width:100%}
.ph{margin-bottom:28px}
.ph-t{font-family:var(--sans);font-size:20px;font-weight:700;letter-spacing:-.3px}
.ph-s{font-size:12px;color:var(--ink3);margin-top:4px}

/* CARDS */
.card{background:var(--s1);border:1px solid var(--b);border-radius:var(--r2);padding:24px;margin-bottom:16px;box-shadow:var(--sh)}
.card-hd{display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;gap:12px;flex-wrap:wrap}
.ct{font-family:var(--mono);font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:1.5px;color:var(--ink3);display:flex;align-items:center;gap:8px}
.ct::before{content:'';width:3px;height:12px;background:var(--grad);border-radius:2px;display:block;flex-shrink:0}

/* HEALTH GRID */
.hgrid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:28px}
.hcard{border-radius:var(--r2);padding:20px;background:var(--s1);border:1.5px solid var(--b);box-shadow:var(--sh);position:relative;overflow:hidden;transition:box-shadow .2s}
.hcard:hover{box-shadow:var(--sh2)}
.hbar{position:absolute;top:0;left:0;right:0;height:3px;background:var(--b)}
.hbar.ok{background:var(--grad)}
.hbar.err{background:var(--red)}
.hbar.spin{background:linear-gradient(90deg,var(--b) 0%,var(--yellow) 50%,var(--b) 100%);background-size:200%;animation:bspin 1.4s infinite}
@keyframes bspin{0%{background-position:200% 0}100%{background-position:-200% 0}}
.hcard-top{display:flex;align-items:center;justify-content:space-between;margin-bottom:14px}
.hico{width:34px;height:34px;border-radius:8px;background:var(--s3);display:flex;align-items:center;justify-content:center;font-size:15px;flex-shrink:0}
.hbadge{font-family:var(--mono);font-size:9px;font-weight:600;text-transform:uppercase;letter-spacing:.8px;padding:3px 8px;border-radius:4px}
.hbadge.ok{background:#16a34a12;color:var(--green)}
.hbadge.err{background:#E8414212;color:var(--red)}
.hbadge.spin{background:#d9770612;color:var(--yellow)}
.hbadge.unknown{background:var(--s3);color:var(--ink3)}
.hname{font-family:var(--sans);font-size:14px;font-weight:700;margin-bottom:4px}
.hdetail{font-size:11px;color:var(--ink3);line-height:1.5}
.htags{display:flex;flex-wrap:wrap;gap:6px;margin-top:12px;padding-top:12px;border-top:1px solid var(--b)}
.htag{font-family:var(--mono);font-size:9px;padding:2px 7px;border-radius:4px;background:var(--s3);color:var(--ink3)}
.htag.g{background:#16a34a10;color:var(--green)}
.htag.r{background:#E8414210;color:var(--red)}
.htag.y{background:#d9770610;color:var(--yellow)}

/* PIPELINE */
.pipe-wrap{display:grid;grid-template-columns:repeat(4,1fr);background:var(--s1);border:1px solid var(--b);border-radius:var(--r2);overflow:hidden;margin-bottom:28px;box-shadow:var(--sh)}
.pipe{padding:22px 24px;position:relative;border-right:1px solid var(--b);transition:background .15s;cursor:default}
.pipe:last-child{border-right:none}
.pipe:hover{background:var(--s2)}
.pipe-n{font-family:var(--mono);font-size:9px;color:var(--ink4);letter-spacing:.5px;margin-bottom:6px;text-transform:uppercase}
.pipe-lbl{font-family:var(--sans);font-size:12px;font-weight:600;color:var(--ink2);margin-bottom:10px}
.pipe-val{font-family:var(--sans);font-size:36px;font-weight:800;letter-spacing:-1.5px;line-height:1;color:var(--ink4)}
.pipe-val.on{color:var(--ink)}
.pipe-val.done{background:var(--grad);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
.pipe-sub{font-size:11px;color:var(--ink3);margin-top:6px}
.pipe-cta{display:inline-flex;align-items:center;gap:4px;margin-top:14px;font-family:var(--mono);font-size:10px;color:var(--red2);cursor:pointer;background:none;border:none;padding:0;letter-spacing:.3px}
.pipe-cta:hover{text-decoration:underline}
.pipe-bar{position:absolute;bottom:0;left:0;height:2px;background:var(--grad);transition:width .6s ease}
.pipe-check{position:absolute;top:20px;right:20px;width:20px;height:20px;border-radius:50%;background:var(--grad);display:flex;align-items:center;justify-content:center;font-size:9px;color:#fff;opacity:0;transition:opacity .3s}
.pipe-check.on{opacity:1}

/* ACTIONS */
.agrid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:28px}
.abtn{background:var(--s1);border:1.5px solid var(--b);border-radius:var(--r2);padding:16px 20px;cursor:pointer;transition:all .15s;box-shadow:var(--sh);display:flex;align-items:center;gap:14px;text-align:left}
.abtn:hover:not(:disabled){border-color:var(--red3);box-shadow:var(--sh2);transform:translateY(-1px)}
.abtn:disabled{opacity:.4;cursor:not-allowed}
.abtn.prime{background:var(--dark);border-color:var(--dark)}
.abtn.prime:hover:not(:disabled){background:var(--dark2);box-shadow:0 6px 20px rgba(15,17,21,.3)}
.aico{width:38px;height:38px;border-radius:8px;background:var(--s3);display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0}
.abtn.prime .aico{background:rgba(255,255,255,.1)}
.albl{font-family:var(--sans);font-size:13px;font-weight:700;margin-bottom:2px}
.abtn.prime .albl{color:#fff}
.asub{font-size:11px;color:var(--ink3)}
.abtn.prime .asub{color:rgba(255,255,255,.45)}

/* ENV */
.erow{display:flex;align-items:center;gap:10px;padding:7px 10px;border-radius:6px;font-size:12px;transition:background .1s}
.erow:hover{background:var(--s2)}
.eok{color:var(--green);width:18px;text-align:center;flex-shrink:0;font-size:12px}
.emiss{color:var(--ink4);width:18px;text-align:center;flex-shrink:0;font-size:12px}
.ehint{font-size:11px;color:var(--ink3);flex:1}

/* LOG */
.logbox{background:var(--dark);border-radius:var(--r);padding:16px;overflow-y:auto}
.ll{display:flex;gap:12px;padding:1px 0}
.lt{font-family:var(--mono);color:#4a5568;min-width:68px;flex-shrink:0;font-size:10px;padding-top:1px}
.lm{font-family:var(--mono);line-height:1.5;font-size:11px}
.li{color:#94a3b8}.lo{color:#86efac}.lw{color:#fcd34d}.le{color:#fca5a5}
.lempty{font-family:var(--mono);font-size:11px;color:#4a5568;text-align:center;padding:24px 0}

/* FORM */
.field{margin-bottom:16px}
.field label{display:block;font-family:var(--mono);font-size:10px;color:var(--ink3);text-transform:uppercase;letter-spacing:1px;margin-bottom:6px;font-weight:600}
.field input,.field select{width:100%;background:var(--bg);border:1.5px solid var(--b2);border-radius:var(--r);padding:9px 12px;color:var(--ink);font-family:var(--mono);font-size:12px;outline:none;transition:border-color .15s,box-shadow .15s}
.field input:focus,.field select:focus{border-color:var(--red2);box-shadow:0 0 0 3px #E8414210}
.field input::placeholder{color:var(--ink4)}
.g2{display:grid;grid-template-columns:1fr 1fr;gap:14px}
.s2{grid-column:1/-1}

/* BUTTONS */
.btn{display:inline-flex;align-items:center;gap:7px;padding:9px 20px;border-radius:999px;font-family:var(--mono);font-size:11px;font-weight:500;cursor:pointer;border:none;transition:all .15s;letter-spacing:.3px;white-space:nowrap}
.btn:disabled{opacity:.4;cursor:not-allowed;pointer-events:none}
.btn-dark{background:var(--dark);color:#fff}
.btn-dark:hover{background:var(--dark2);transform:translateY(-1px);box-shadow:0 4px 14px rgba(15,17,21,.25)}
.btn-red{background:var(--grad);color:#fff}
.btn-red:hover{opacity:.9;transform:translateY(-1px);box-shadow:0 4px 14px rgba(232,65,66,.3)}
.btn-ghost{background:transparent;border:1.5px solid var(--b2);color:var(--ink2)}
.btn-ghost:hover{border-color:var(--ink3);color:var(--ink)}
.btn-sm{padding:5px 14px;font-size:10px}
.btn-xs{padding:3px 10px;font-size:9px}
.btn-row{display:flex;gap:10px;align-items:center;flex-wrap:wrap}

/* ALERTS */
.alert{padding:12px 16px;border-radius:var(--r);font-size:12px;margin-bottom:16px;line-height:1.6;border:1px solid;display:flex;gap:10px;align-items:flex-start}
.alert-icon{flex-shrink:0}
.alert-body{flex:1}
.alert-title{font-weight:600;margin-bottom:2px;font-family:var(--sans);font-size:12px}
.ai{background:#E8414206;border-color:#E8414225;color:#7f1d1e}
.ao{background:#16a34a06;border-color:#16a34a25;color:#14532d}
.aw{background:#d9770606;border-color:#d9770625;color:#78350f}
.ae{background:#E8414210;border-color:#E8414235;color:#7f1d1e}

/* PROVIDER */
.pt{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:18px}
.po{padding:16px;border-radius:var(--r);cursor:pointer;border:1.5px solid var(--b2);background:var(--s2);transition:all .15s}
.po:hover{border-color:var(--ink3)}
.po.a{border-color:var(--red2);background:#E8414204}
.pon{font-family:var(--sans);font-weight:700;font-size:13px;margin-bottom:3px}
.po.a .pon{color:var(--red2)}
.pos{font-size:11px;color:var(--ink3)}

/* SCRAPE GRID */
.sg{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:9px;margin:16px 0}
.scard{padding:14px;border-radius:var(--r);background:var(--s1);border:1.5px solid var(--b);cursor:pointer;transition:all .2s;box-shadow:var(--sh)}
.scard:hover{border-color:var(--ink3);box-shadow:var(--sh2)}
.scard.done{border-color:var(--green);background:#16a34a04}
.scard.running{border-color:var(--yellow);animation:scpulse .9s infinite}
.scard.fail{border-color:var(--red);background:#E8414204}
@keyframes scpulse{0%,100%{border-color:var(--yellow)}50%{border-color:#d9770650}}
.sn{font-family:var(--sans);font-weight:700;font-size:13px;margin-bottom:2px}
.stype{font-family:var(--mono);font-size:9px;color:var(--ink3);text-transform:uppercase;letter-spacing:.5px}
.sstar{font-family:var(--mono);font-size:11px;color:var(--yellow);margin-top:6px}
.srepo{font-size:10px;color:var(--ink3);margin-top:2px;font-family:var(--mono);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.sst{font-family:var(--mono);font-size:10px;margin-top:6px}

/* TABLE */
.tw{overflow-x:auto;border-radius:var(--r);border:1px solid var(--b);background:var(--s1);box-shadow:var(--sh)}
table{width:100%;border-collapse:collapse;font-size:12px}
thead th{padding:10px 14px;text-align:left;font-family:var(--mono);font-size:9px;text-transform:uppercase;letter-spacing:.8px;color:var(--ink3);background:var(--s2);border-bottom:1px solid var(--b);white-space:nowrap;font-weight:600}
tbody td{padding:12px 14px;border-bottom:1px solid var(--b);vertical-align:middle;max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
tbody tr:last-child td{border-bottom:none}
tbody tr:hover td{background:var(--s2)}
tbody tr.sel td{background:#E8414206}
.ck{width:14px;height:14px;accent-color:var(--red2);cursor:pointer}

/* PILLS */
.pill{display:inline-flex;align-items:center;padding:2px 9px;border-radius:999px;font-family:var(--mono);font-size:9px;font-weight:500;text-transform:uppercase;letter-spacing:.3px;white-space:nowrap;border:1px solid}
.pn{background:var(--s3);color:var(--ink3);border-color:var(--b2)}
.ps{background:#d9770610;color:#92400e;border-color:#d9770630}
.pr{background:#16a34a10;color:#166534;border-color:#16a34a30}
.pb2{background:#E8414210;color:#7f1d1e;border-color:#E8414230}

/* PROGRESS */
.pgwrap{margin:12px 0}
.pglbl{display:flex;justify-content:space-between;font-family:var(--mono);font-size:10px;color:var(--ink3);margin-bottom:6px}
.pgbar{height:3px;background:var(--b);border-radius:2px;overflow:hidden}
.pgfill{height:100%;background:var(--grad);transition:width .4s ease;border-radius:2px}

/* EMAIL */
.ep{background:var(--bg);border:1.5px solid var(--b);border-radius:var(--r);padding:20px;font-size:13px;line-height:1.75;white-space:pre-wrap;max-height:280px;overflow-y:auto;font-family:var(--body)}
.em{font-family:var(--mono);font-size:11px;color:var(--ink3);margin-bottom:14px;padding-bottom:14px;border-bottom:1px solid var(--b);display:flex;flex-direction:column;gap:4px}
.em span{color:var(--ink);font-weight:500}

/* CHECKLIST */
.cklist{display:flex;flex-direction:column;gap:2px}
.crow{display:flex;align-items:center;gap:10px;font-size:12px;padding:6px 10px;border-radius:6px;transition:background .1s}
.crow:hover{background:var(--s2)}
.ci{font-size:12px;width:18px;text-align:center;flex-shrink:0}

/* EMPTY */
.empty{padding:56px 24px;text-align:center}
.empty-ico{font-size:36px;margin-bottom:14px;opacity:.35}
.empty-t{font-family:var(--sans);font-size:16px;font-weight:700;color:var(--ink2);margin-bottom:6px}
.empty-s{font-size:12px;color:var(--ink3);margin-bottom:20px;max-width:300px;margin-left:auto;margin-right:auto;line-height:1.6}

/* TOASTS */
.toasts{position:fixed;bottom:24px;right:24px;z-index:9999;display:flex;flex-direction:column;gap:8px;pointer-events:none;align-items:flex-end}
.toast{display:flex;align-items:center;gap:10px;padding:11px 16px;border-radius:var(--r);background:var(--dark);color:#fff;font-family:var(--mono);font-size:11px;box-shadow:0 8px 28px rgba(0,0,0,.2);animation:tin .2s ease;pointer-events:all;max-width:340px}
@keyframes tin{from{transform:translateY(6px);opacity:0}to{transform:translateY(0);opacity:1}}
.tdot{width:6px;height:6px;border-radius:50%;flex-shrink:0}
.to{background:#86efac}.tw2{background:#fcd34d}.te{background:#fca5a5}

/* MISC */
hr{border:none;border-top:1px solid var(--b);margin:20px 0}
.stitle{font-family:var(--mono);font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:1.5px;color:var(--ink3);margin-bottom:12px}
.muted{color:var(--ink3)}
code{background:var(--dark);color:#e2e8f0;padding:2px 7px;border-radius:4px;font-size:11px;font-family:var(--mono)}
.flex{display:flex}.gap8{gap:8px}.gap12{gap:12px}
.ic{align-items:center}.wrap{flex-wrap:wrap}
.mb8{margin-bottom:8px}.mb16{margin-bottom:16px}.mb24{margin-bottom:24px}
::-webkit-scrollbar{width:5px;height:5px}
::-webkit-scrollbar-track{background:transparent}
::-webkit-scrollbar-thumb{background:var(--b2);border-radius:3px}
`

let _tid=0
function useToast(){
  const [ts,setTs]=useState<{id:number;msg:string;type:'o'|'w'|'e'}[]>([])
  const toast=useCallback((msg:string,type:'o'|'w'|'e'='o')=>{
    const id=_tid++
    setTs(p=>[...p,{id,msg,type}])
    setTimeout(()=>setTs(p=>p.filter(t=>t.id!==id)),3500)
  },[])
  return{ts,toast}
}

export default function App(){
  const[tab,setTab]=useState('mission')
  const[leads,setLeads]=useState<Lead[]>([])
  const[health,setHealth]=useState<any>(null)
  const[hl,setHL]=useState(false)
  const[scrSt,setScrSt]=useState<Record<string,'idle'|'running'|'done'|'fail'>>({})
  const[scraped,setScraped]=useState<Record<string,any>>({})
  const[sel,setSel]=useState<Set<string>>(new Set())
  const[genning,setGenning]=useState(false)
  const[genPct,setGenPct]=useState(0)
  const[sending,setSending]=useState(false)
  const[sendPct,setSendPct]=useState(0)
  const[preview,setPreview]=useState<Lead|null>(null)
  const[provider,setProvider]=useState<'privateemail'|'gmail'>('privateemail')
  const[log,setLog]=useState<Log[]>([])
  const logRef=useRef<HTMLDivElement>(null)
  const{ts,toast}=useToast()

  const addLog=useCallback((msg:string,type:Log['type']='i')=>{
    const t=new Date().toLocaleTimeString('en-US',{hour12:false})
    setLog(p=>[...p.slice(-300),{t,msg,type}])
    setTimeout(()=>logRef.current&&(logRef.current.scrollTop=logRef.current.scrollHeight),40)
  },[])

  useEffect(()=>{checkHealth()},[])
  useEffect(()=>{if(health?.airtable?.ok)loadLeads(true)},[health?.airtable?.ok])

  const checkHealth=async()=>{
    setHL(true)
    try{
      const r=await fetch('/api/health').then(r=>r.json())
      setHealth(r)
      if(r.airtable?.ok)addLog(`✓ Airtable — ${r.airtable.leadsCount} leads`,'o')
      else addLog(`✗ Airtable: ${r.airtable?.error||'not configured'}`,'e')
      if(r.github?.ok)addLog(`✓ GitHub — ${r.github.remaining}/${r.github.limit} req/hr`,'o')
      if(r.smtp?.ok)addLog(`✓ PrivateEmail — ${r.smtp.email}`,'o')
      else if(r.env?.smtpEmail)addLog('✗ SMTP auth failed','e')
      if(r.anthropic?.ok)addLog('✓ Anthropic API ready','o')
    }catch(e:any){addLog(`✗ Health: ${e.message}`,'e')}
    setHL(false)
  }

  const loadLeads=async(silent=false)=>{
    if(!silent)addLog('Loading leads...','i')
    try{
      const r=await fetch('/api/airtable').then(r=>r.json())
      if(!r.ok){addLog(`✗ ${r.error}`,'e');return}
      const mapped=r.records.map(mapRecord)
      setLeads(mapped)
      if(!silent){addLog(`✓ ${mapped.length} leads`,'o');toast(`${mapped.length} leads loaded`)}
    }catch(e:any){addLog(`✗ ${e.message}`,'e')}
  }

  const scrapeOne=async(tgt:typeof TARGETS[0])=>{
    setScrSt(p=>({...p,[tgt.org]:'running'}))
    try{
      const r=await fetch(`/api/scrape?org=${tgt.org}`).then(r=>r.json())
      if(!r.ok)throw new Error(r.error)
      setScraped(p=>({...p,[tgt.org]:r.data}))
      setScrSt(p=>({...p,[tgt.org]:'done'}))
      addLog(`  ✓ ${tgt.name} ⭐${r.data.githubStars?.toLocaleString()}`,'o')
    }catch(e:any){
      setScrSt(p=>({...p,[tgt.org]:'fail'}))
      addLog(`  ✗ ${tgt.name}: ${e.message}`,'e')
    }
  }

  const scrapeAll=async()=>{
    addLog('=== Scraping GitHub orgs ===','i')
    const rl=await fetch('/api/scrape?org=ratelimit').then(r=>r.json()).catch(()=>null)
    if(rl?.ok)addLog(`GitHub: ${rl.remaining}/${rl.limit} req remaining`,rl.remaining<40?'w':'i')
    for(const tgt of TARGETS){
      if(scrSt[tgt.org]==='done')continue
      await scrapeOne(tgt)
      await new Promise(r=>setTimeout(r,250))
    }
    addLog('=== Scrape complete ===','o')
    toast(`${Object.values(scrSt).filter(s=>s==='done').length} orgs scraped`)
  }

  const saveToAirtable=async()=>{
    const toSave=Object.values(scraped)
    if(!toSave.length){toast('Nothing scraped yet','w');return}
    addLog(`Saving ${toSave.length} leads with contact enrichment...`,'i')
    let ok=0
    for(const d of toSave){
      try{
        const fields: Record<string,any> = {
          [F.COMPANY]:d.company,
          [F.WEBSITE]:d.website||'',
          [F.GH_URL]:d.githubOrgUrl,
          [F.STARS]:d.githubStars,
          [F.TYPE]:d.companyType,
          [F.AI_TOOLS]:d.aiTools,
          [F.STATUS]:'New',
          [F.SOURCE]:'GitHub Scrape',
          [F.ADDED]:new Date().toISOString().split('T')[0],
          [F.NOTES]:d.description||'',
        }
        // Include enriched contact if found
        if(d.contactName) fields[F.CONTACT] = d.contactName
        if(d.contactEmail) fields[F.EMAIL] = d.contactEmail
        if(d.contactTitle) fields[F.TITLE] = d.contactTitle + (d.contactConfidence==='inferred'?' (inferred)':' (verified)')

        const r=await fetch('/api/airtable',{method:'POST',headers:{'Content-Type':'application/json'},
          body:JSON.stringify({action:'create',fields})}).then(r=>r.json())
        if(r.ok){
          ok++
          const emailNote = d.contactEmail
            ? ` · ${d.contactConfidence==='verified'?'✓':'~'} ${d.contactEmail}`
            : ' · no email found'
          addLog(`  ✓ ${d.company}${emailNote}`,'o')
        }
        else addLog(`  ✗ ${d.company}: ${r.error}`,'e')
      }catch(e:any){addLog(`  ✗ ${e.message}`,'e')}
      await new Promise(r=>setTimeout(r,200))
    }
    const withEmail = Object.values(scraped).filter((d:any)=>d.contactEmail).length
    addLog(`Saved ${ok}/${toSave.length} — ${withEmail} with emails (${Object.values(scraped).filter((d:any)=>d.contactConfidence==='verified').length} verified, ${Object.values(scraped).filter((d:any)=>d.contactConfidence==='inferred').length} inferred)`,ok===toSave.length?'o':'w')
    toast(`${ok} leads saved · ${withEmail} emails found`,ok>0?'o':'e')
    await loadLeads(true)
  }

  const genEmails=async()=>{
    const targets=leads.filter(l=>!l.emailBody&&(sel.size===0||sel.has(l.id)))
    if(!targets.length){toast('No leads need emails','w');return}
    setGenning(true);setGenPct(0)
    addLog(`=== Generating ${targets.length} emails ===`,'i')
    for(let i=0;i<targets.length;i++){
      const lead=targets[i]
      addLog(`Writing for ${lead.company}...`,'i')
      try{
        const r=await fetch('/api/generate',{method:'POST',headers:{'Content-Type':'application/json'},
          body:JSON.stringify({lead,senderName:'The Lobstack Team'})}).then(r=>r.json())
        if(!r.ok)throw new Error(r.error)
        await fetch('/api/airtable',{method:'POST',headers:{'Content-Type':'application/json'},
          body:JSON.stringify({action:'update',recordId:lead.id,fields:{[F.SUBJ]:r.subject,[F.BODY]:r.body}})})
        setLeads(p=>p.map(l=>l.id===lead.id?{...l,emailSubject:r.subject,emailBody:r.body}:l))
        addLog(`  ✓ "${r.subject}"`,'o')
      }catch(e:any){addLog(`  ✗ ${lead.company}: ${e.message}`,'e')}
      setGenPct(Math.round(((i+1)/targets.length)*100))
      await new Promise(r=>setTimeout(r,600))
    }
    setGenning(false)
    addLog('=== Generation complete ===','o')
    toast('Emails generated and saved','o')
  }

  const runCampaign=async()=>{
    const ready=leads.filter(l=>l.emailBody&&l.emailSubject&&l.contactEmail&&l.status==='New'&&(sel.size===0||sel.has(l.id)))
    if(!ready.length){toast('No ready leads — add contact emails in Airtable first','w');return}
    setSending(true);setSendPct(0)
    addLog(`=== Campaign: ${ready.length} leads via ${provider} ===`,'i')
    for(let i=0;i<ready.length;i++){
      const lead=ready[i]
      addLog(`→ ${lead.company} (${lead.contactEmail})`,'i')
      try{
        let msgId=`sent-${Date.now()}`
        if(provider==='privateemail'){
          const r=await fetch('/api/send',{method:'POST',headers:{'Content-Type':'application/json'},
            body:JSON.stringify({to:lead.contactEmail,subject:lead.emailSubject,body:lead.emailBody})
          }).then(r=>r.json())
          if(!r.ok)throw new Error(r.error)
          msgId=r.messageId
        }
        await fetch('/api/airtable',{method:'POST',headers:{'Content-Type':'application/json'},
          body:JSON.stringify({action:'update',recordId:lead.id,fields:{[F.STATUS]:'Email Sent',[F.CONTACTED]:new Date().toISOString().split('T')[0],[F.FOLLOWUP]:1}})})
        await fetch('/api/airtable',{method:'POST',headers:{'Content-Type':'application/json'},
          body:JSON.stringify({action:'log',fields:{[LF.CAMPID]:`CAM-${Date.now()}`,[LF.COMPANY]:lead.company,[LF.EMAIL]:lead.contactEmail,[LF.SUBJECT]:lead.emailSubject,[LF.STEP]:'Cold Email #1',[LF.SENTAT]:new Date().toISOString(),[LF.MSGID]:msgId,[LF.RESULT]:'Sent'}})})
        setLeads(p=>p.map(l=>l.id===lead.id?{...l,status:'Email Sent'}:l))
        addLog(`  ✓ Sent to ${lead.company}`,'o')
      }catch(e:any){addLog(`  ✗ ${lead.company}: ${e.message}`,'e')}
      setSendPct(Math.round(((i+1)/ready.length)*100))
      if(i<ready.length-1){addLog('  ⏳ 45s cooldown...','w');await new Promise(r=>setTimeout(r,45000))}
    }
    setSending(false)
    toast(`Campaign complete — ${ready.length} emails sent`)
    addLog('=== Campaign complete ===','o')
  }

  const stats={
    total:leads.length,
    hasEmail:leads.filter(l=>l.emailBody).length,
    hasContact:leads.filter(l=>l.contactEmail).length,
    sent:leads.filter(l=>l.status==='Email Sent').length,
    replied:leads.filter(l=>l.status==='Replied').length,
    booked:leads.filter(l=>l.status==='Booked Call').length,
  }
  const scCnt=Object.values(scrSt).filter(s=>s==='done').length
  const readyCnt=leads.filter(l=>l.emailBody&&l.emailSubject&&l.contactEmail&&l.status==='New').length

  const hSt=(h:any)=>!h?'unknown':h.ok?'ok':'err'
  const hLbl=(h:any)=>!h?'Not checked':h.ok?'Connected':'Error'

  const Logbox=({maxH='180px'}:{maxH?:string})=>(
    <div className="logbox" ref={logRef} style={{maxHeight:maxH}}>
      {log.length===0
        ?<div className="lempty">Log appears here</div>
        :log.map((l,i)=>(
          <div key={i} className="ll">
            <span className="lt">{l.t}</span>
            <span className={`lm l${l.type}`}>{l.msg}</span>
          </div>
        ))
      }
    </div>
  )

  const dotCls=(ok:boolean|undefined,loading:boolean)=>loading?'spin':ok?'ok':ok===false?'err':''

  return(
    <>
      <style dangerouslySetInnerHTML={{__html:CSS}}/>
      <div className="toasts">
        {ts.map(t=>(
          <div key={t.id} className="toast">
            <div className={`tdot t${t.type}`}/>
            {t.msg}
          </div>
        ))}
      </div>
      <div className="shell">

        {/* TOPBAR */}
        <div className="topbar">
          <div className="brand">
            <div className="brand-name">Lobstack</div>
            <div className="brand-tag">Outreach</div>
          </div>
          <div className="topbar-r">
            <div className="flex gap8 ic">
              <div className={`chip ${hl?'':health?.airtable?.ok?'ok':health?.airtable?.ok===false?'err':''}`}>
                <div className={`dot ${dotCls(health?.airtable?.ok,hl)}`}/>
                Airtable
                {health?.airtable?.ok&&<strong>{health.airtable.leadsCount} leads</strong>}
              </div>
              <div className={`chip ${hl?'':health?.smtp?.ok?'ok':health?.smtp?.ok===false&&health?.env?.smtpEmail?'err':''}`}>
                <div className={`dot ${dotCls(health?.smtp?.ok,hl)}`}/>
                PrivateEmail
              </div>
              <div className={`chip ${health?.github?.ok?'ok':''}`}>
                <div className={`dot ${health?.github?.ok?'ok':''}`}/>
                GitHub
                {health?.github?.remaining!=null&&<strong>{health.github.remaining}/hr</strong>}
              </div>
            </div>
            <button className="btn btn-ghost btn-xs" onClick={checkHealth} disabled={hl}>{hl?'…':'↻ Refresh'}</button>
          </div>
        </div>

        {/* NAV */}
        <div className="nav">
          {[
            {id:'mission',label:'Mission Control'},
            {id:'scrape',label:'Scrape',num:scCnt||null},
            {id:'crm',label:'CRM',num:stats.total||null},
            {id:'generate',label:'Generate',num:stats.hasEmail||null},
            {id:'send',label:'Send',num:readyCnt||null,warn:readyCnt===0&&stats.hasEmail>0&&stats.hasContact>0},
          ].map(({id,label,num,warn})=>(
            <button key={id} className={`nb ${tab===id?'active':''}`} onClick={()=>setTab(id)}>
              {label}
              {num!=null&&<span className={`nn ${warn?'warn':''}`}>{num}</span>}
            </button>
          ))}
        </div>

        {/* STATS STRIP */}
        <div className="strip">
          <div className="strip-inner">
            {[
              {lbl:'Total Leads',val:stats.total,ico:'◈'},
              {lbl:'Emails Written',val:stats.hasEmail,ico:'✦'},
              {lbl:'Contacts Added',val:stats.hasContact,ico:'@'},
              {lbl:'Emails Sent',val:stats.sent,ico:'▶',live:stats.sent>0},
              {lbl:'Replies',val:stats.replied,ico:'↩',live:stats.replied>0},
            ].map(({lbl,val,ico,live},i)=>(
              <div key={lbl} className="scell" style={i===4?{borderRight:'none'}:{}}>
                <div className="sico">{ico}</div>
                <div>
                  <div className={`sval ${val>0&&!live?'on':''}${live?'live':''}`}>{val}</div>
                  <div className="slbl">{lbl}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="page">

          {/* ══ MISSION CONTROL ══ */}
          {tab==='mission'&&<>
            <div className="ph">
              <div className="ph-t">Mission Control</div>
              <div className="ph-s">Live system health, campaign pipeline, and quick actions</div>
            </div>

            <div className="stitle">System Health</div>
            <div className="hgrid">
              {[
                {key:'airtable',ico:'🗄',name:'Airtable CRM',
                  detail:health?.airtable?.ok?`${health.airtable.leadsCount} leads · ${health.airtable.logsCount} sends logged`:health?.airtable?.error||'Not connected',
                  tags:health?.airtable?.ok?[{l:'Lobstack CRM',c:'g'},{l:'Read + Write',c:'g'},{l:`${health?.airtable?.leadsCount||0} records`,c:''}]:[{l:'Check AIRTABLE_API_KEY in Vercel',c:'r'}],
                  h:health?.airtable},
                {key:'smtp',ico:'✉',name:'PrivateEmail SMTP',
                  detail:health?.smtp?.ok?`Authenticated · ${health.smtp.email}`:health?.env?.smtpEmail?`Auth failed — ${health.smtp?.error?.slice(0,55)||'check password'}`:'SMTP_EMAIL and SMTP_PASSWORD not configured',
                  tags:health?.smtp?.ok?[{l:'mail.privateemail.com',c:'g'},{l:'Port 587 STARTTLS',c:'g'},{l:health.smtp.email,c:''}]:[{l:'Set SMTP_EMAIL + SMTP_PASSWORD in Vercel',c:'r'}],
                  h:health?.smtp},
                {key:'github',ico:'⑂',name:'GitHub API',
                  detail:health?.github?.ok?`${health.github.remaining} of ${health.github.limit} requests/hr remaining`:'Cannot reach GitHub API',
                  tags:health?.github?[{l:health.github.authenticated?'Token ✓':'No token — 60 req/hr',c:health.github.authenticated?'g':'y'},{l:`${health.github.limit}/hr`,c:health.github.limit===5000?'g':'y'}]:[{l:'Checking...',c:''}],
                  h:health?.github},
                {key:'anthropic',ico:'◆',name:'Anthropic API',
                  detail:health?.env?.anthropic?'API key set — claude-sonnet-4 ready':'ANTHROPIC_API_KEY not set — email generation disabled',
                  tags:health?.env?.anthropic?[{l:'claude-sonnet-4',c:'g'},{l:'Email generation',c:'g'}]:[{l:'Add ANTHROPIC_API_KEY in Vercel',c:'r'}],
                  h:health?.anthropic},
              ].map(({key,ico,name,detail,tags,h})=>{
                const st=hl?'spin':hSt(h)
                return(
                  <div key={key} className="hcard">
                    <div className={`hbar ${st}`}/>
                    <div className="hcard-top">
                      <div className="hico">{ico}</div>
                      <span className={`hbadge ${st}`}>{hl?'Checking':hLbl(h)}</span>
                    </div>
                    <div className="hname">{name}</div>
                    <div className="hdetail">{detail}</div>
                    {tags.length>0&&<div className="htags">{tags.map((t,i)=><span key={i} className={`htag ${t.c}`}>{t.l}</span>)}</div>}
                  </div>
                )
              })}
            </div>

            <div className="stitle">Campaign Pipeline</div>
            <div className="pipe-wrap">
              {[
                {n:'01',lbl:'Leads Scraped',val:stats.total>0?stats.total:scCnt,tot:TARGETS.length,sub:`of ${TARGETS.length} orgs`,cta:'Go scrape →',t:'scrape'},
                {n:'02',lbl:'Emails Written',val:stats.hasEmail,tot:Math.max(stats.total,1),sub:`${Math.max(stats.total-stats.hasEmail,0)} remaining`,cta:'Generate →',t:'generate'},
                {n:'03',lbl:'Contacts Added',val:stats.hasContact,tot:Math.max(stats.total,1),sub:'in Airtable',cta:'Open Airtable →',t:'crm'},
                {n:'04',lbl:'Emails Sent',val:stats.sent,tot:Math.max(stats.total,1),sub:`${stats.replied} replied · ${stats.booked} booked`,cta:'Launch →',t:'send'},
              ].map(({n,lbl,val,tot,sub,cta,t})=>{
                const pct=tot>0?Math.min(Math.round((val/tot)*100),100):0
                const done=pct===100&&val>0
                return(
                  <div key={n} className="pipe">
                    <div className="pipe-n">Step {n}</div>
                    <div className="pipe-lbl">{lbl}</div>
                    <div className={`pipe-val ${done?'done':val>0?'on':''}`}>{val}</div>
                    <div className="pipe-sub">{sub}</div>
                    <button className="pipe-cta" onClick={()=>t==='crm'?window.open('https://airtable.com/appnF2fNAyEYnscvo','_blank'):setTab(t)}>{cta}</button>
                    <div className="pipe-bar" style={{width:`${pct}%`}}/>
                    {done&&<div className="pipe-check on">✓</div>}
                  </div>
                )
              })}
            </div>

            <div className="stitle">Quick Actions</div>
            <div className="agrid mb24">
              {[
                {ico:'↻',lbl:'Refresh Systems',sub:'Re-ping all integrations and reload leads',act:checkHealth,dis:hl,prime:false},
                {ico:'⭐',lbl:'Scrape GitHub',sub:`Pull data from ${TARGETS.length} AI-forward companies`,act:()=>setTab('scrape'),dis:false,prime:false},
                {ico:'✦',lbl:'Generate Emails',sub:`${leads.filter(l=>!l.emailBody).length} leads still need emails written`,act:()=>setTab('generate'),dis:!health?.env?.anthropic,prime:false},
                {ico:'◈',lbl:'View CRM',sub:`${stats.total} leads · ${stats.hasContact} contacts filled`,act:()=>setTab('crm'),dis:false,prime:false},
                {ico:'▶',lbl:'Send Campaign',sub:readyCnt>0?`${readyCnt} leads ready — all systems go`:`Add contact emails to unlock`,act:()=>setTab('send'),dis:readyCnt===0,prime:readyCnt>0},
                {ico:'↗',lbl:'Open Airtable',sub:'Add contact emails, update lead status',act:()=>window.open('https://airtable.com/appnF2fNAyEYnscvo','_blank'),dis:false,prime:false},
              ].map(({ico,lbl,sub,act,dis,prime})=>(
                <button key={lbl} className={`abtn ${prime?'prime':''}`} onClick={act as any} disabled={dis}>
                  <div className="aico">{ico}</div>
                  <div>
                    <div className="albl">{lbl}</div>
                    <div className="asub">{sub}</div>
                  </div>
                </button>
              ))}
            </div>

            {health&&(
              <div className="card">
                <div className="card-hd">
                  <div className="ct">Environment Variables</div>
                  <a href="https://vercel.com/socialblocklabs/email-outreach/settings/environment-variables" target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-xs">Open Vercel ↗</a>
                </div>
                <div className="cklist">
                  {[
                    {key:'AIRTABLE_API_KEY',ok:!!health.env?.airtable,hint:'airtable.com/create/tokens — data.records:read + data.records:write'},
                    {key:'ANTHROPIC_API_KEY',ok:!!health.env?.anthropic,hint:'console.anthropic.com — required for email generation'},
                    {key:'SMTP_EMAIL',ok:!!health.env?.smtpEmail,hint:health.env?.smtpEmailVal||'hello@lobstack.ai'},
                    {key:'SMTP_PASSWORD',ok:!!health.env?.smtpPass,hint:'Your PrivateEmail account password'},
                    {key:'GITHUB_TOKEN',ok:!!health.env?.githubToken,hint:'Optional — upgrades scraper from 60 to 5,000 req/hr'},
                  ].map(({key,ok,hint})=>(
                    <div key={key} className="erow">
                      <span className={ok?'eok':'emiss'}>{ok?'✓':'○'}</span>
                      <code style={{fontSize:11,background:'transparent',padding:0,color:ok?'var(--ink)':'var(--ink3)'}}>{key}</code>
                      <span className="ehint">{hint}</span>
                      {!ok&&<span style={{fontFamily:'var(--mono)',fontSize:9,color:'var(--red)',background:'#E8414210',padding:'2px 7px',borderRadius:4,flexShrink:0}}>Missing</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="stitle" style={{marginTop:24}}>System Log</div>
            <Logbox maxH="220px"/>
          </>}

          {/* ══ SCRAPE ══ */}
          {tab==='scrape'&&<>
            <div className="ph">
              <div className="ph-t">GitHub Lead Scraper</div>
              <div className="ph-s">Enriching {TARGETS.length} AI-forward orgs — star counts, repo data, AI tool detection</div>
            </div>
            <div className="card">
              <div className="card-hd">
                <div className="ct">Target Orgs</div>
                <div className="btn-row">
                  <button className="btn btn-dark" onClick={scrapeAll} disabled={Object.values(scrSt).some(s=>s==='running')}>Scrape All</button>
                  <button className="btn btn-red" onClick={saveToAirtable} disabled={!scCnt}>↑ Save {scCnt} to CRM</button>
                  <button className="btn btn-ghost btn-sm" onClick={()=>loadLeads()}>↻ Reload</button>
                </div>
              </div>
              {health?.github?.remaining<40&&(
                <div className="alert aw mb16">
                  <span className="alert-icon">⚡</span>
                  <div className="alert-body">
                    <div className="alert-title">Low rate limit — {health.github.remaining} requests left</div>
                    {health.github.authenticated?'Wait for the hourly reset.':'Add GITHUB_TOKEN to Vercel for 5,000 req/hr.'}
                  </div>
                </div>
              )}
              <div className="sg">
                {TARGETS.map(tgt=>{
                  const st=scrSt[tgt.org]||'idle',d=scraped[tgt.org]
                  return(
                    <div key={tgt.org} className={`scard ${st==='done'?'done':st==='running'?'running':st==='fail'?'fail':''}`}
                      onClick={()=>(st==='idle'||st==='fail')&&scrapeOne(tgt)}>
                      <div className="sn">{tgt.name}</div>
                      <div className="stype">{tgt.type}</div>
                      {d?<>
                        <div className="sstar">⭐ {d.githubStars?.toLocaleString()}</div>
                        <div className="srepo">{d.topRepos}</div>
                        {d.contactEmail ? (
                          <div className="sst" style={{color:d.contactConfidence==='verified'?'var(--green)':'var(--yellow)'}}>
                            {d.contactConfidence==='verified'?'✓ ':'\~ '}{d.contactEmail}
                          </div>
                        ) : (
                          <div className="sst" style={{color:'var(--ink4)'}}>no email found</div>
                        )}
                      </>:(
                        <div className="sst" style={{color:st==='running'?'var(--yellow)':st==='fail'?'var(--red)':'var(--ink4)'}}>
                          {st==='running'?'Scraping...':st==='fail'?'Failed — retry':'Click to scrape'}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
            <div className="card">
              <div className="ct" style={{marginBottom:14}}>Scrape Log</div>
              <Logbox/>
            </div>
          </>}

          {/* ══ CRM ══ */}
          {tab==='crm'&&<>
            <div className="ph">
              <div className="ph-t">Lead CRM</div>
              <div className="ph-s">Lobstack CRM · appnF2fNAyEYnscvo · {stats.total} leads · {stats.hasContact} contacts</div>
            </div>
            <div className="card">
              <div className="card-hd">
                <div className="ct">Lobstack Leads</div>
                <div className="btn-row">
                  <button className="btn btn-ghost btn-sm" onClick={()=>loadLeads()}>↻ Refresh</button>
                  {sel.size>0&&<button className="btn btn-ghost btn-sm" onClick={()=>setSel(new Set())}>Clear {sel.size}</button>}
                  <button className="btn btn-ghost btn-sm" onClick={()=>window.open('https://airtable.com/appnF2fNAyEYnscvo','_blank')}>↗ Open Airtable</button>
                </div>
              </div>
              {leads.length===0?(
                <div className="empty">
                  <div className="empty-ico">◈</div>
                  <div className="empty-t">No leads yet</div>
                  <div className="empty-s">Scrape GitHub orgs and save to Airtable.</div>
                  <button className="btn btn-dark" onClick={()=>setTab('scrape')}>Go to Scraper</button>
                </div>
              ):(
                <div className="tw">
                  <table>
                    <thead><tr>
                      <th><input type="checkbox" className="ck" onChange={e=>setSel(e.target.checked?new Set(leads.map(l=>l.id)):new Set())}/></th>
                      <th>Company</th><th>Type</th><th>Contact Email</th><th>Status</th><th>AI Tools</th><th>Email</th><th></th>
                    </tr></thead>
                    <tbody>
                      {leads.map(lead=>(
                        <tr key={lead.id} className={sel.has(lead.id)?'sel':''}>
                          <td><input type="checkbox" className="ck" checked={sel.has(lead.id)} onChange={e=>{const s=new Set(sel);e.target.checked?s.add(lead.id):s.delete(lead.id);setSel(s)}}/></td>
                          <td><strong>{lead.company}</strong></td>
                          <td><span style={{fontFamily:'var(--mono)',fontSize:10,color:'var(--ink3)'}}>{lead.companyType}</span></td>
                          <td>{lead.contactEmail?(
                                <div style={{display:'flex',alignItems:'center',gap:5}}>
                                  <span style={{fontFamily:'var(--mono)',fontSize:11}}>{lead.contactEmail}</span>
                                  {lead.jobTitle?.includes('(verified)')&&<span style={{fontFamily:'var(--mono)',fontSize:9,color:'var(--green)',background:'#16a34a10',padding:'1px 5px',borderRadius:3}}>verified</span>}
                                  {lead.jobTitle?.includes('(inferred)')&&<span style={{fontFamily:'var(--mono)',fontSize:9,color:'var(--yellow)',background:'#d9770610',padding:'1px 5px',borderRadius:3}}>inferred</span>}
                                </div>
                              ):<span style={{color:'var(--ink4)',fontStyle:'italic',fontSize:11}}>Add in Airtable →</span>}</td>
                          <td><span className={`pill ${lead.status==='Email Sent'?'ps':lead.status==='Replied'?'pr':lead.status==='Booked Call'?'pb2':'pn'}`}>{lead.status||'New'}</span></td>
                          <td><span style={{color:'var(--ink3)',fontFamily:'var(--mono)',fontSize:10}}>{lead.aiTools||'—'}</span></td>
                          <td>{lead.emailBody?<span style={{color:'var(--green)',fontFamily:'var(--mono)',fontSize:10}}>✓</span>:<span style={{color:'var(--ink4)',fontSize:10}}>—</span>}</td>
                          <td>{lead.emailBody&&<button className="btn btn-ghost btn-xs" onClick={()=>setPreview(lead)}>Preview</button>}</td>
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
                  <div className="ct">{preview.company} — Preview</div>
                  <button className="btn btn-ghost btn-sm" onClick={()=>setPreview(null)}>✕ Close</button>
                </div>
                <div className="em">
                  <div>To: <span>{preview.contactEmail||'(no contact email)'}</span></div>
                  <div>Subject: <span>{preview.emailSubject}</span></div>
                </div>
                <div className="ep">{preview.emailBody}</div>
              </div>
            )}
            <div className="alert ao">
              <span className="alert-icon">💡</span>
              <div className="alert-body">
                <div className="alert-title">Add contact emails to unlock campaign sending</div>
                Open Airtable → Lobstack Leads → fill the Contact Email column. Target CTOs, VPs Engineering, founders. Use <strong>Hunter.io</strong>, <strong>Apollo.io</strong>, or <strong>LinkedIn Sales Navigator</strong>.
              </div>
            </div>
          </>}

          {/* ══ GENERATE ══ */}
          {tab==='generate'&&<>
            <div className="ph">
              <div className="ph-t">Email Generation</div>
              <div className="ph-s">Claude writes personalised cold emails per lead using GitHub profile and Lobstack value prop — saved directly to Airtable</div>
            </div>
            <div className="card">
              <div className="card-hd">
                <div className="ct">Generate Emails</div>
                <div className="btn-row">
                  <button className="btn btn-dark" onClick={genEmails} disabled={genning||!leads.length||!health?.env?.anthropic}>
                    {genning?'Generating...':'✦ Generate'}
                  </button>
                  <span style={{fontFamily:'var(--mono)',fontSize:10,color:'var(--ink3)'}}>{stats.hasEmail}/{stats.total} done</span>
                </div>
              </div>
              {!health?.env?.anthropic&&(
                <div className="alert ae mb16">
                  <span className="alert-icon">⚠</span>
                  <div className="alert-body">
                    <div className="alert-title">ANTHROPIC_API_KEY not configured</div>
                    Add it in Vercel → Settings → Environment Variables, then redeploy.
                  </div>
                </div>
              )}
              {genning&&(
                <div className="pgwrap">
                  <div className="pglbl"><span>Writing emails...</span><span>{genPct}%</span></div>
                  <div className="pgbar"><div className="pgfill" style={{width:`${genPct}%`}}/></div>
                </div>
              )}
              {leads.length===0?(
                <div className="empty">
                  <div className="empty-ico">✦</div>
                  <div className="empty-t">No leads loaded</div>
                  <div className="empty-s">Scrape GitHub orgs and save to Airtable first.</div>
                  <button className="btn btn-dark" onClick={()=>setTab('scrape')}>Go to Scraper</button>
                </div>
              ):<Logbox/>}
            </div>
            {leads.filter(l=>l.emailBody).length>0&&(
              <div className="card">
                <div className="ct" style={{marginBottom:18}}>Generated Emails</div>
                {leads.filter(l=>l.emailBody).slice(0,5).map((lead,i,arr)=>(
                  <div key={lead.id} style={{marginBottom:i<arr.length-1?20:0,paddingBottom:i<arr.length-1?20:0,borderBottom:i<arr.length-1?'1px solid var(--b)':'none'}}>
                    <div className="flex ic gap8 mb8">
                      <strong>{lead.company}</strong>
                      <span style={{fontFamily:'var(--mono)',fontSize:10,color:'var(--ink3)'}}>{lead.companyType}</span>
                    </div>
                    <div className="em"><div>Subject: <span>{lead.emailSubject}</span></div></div>
                    <div className="ep" style={{maxHeight:120}}>{lead.emailBody}</div>
                  </div>
                ))}
                {leads.filter(l=>l.emailBody).length>5&&(
                  <div style={{marginTop:16,fontFamily:'var(--mono)',fontSize:11,color:'var(--ink3)',textAlign:'center'}}>+{leads.filter(l=>l.emailBody).length-5} more — view all in CRM tab</div>
                )}
              </div>
            )}
          </>}

          {/* ══ SEND ══ */}
          {tab==='send'&&<>
            <div className="ph">
              <div className="ph-t">Send Campaign</div>
              <div className="ph-s">Deploy emails via PrivateEmail SMTP · 45 second cooldown between sends · all sends logged to Airtable</div>
            </div>
            <div className="card">
              <div className="ct" style={{marginBottom:16}}>Email Provider</div>
              <div className="pt">
                {[
                  {id:'privateemail',name:'PrivateEmail (Namecheap)',sub:'mail.privateemail.com · STARTTLS :587 · Sends from Vercel server'},
                  {id:'gmail',name:'Gmail',sub:'Via Claude Gmail MCP · Direct send from Gmail account'},
                ].map(p=>(
                  <div key={p.id} className={`po ${provider===p.id?'a':''}`} onClick={()=>setProvider(p.id as any)}>
                    <div className="pon">{provider===p.id?'● ':''}{p.name}</div>
                    <div className="pos">{p.sub}</div>
                  </div>
                ))}
              </div>
              <div className="card-hd" style={{marginBottom:12}}>
                <div className="ct">Launch</div>
                <div className="btn-row">
                  <button className="btn btn-red" onClick={runCampaign} disabled={sending||!readyCnt}>
                    {sending?`Sending... ${sendPct}%`:`▶ Send Campaign (${readyCnt} ready)`}
                  </button>
                  <span style={{fontFamily:'var(--mono)',fontSize:10,color:'var(--ink3)'}}>{stats.sent} sent · {stats.replied} replied · {stats.booked} booked</span>
                </div>
              </div>
              {sending&&(
                <div className="pgwrap">
                  <div className="pglbl"><span>Sending...</span><span>{sendPct}%</span></div>
                  <div className="pgbar"><div className="pgfill" style={{width:`${sendPct}%`}}/></div>
                </div>
              )}
            </div>
            <div className="card">
              <div className="ct" style={{marginBottom:16}}>Pre-Send Checklist</div>
              <div className="cklist">
                {[
                  {lbl:'Airtable connected',ok:health?.airtable?.ok??false,soft:false},
                  {lbl:'PrivateEmail SMTP verified',ok:health?.smtp?.ok??false,soft:!!health?.env?.smtpEmail&&!health?.smtp?.ok},
                  {lbl:'Anthropic API configured',ok:!!health?.env?.anthropic,soft:false},
                  {lbl:`Leads loaded (${stats.total})`,ok:stats.total>0,soft:false},
                  {lbl:`Emails generated (${stats.hasEmail})`,ok:stats.hasEmail>0,soft:false},
                  {lbl:`Contact emails added (${stats.hasContact})`,ok:stats.hasContact>0,soft:stats.hasContact<stats.total&&stats.hasContact>0},
                  {lbl:`${readyCnt} leads ready to send`,ok:readyCnt>0,soft:false},
                ].map(({lbl,ok,soft}:{lbl:string,ok:boolean,soft:boolean})=>(
                  <div key={lbl} className="crow">
                    <span className="ci" style={{color:ok?'var(--green)':soft?'var(--yellow)':'var(--ink4)'}}>{ok?'✓':soft?'⚠':'○'}</span>
                    <span style={{color:ok?'var(--ink)':'var(--ink3)'}}>{lbl}</span>
                  </div>
                ))}
              </div>
              <div style={{marginTop:16,padding:'14px 16px',background:'var(--s2)',borderRadius:'var(--r)',border:'1px solid var(--b)'}}>
                <div style={{fontFamily:'var(--mono)',fontSize:10,color:'var(--ink3)',textTransform:'uppercase',letterSpacing:'1px',marginBottom:8}}>How to add contact emails</div>
                <p style={{fontSize:12,color:'var(--ink3)',lineHeight:1.65}}>
                  Open <button className="pipe-cta" onClick={()=>window.open('https://airtable.com/appnF2fNAyEYnscvo','_blank')}>Airtable → Lobstack Leads ↗</button> and fill in the <strong style={{color:'var(--ink)'}}>Contact Email</strong> column.
                  Use <strong style={{color:'var(--ink)'}}>Hunter.io</strong>, <strong style={{color:'var(--ink)'}}>Apollo.io</strong>, or <strong style={{color:'var(--ink)'}}>LinkedIn Sales Nav</strong>.
                </p>
              </div>
            </div>
            <div className="card">
              <div className="ct" style={{marginBottom:14}}>Campaign Log</div>
              <Logbox/>
            </div>
          </>}

        </div>
      </div>
    </>
  )
}
