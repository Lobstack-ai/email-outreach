'use client'
import { useState, useRef, useCallback, useEffect } from 'react'

// Field IDs kept for reference only — writes now use field names (typecast:true)
// Reads use field names directly since Airtable REST API returns fields by name

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

type Lead={
  id:string; company:string; contactName:string; contactEmail:string;
  jobTitle:string; companyType:string; status:string; sequenceStatus:string;
  githubOrgUrl:string; website:string; aiTools:string; notes:string;
  emailSubject:string; emailBody:string; source:string;
  // GitHub metrics
  githubStars:number; githubForks:number; githubWatchers:number;
  orgMembers:number; contributors:number; openIssues:number; repoCount:number;
  topRepos:string; leadScore:number; description:string;
  // Sequence emails
  followUp1Subject:string; followUp1Body:string;
  followUp2Subject:string; followUp2Body:string;
}
type Log={t:string;msg:string;type:'i'|'o'|'w'|'e'}

function mapRecord(r:any):Lead{
  const f = r.fields||{}
  const g = (name:string,fallback='')=>{
    const v=f[name]
    if(v===undefined||v===null)return fallback
    if(typeof v==='object'&&'name' in v)return v.name
    if(typeof v==='object'&&'state' in v)return fallback
    return String(v)
  }
  const n = (name:string)=>{ const v=f[name]; return typeof v==='number'?v:0 }
  return {
    id:r.id,
    company:      g('Company'),
    contactName:  g('Contact Name'),
    contactEmail: g('Contact Email'),
    jobTitle:     g('Job Title'),
    companyType:  g('Company Type'),
    status:       g('Status','New'),
    sequenceStatus: g('Sequence Status','Cold'),
    githubOrgUrl: g('GitHub Org URL'),
    website:      g('Website'),
    aiTools:      g('AI Tools Used'),
    notes:        g('Personalization Notes'),
    description:  g('Personalization Notes'),
    emailSubject: g('Email Subject'),
    emailBody:    g('Email Body'),
    source:       g('Source'),
    topRepos:     g('Top Repos'),
    // Numeric metrics
    githubStars:  n('GitHub Stars'),
    githubForks:  n('GitHub Forks'),
    githubWatchers: n('GitHub Watchers'),
    orgMembers:   n('Org Members'),
    contributors: n('Top Repo Contributors'),
    openIssues:   n('Open Issues'),
    repoCount:    n('Repo Count'),
    leadScore:    n('Lead Score'),
    // Sequence
    followUp1Subject: g('Follow-up 1 Subject'),
    followUp1Body:    g('Follow-up 1 Body'),
    followUp2Subject: g('Follow-up 2 Subject'),
    followUp2Body:    g('Follow-up 2 Body'),
  }
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
  const[regenning,setRegenning]=useState(false)
  const[regenProgress,setRegenProgress]=useState({done:0,total:0})
  const[sending,setSending]=useState(false)
  const[sendPct,setSendPct]=useState(0)
  const[preview,setPreview]=useState<Lead|null>(null)
  const[provider,setProvider]=useState<'privateemail'|'gmail'>('privateemail')
  const[validation,setValidation]=useState<any>(null)
  const[validating,setValidating]=useState(false)
  // Dynamic discovery
  const[discovered,setDiscovered]=useState<any[]>([])
  const[discovering,setDiscovering]=useState(false)
  const[searchMode,setSearchMode]=useState<'discover'|'static'>('discover')
  // Scraper filters
  const[filterMinStars,setFilterMinStars]=useState(0)
  const[filterMinForks,setFilterMinForks]=useState(0)
  const[filterMinMembers,setFilterMinMembers]=useState(0)
  const[filterMinScore,setFilterMinScore]=useState(0)
  const[filterSortBy,setFilterSortBy]=useState<'stars'|'forks'|'members'|'score'|'watchers'>('score')
  const[filterShowHasEmail,setFilterShowHasEmail]=useState(false)
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

  const discoverOrgs = async () => {
    setDiscovering(true)
    setDiscovered([])
    addLog('=== Discovering new orgs from GitHub search ===', 'i')
    try {
      // Build existing set from GitHub org URLs — extract the slug from the URL
      const existingSlugs = leads
        .map(l => {
          const url = l.githubOrgUrl || ''
          // Extract slug from https://github.com/orgname or https://github.com/orgname/repo
          const match = url.match(/github\.com\/([^\/\s]+)/i)
          return match ? match[1].toLowerCase() : ''
        })
        .filter(Boolean)
      const existingParam = existingSlugs.join(',')
      addLog(`  Excluding ${existingSlugs.length} orgs already in CRM`, 'i')
      const r = await fetch(`/api/discover?queries=8&limit=60&existing=${existingParam}`).then(r => r.json())
      if (!r.ok) throw new Error(r.error)
      setDiscovered(r.orgs)
      addLog(`✓ Discovered ${r.orgs.length} new orgs not in your CRM`, 'o')
      if (r.queriesUsed?.length) addLog(`  Queries: ${r.queriesUsed.slice(0,3).join(' · ')}...`, 'i')
    } catch(e: any) {
      addLog(`✗ Discovery: ${e.message}`, 'e')
    }
    setDiscovering(false)
  }

  const scrapeOne = async (tgt: {org: string; name: string; type: string; website?: string}) => {
    setScrSt(p => ({...p, [tgt.org]: 'running'}))
    try {
      const websiteParam = tgt.website ? `&website=${encodeURIComponent(tgt.website)}` : ''
      const typeParam = tgt.type ? `&type=${encodeURIComponent(tgt.type)}` : ''
      const r = await fetch(`/api/scrape?org=${tgt.org}${websiteParam}${typeParam}`).then(r => r.json())
      if (!r.ok) throw new Error(r.error)
      setScraped(p => ({...p, [tgt.org]: r.data}))
      setScrSt(p => ({...p, [tgt.org]: 'done'}))
      addLog(`  ✓ ${tgt.name || tgt.org} ⭐${r.data.githubStars?.toLocaleString()}`, 'o')
    } catch(e: any) {
      setScrSt(p => ({...p, [tgt.org]: 'fail'}))
      addLog(`  ✗ ${tgt.name || tgt.org}: ${e.message}`, 'e')
    }
  }

  const scrapeAll = async () => {
    const targets = searchMode === 'discover' && discovered.length > 0
      ? discovered.map(o => ({ org: o.org, name: o.name, type: o.type, website: o.website }))
      : TARGETS
    addLog(`=== Scraping ${targets.length} orgs ===`, 'i')
    const rl = await fetch('/api/scrape?org=ratelimit').then(r=>r.json()).catch(()=>null)
    if (rl?.ok) addLog(`GitHub: ${rl.remaining}/${rl.limit} req remaining`, rl.remaining<40?'w':'i')
    for (const tgt of targets) {
      if (scrSt[tgt.org] === 'done') continue
      await scrapeOne(tgt)
      await new Promise(r => setTimeout(r, 250))
    }
    addLog('=== Scrape complete ===', 'o')
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
          "Company":          d.company,
          "Website":          d.website||'',
          "GitHub Org URL":   d.githubOrgUrl,
          "GitHub Stars":     d.githubStars||0,
          "GitHub Forks":     d.githubForks||0,
          "GitHub Watchers":  d.githubWatchers||0,
          "Org Members":      d.orgMembers||0,
          "Top Repo Contributors": d.contributors||0,
          "Open Issues":      d.openIssues||0,
          "Repo Count":       d.repoCount||0,
          "Top Repos":        d.topRepos||'',
          "Lead Score":       d.leadScore||0,
          "Company Type":     d.companyType,
          "AI Tools Used":    d.aiTools,
          "Status":           'New',
          "Sequence Status":  'Cold',
          "Source":           'GitHub Scrape',
          "Date Added":       new Date().toISOString().split('T')[0],
          "Personalization Notes": d.description||'',
        }
        if(d.contactName)  fields['Contact Name']  = d.contactName
        if(d.contactEmail) fields['Contact Email'] = d.contactEmail
        if(d.contactTitle) fields['Job Title'] = d.contactTitle + (d.contactConfidence==='inferred'?' (inferred)':' (verified)')
        if(d.contactConfidence){
          const confMap: Record<string,string> = {
            'verified':    'GitHub public',
            'inferred':    'Pattern inferred',
            'org-contact': 'Org contact',
          }
          const hunterConf = typeof d.contactConfidence==='string'&&d.contactConfidence.startsWith('hunter-')
          fields['Email Confidence'] = hunterConf ? 'Hunter verified' : (confMap[d.contactConfidence]||'Unknown')
        }

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
    addLog(`=== Generating ${targets.length} emails + sequences ===`,'i')
    for(let i=0;i<targets.length;i++){
      const lead=targets[i]
      addLog(`Writing sequence for ${lead.company}...`,'i')
      try{
        const r=await fetch('/api/generate',{method:'POST',headers:{'Content-Type':'application/json'},
          body:JSON.stringify({lead,senderName:'The Lobstack Team',mode:'all'})}).then(r=>r.json())
        if(!r.ok)throw new Error(r.error)
        // Save cold email + both follow-ups in one Airtable update
        await fetch('/api/airtable',{method:'POST',headers:{'Content-Type':'application/json'},
          body:JSON.stringify({action:'update',recordId:lead.id,fields:{
            "Email Subject":    r.subject,
            "Email Body":       r.body,
            "Follow-up 1 Subject": r.followUp1Subject||'',
            "Follow-up 1 Body":    r.followUp1Body||'',
            "Follow-up 2 Subject": r.followUp2Subject||'',
            "Follow-up 2 Body":    r.followUp2Body||'',
          }})})
        setLeads(p=>p.map(l=>l.id===lead.id?{...l,
          emailSubject:r.subject,emailBody:r.body,
          followUp1Subject:r.followUp1Subject||'',followUp1Body:r.followUp1Body||'',
          followUp2Subject:r.followUp2Subject||'',followUp2Body:r.followUp2Body||'',
        }:l))
        addLog(`  ✓ Cold: "${r.subject}"`,'o')
        if(r.followUp1Subject) addLog(`  ✓ FU1: "${r.followUp1Subject}"`,'o')
        if(r.followUp2Subject) addLog(`  ✓ FU2: "${r.followUp2Subject}"`,'o')
      }catch(e:any){addLog(`  ✗ ${lead.company}: ${e.message}`,'e')}
      setGenPct(Math.round(((i+1)/targets.length)*100))
      await new Promise(r=>setTimeout(r,800))
    }
    setGenning(false)
    addLog('=== Sequences complete ===','o')
    toast('3-part sequences generated and saved','o')
  }

  const regenAllEmails=async()=>{
    const targets=leads.filter(l=>l.emailBody) // only leads that already have emails
    if(!targets.length){toast('No emails to regenerate','w');return}
    if(!confirm(`Regenerate emails for all ${targets.length} leads using updated prompt? This will overwrite existing emails.`))return
    setRegenning(true)
    setRegenProgress({done:0,total:targets.length})
    addLog(`=== Regenerating ${targets.length} email sequences (new prompt: no dashes, call CTA) ===`,'i')
    let done=0,errors=0
    // Process in batches of 8 via regenerate API
    const batchSize=8
    for(let i=0;i<targets.length;i+=batchSize){
      const batch=targets.slice(i,i+batchSize)
      try{
        const r=await fetch('/api/regenerate',{
          method:'POST',
          headers:{'Content-Type':'application/json'},
          body:JSON.stringify({recordIds:batch.map(l=>l.id),senderName:'Brandon @ Lobstack'})
        }).then(r=>r.json())
        if(r.ok){
          done+=r.results.filter((x:any)=>x.ok).length
          errors+=r.results.filter((x:any)=>!x.ok).length
          r.results.forEach((x:any)=>{
            if(x.ok) addLog(`  ✓ ${x.company}`,'o')
            else addLog(`  ✗ ${x.company}: ${x.error}`,'e')
          })
        }
      }catch(e:any){
        addLog(`  Batch error: ${e.message}`,'e')
        errors+=batch.length
      }
      setRegenProgress({done:Math.min(i+batchSize,targets.length),total:targets.length})
      if(i+batchSize<targets.length) await new Promise(r=>setTimeout(r,1000))
    }
    setRegenning(false)
    addLog(`=== Regeneration complete: ${done} updated, ${errors} errors ===`,errors?'w':'o')
    toast(`${done} emails regenerated${errors?' · '+errors+' errors':''}`, errors?'w':'o')
    await loadLeads(true)
  }

  const validateLeads=async()=>{
    const targets=leads.filter(l=>l.emailBody&&l.emailSubject&&(sel.size===0||sel.has(l.id)))
    if(!targets.length){toast('No leads with emails generated yet','w');return}
    setValidating(true)
    setValidation(null)
    try{
      const r=await fetch('/api/validate-emails',{method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({leads:targets})}).then(r=>r.json())
      if(r.ok){
        setValidation(r)
        addLog(`Validation complete: ${r.summary.willSend} will send, ${r.summary.blocked} blocked`,'o')
        if(r.summary.personal>0) addLog(`  ✗ ${r.summary.personal} personal emails (Gmail/Hey/etc) — find company emails via Hunter.io`,'w')
        if(r.summary.edu>0)      addLog(`  ✗ ${r.summary.edu} education emails blocked`,'w')
        if(r.summary.missing>0)  addLog(`  ✗ ${r.summary.missing} leads missing contact email`,'w')
        if(r.summary.role>0)     addLog(`  ⚠ ${r.summary.role} role-based emails (hello@, info@) — will send but lower reply rate`,'w')
      }
    }catch(e:any){addLog(`✗ Validation: ${e.message}`,'e')}
    setValidating(false)
  }

  const runCampaign=async()=>{
    // Run validation first if not done
    if(!validation){
      toast('Run validation first to check email quality','w')
      await validateLeads()
      return
    }
    // Cross-reference with validation — only send to leads that passed
    const blockedIds = new Set((validation?.results||[]).filter((r:any)=>!r.willSend).map((r:any)=>r.id))
    const ready = leads.filter(l=>
      l.emailBody && l.emailSubject && l.contactEmail && l.status==='New' &&
      !blockedIds.has(l.id) &&
      (sel.size===0||sel.has(l.id))
    )
    if(!ready.length){toast('No sendable leads — all blocked by validation or missing emails','w');return}
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
          body:JSON.stringify({action:'update',recordId:lead.id,fields:{"Status":'Email Sent',"Sequence Status":'Email 1 Sent',"Last Contacted":new Date().toISOString().split('T')[0],"Follow Up #":1}})})
        await fetch('/api/airtable',{method:'POST',headers:{'Content-Type':'application/json'},
          body:JSON.stringify({action:'log',fields:{"Campaign ID":`CAM-${Date.now()}`,"Company":lead.company,"Contact Email":lead.contactEmail,"Subject":lead.emailSubject,"Sequence Step":'Cold Email #1',"Sent At":new Date().toISOString(),"Message ID":msgId,"Result":'Sent'}})})
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
            <svg width="22" height="22" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" style={{flexShrink:0}}>
              <polygon points="18,2 32,10 32,14 18,22 4,14 4,10" fill="#CE7878" opacity="0.55"/>
              <polygon points="18,8 32,16 32,20 18,28 4,20 4,16" fill="#D63839" opacity="0.75"/>
              <polygon points="18,14 32,22 32,26 18,34 4,26 4,22" fill="#E84142" opacity="1.0"/>
            </svg>
            <div className="brand-name">Lobstack</div>
            <div className="brand-tag">Outreach</div>
          </div>
          <div className="topbar-r">
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
                {ico:'⭐',lbl:'Scrape GitHub',sub:`Discover AI-forward orgs · score leads · enrich with contacts`,act:()=>setTab('scrape'),dis:false,prime:false},
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
                </div>
                <div className="cklist">
                  {[
                    {key:'AIRTABLE_API_KEY',ok:!!health.env?.airtable,hint:'airtable.com/create/tokens — data.records:read + data.records:write'},
                    {key:'ANTHROPIC_API_KEY',ok:!!health.env?.anthropic,hint:'console.anthropic.com — required for email generation'},
                    {key:'SMTP_EMAIL',ok:!!health.env?.smtpEmail,hint:health.env?.smtpEmailVal||'hello@lobstack.ai'},
                    {key:'SMTP_PASSWORD',ok:!!health.env?.smtpPass,hint:'Your PrivateEmail account password'},
                    {key:'GITHUB_TOKEN',ok:!!health.env?.githubToken,hint:'Optional — upgrades scraper from 60 to 5,000 req/hr'},
                    {key:'HUNTER_API_KEY',ok:!!health.env?.hunterKey,hint:'Optional — hunter.io for 3× more contact emails. Free: 25/mo'},
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

            {/* SEQUENCE STATUS */}
            {leads.length>0&&(()=>{
              const seqCounts = {
                cold:     leads.filter(l=>!l.sequenceStatus||l.sequenceStatus==='Cold').length,
                email1:   leads.filter(l=>l.sequenceStatus==='Email 1 Sent').length,
                fu1:      leads.filter(l=>l.sequenceStatus==='Follow-up 1 Sent').length,
                fu2:      leads.filter(l=>l.sequenceStatus==='Follow-up 2 Sent').length,
                replied:  leads.filter(l=>l.sequenceStatus==='Replied').length,
                booked:   leads.filter(l=>l.sequenceStatus==='Booked').length,
                optedOut: leads.filter(l=>l.sequenceStatus==='Opted Out').length,
              }
              const fu1Due = leads.filter(l=>{
                if(l.sequenceStatus!=='Email 1 Sent'||!l.followUp1Body) return false
                return true // server checks exact days, we just show count
              }).length
              const fu2Due = leads.filter(l=>l.sequenceStatus==='Follow-up 1 Sent'&&!!l.followUp2Body).length
              return(
                <>
                  <div className="stitle">Sequence Pipeline</div>
                  <div style={{background:'var(--s1)',border:'1px solid var(--b)',borderRadius:'var(--r2)',overflow:'hidden',marginBottom:28,boxShadow:'var(--sh)'}}>
                    <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)'}}>
                      {[
                        {lbl:'Cold',val:seqCounts.cold,col:'var(--ink4)'},
                        {lbl:'Email 1 Sent',val:seqCounts.email1,col:'var(--blue)'},
                        {lbl:'FU1 Sent',val:seqCounts.fu1,col:'var(--yellow)'},
                        {lbl:'FU2 Sent',val:seqCounts.fu2,col:'#d97706'},
                        {lbl:'Replied',val:seqCounts.replied,col:'var(--green)'},
                        {lbl:'Booked',val:seqCounts.booked,col:'var(--green)'},
                        {lbl:'Opted Out',val:seqCounts.optedOut,col:'var(--red)'},
                      ].map(({lbl,val,col},i,arr)=>(
                        <div key={lbl} style={{padding:'18px 16px',borderRight:i<arr.length-1?'1px solid var(--b)':'none',textAlign:'center'}}>
                          <div style={{fontFamily:'var(--sans)',fontWeight:800,fontSize:28,letterSpacing:'-1px',color:val>0?col:'var(--ink4)'}}>{val}</div>
                          <div style={{fontFamily:'var(--mono)',fontSize:9,color:'var(--ink3)',textTransform:'uppercase',letterSpacing:'.8px',marginTop:6}}>{lbl}</div>
                        </div>
                      ))}
                    </div>
                    {(fu1Due>0||fu2Due>0)&&(
                      <div style={{padding:'12px 20px',borderTop:'1px solid var(--b)',background:'#d9770608',display:'flex',alignItems:'center',gap:16}}>
                        <span style={{fontFamily:'var(--mono)',fontSize:10,color:'var(--yellow)'}}>⚡ Auto-scheduler active</span>
                        {fu1Due>0&&<span style={{fontFamily:'var(--mono)',fontSize:10,color:'var(--ink3)'}}>{fu1Due} leads awaiting FU1 (fires at 9am UTC when 5+ days since send)</span>}
                        {fu2Due>0&&<span style={{fontFamily:'var(--mono)',fontSize:10,color:'var(--ink3)'}}>{fu2Due} leads awaiting FU2</span>}
                      </div>
                    )}
                  </div>
                </>
              )
            })()}

            {/* DOMAIN WARMUP TRACKER */}
            {(()=>{
              const daysSinceFirst = stats.sent>0 ? Math.floor((Date.now()-new Date('2026-03-28').getTime())/86400000) : 0
              const weekNum = Math.max(1,Math.ceil(daysSinceFirst/7))
              const dailyTarget = weekNum===1?10:weekNum===2?20:weekNum===3?35:50
              const warmupPct = Math.min(100,Math.round((stats.sent/(dailyTarget*7*weekNum))*100))
              return stats.sent>0&&(
                <>
                  <div className="stitle" style={{marginTop:24}}>Domain Warmup</div>
                  <div style={{background:'var(--s1)',border:'1px solid var(--b)',borderRadius:'var(--r2)',padding:'18px 20px',marginBottom:20,boxShadow:'var(--sh)'}}>
                    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr 1fr',gap:16,marginBottom:16}}>
                      {[
                        {lbl:'Week 1',target:'~10/day',status:weekNum>=1?'done':'upcoming'},
                        {lbl:'Week 2',target:'~20/day',status:weekNum>=2?'done':weekNum===1?'active':'upcoming'},
                        {lbl:'Week 3',target:'~35/day',status:weekNum>=3?'done':weekNum===2?'active':'upcoming'},
                        {lbl:'Week 4+',target:'~50/day',status:weekNum>=4?'active':'upcoming'},
                      ].map(w=>(
                        <div key={w.lbl} style={{padding:'12px 14px',borderRadius:'var(--r)',background:w.status==='active'?'#E8414208':w.status==='done'?'#16a34a08':'var(--s2)',border:`1px solid ${w.status==='active'?'var(--red2)':w.status==='done'?'#16a34a30':'var(--b)'}`,textAlign:'center'}}>
                          <div style={{fontFamily:'var(--mono)',fontSize:10,color:w.status==='active'?'var(--red2)':w.status==='done'?'var(--green)':'var(--ink4)',fontWeight:700,marginBottom:4}}>{w.lbl}</div>
                          <div style={{fontFamily:'var(--mono)',fontSize:11,color:w.status==='upcoming'?'var(--ink4)':'var(--ink)'}}>{w.target}</div>
                          <div style={{fontFamily:'var(--mono)',fontSize:9,color:w.status==='active'?'var(--red2)':w.status==='done'?'var(--green)':'var(--ink4)',marginTop:4}}>{w.status==='active'?'← NOW':w.status==='done'?'✓ DONE':'—'}</div>
                        </div>
                      ))}
                    </div>
                    <div style={{background:'var(--s2)',borderRadius:'var(--r)',padding:'10px 14px',display:'flex',alignItems:'center',gap:12}}>
                      <span style={{fontFamily:'var(--mono)',fontSize:10,color:'var(--ink3)',flexShrink:0}}>{stats.sent} sent total</span>
                      <div style={{flex:1,height:4,background:'var(--b2)',borderRadius:2,overflow:'hidden'}}>
                        <div style={{height:'100%',width:`${warmupPct}%`,background:'var(--red2)',borderRadius:2,transition:'width .3s'}}/>
                      </div>
                      <span style={{fontFamily:'var(--mono)',fontSize:10,color:'var(--ink3)',flexShrink:0}}>Week {weekNum} · {dailyTarget}/day target</span>
                    </div>
                  </div>
                </>
              )
            })()}

            {/* HUNTER.IO SETUP PROMPT */}
            {!health?.env?.hunterKey&&(
              <>
                <div className="stitle" style={{marginTop:24}}>Improve Email Discovery</div>
                <div style={{background:'var(--s1)',border:'1px solid var(--b)',borderRadius:'var(--r2)',padding:'18px 20px',marginBottom:20,boxShadow:'var(--sh)',display:'flex',alignItems:'flex-start',gap:16}}>
                  <div style={{fontSize:20,flexShrink:0}}>🎯</div>
                  <div>
                    <div style={{fontFamily:'var(--sans)',fontWeight:700,fontSize:13,color:'var(--ink)',marginBottom:4}}>Add Hunter.io for 3× more contact emails</div>
                    <div style={{fontFamily:'var(--body)',fontSize:12,color:'var(--ink3)',lineHeight:1.6,marginBottom:12}}>
                      Currently finding emails from GitHub public profiles and pattern inference. Hunter.io finds verified corporate emails from domain search — dramatically improves hit rate for orgs without public GitHub emails.
                    </div>
                    <div style={{display:'flex',alignItems:'center',gap:12,flexWrap:'wrap'}}>
                      <a href="https://hunter.io/users/sign_up" target="_blank" rel="noopener noreferrer" className="btn btn-dark btn-sm" style={{textDecoration:'none'}}>Get free API key →</a>
                      <span style={{fontFamily:'var(--mono)',fontSize:10,color:'var(--ink3)'}}>Free: 25 searches/mo · Starter: $49/mo for 500</span>
                    </div>
                    <div style={{marginTop:12,fontFamily:'var(--mono)',fontSize:10,color:'var(--ink4)'}}>
                      Add <code style={{background:'var(--s3)',padding:'1px 6px',borderRadius:3}}>HUNTER_API_KEY</code> in Vercel → Settings → Environment Variables, then redeploy
                    </div>
                  </div>
                </div>
              </>
            )}
            {health?.env?.hunterKey&&(
              <div style={{marginTop:8,marginBottom:20,display:'flex',alignItems:'center',gap:8,fontFamily:'var(--mono)',fontSize:11}}>
                <span style={{color:'var(--green)'}}>✓</span>
                <span style={{color:'var(--ink3)'}}>Hunter.io connected — email enrichment active on all new scrapes</span>
              </div>
            )}

            <div className="stitle" style={{marginTop:24}}>System Log</div>
            <Logbox maxH="220px"/>
          </>}

          {/* ══ SCRAPE ══ */}
          {tab==='scrape'&&<>
            <div className="ph">
              <div className="ph-t">GitHub Lead Scraper</div>
              <div className="ph-s">Discover fresh AI-forward companies · filter by metrics · enrich with contact emails</div>
            </div>

            {/* ACTION BAR */}
            <div className="card" style={{padding:'16px 20px',marginBottom:12}}>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:12}}>
                <div style={{fontFamily:'var(--sans)',fontWeight:700,fontSize:13,color:'var(--ink)'}}>
                  🔍 Discover New Orgs
                  <span style={{fontFamily:'var(--body)',fontSize:11,color:'var(--ink3)',fontWeight:400,marginLeft:8}}>Live GitHub search · filters out existing CRM leads</span>
                </div>
                <div className="btn-row">
                  <button className="btn btn-dark" onClick={discoverOrgs} disabled={discovering}>
                    {discovering?'Searching...':'🔍 Discover Orgs'}
                  </button>
                  <button className="btn btn-dark"
                    onClick={scrapeAll}
                    disabled={Object.values(scrSt).some(s=>s==='running')||!discovered.length}>
                    Enrich All
                  </button>
                  <button className="btn btn-red" onClick={saveToAirtable} disabled={!scCnt}>↑ Save {scCnt} to CRM</button>
                  <button className="btn btn-ghost btn-sm" onClick={()=>loadLeads()}>↻ Reload</button>
                </div>
              </div>
            </div>

            {/* FILTER BAR */}
            <div className="card" style={{padding:'14px 20px',marginBottom:12,background:'var(--s2)'}}>
              <div style={{display:'flex',alignItems:'center',gap:16,flexWrap:'wrap'}}>
                <div style={{fontFamily:'var(--mono)',fontSize:10,color:'var(--ink3)',textTransform:'uppercase',letterSpacing:'1px',flexShrink:0}}>Filters</div>

                {/* Sort by */}
                <div style={{display:'flex',alignItems:'center',gap:6}}>
                  <span style={{fontFamily:'var(--mono)',fontSize:10,color:'var(--ink3)'}}>Sort</span>
                  <select value={filterSortBy} onChange={e=>setFilterSortBy(e.target.value as any)}
                    style={{fontFamily:'var(--mono)',fontSize:11,padding:'4px 8px',borderRadius:'var(--r)',border:'1px solid var(--b2)',background:'var(--s1)',color:'var(--ink)',cursor:'pointer'}}>
                    <option value="score">Lead Score</option>
                    <option value="stars">Stars</option>
                    <option value="forks">Forks</option>
                    <option value="members">Org Members</option>
                    <option value="watchers">Watchers</option>
                  </select>
                </div>

                {/* Min stars */}
                <div style={{display:'flex',alignItems:'center',gap:6}}>
                  <span style={{fontFamily:'var(--mono)',fontSize:10,color:'var(--ink3)'}}>Min ⭐</span>
                  <input type="number" min={0} value={filterMinStars} onChange={e=>setFilterMinStars(Number(e.target.value))}
                    style={{width:70,fontFamily:'var(--mono)',fontSize:11,padding:'4px 8px',borderRadius:'var(--r)',border:'1px solid var(--b2)',background:'var(--s1)',color:'var(--ink)'}}/>
                </div>

                {/* Min forks */}
                <div style={{display:'flex',alignItems:'center',gap:6}}>
                  <span style={{fontFamily:'var(--mono)',fontSize:10,color:'var(--ink3)'}}>Min forks</span>
                  <input type="number" min={0} value={filterMinForks} onChange={e=>setFilterMinForks(Number(e.target.value))}
                    style={{width:70,fontFamily:'var(--mono)',fontSize:11,padding:'4px 8px',borderRadius:'var(--r)',border:'1px solid var(--b2)',background:'var(--s1)',color:'var(--ink)'}}/>
                </div>

                {/* Min members */}
                <div style={{display:'flex',alignItems:'center',gap:6}}>
                  <span style={{fontFamily:'var(--mono)',fontSize:10,color:'var(--ink3)'}}>Min members</span>
                  <input type="number" min={0} value={filterMinMembers} onChange={e=>setFilterMinMembers(Number(e.target.value))}
                    style={{width:70,fontFamily:'var(--mono)',fontSize:11,padding:'4px 8px',borderRadius:'var(--r)',border:'1px solid var(--b2)',background:'var(--s1)',color:'var(--ink)'}}/>
                </div>

                {/* Min lead score */}
                <div style={{display:'flex',alignItems:'center',gap:6}}>
                  <span style={{fontFamily:'var(--mono)',fontSize:10,color:'var(--ink3)'}}>Min score</span>
                  <input type="number" min={0} max={100} value={filterMinScore} onChange={e=>setFilterMinScore(Number(e.target.value))}
                    style={{width:60,fontFamily:'var(--mono)',fontSize:11,padding:'4px 8px',borderRadius:'var(--r)',border:'1px solid var(--b2)',background:'var(--s1)',color:'var(--ink)'}}/>
                </div>

                {/* Email only toggle */}
                <label style={{display:'flex',alignItems:'center',gap:6,cursor:'pointer',fontFamily:'var(--mono)',fontSize:10,color:'var(--ink3)'}}>
                  <input type="checkbox" checked={filterShowHasEmail} onChange={e=>setFilterShowHasEmail(e.target.checked)}
                    style={{accentColor:'var(--red2)',width:13,height:13}}/>
                  Has email
                </label>

                {/* Reset */}
                {(filterMinStars>0||filterMinForks>0||filterMinMembers>0||filterMinScore>0||filterShowHasEmail||filterSortBy!=='score')&&(
                  <button className="btn btn-ghost btn-xs" onClick={()=>{
                    setFilterMinStars(0);setFilterMinForks(0);setFilterMinMembers(0);
                    setFilterMinScore(0);setFilterShowHasEmail(false);setFilterSortBy('score');
                  }}>✕ Reset</button>
                )}
              </div>
            </div>

            {/* DISCOVER MODE */}
            {(()=>{
              const sortFn=(a:any,b:any)=>{
                if(filterSortBy==='stars')   return (b.stars||0)-(a.stars||0)
                if(filterSortBy==='forks')   return (scraped[b.org]?.githubForks||0)-(scraped[a.org]?.githubForks||0)
                if(filterSortBy==='members') return (scraped[b.org]?.orgMembers||0)-(scraped[a.org]?.orgMembers||0)
                if(filterSortBy==='watchers')return (scraped[b.org]?.githubWatchers||0)-(scraped[a.org]?.githubWatchers||0)
                // default: score — use scraped data if available, else stars as proxy
                const scoreA = scraped[a.org]?.leadScore ?? a.stars ?? 0
                const scoreB = scraped[b.org]?.leadScore ?? b.stars ?? 0
                return scoreB-scoreA
              }
              const filtered = discovered
                .filter(o=>{
                  const enriched = scraped[o.org]
                  // For unenriched orgs, only apply star filter (the only pre-enrichment signal)
                  // Skip member/fork/score filters until enriched — don't hide cards user hasn't seen yet
                  if(filterMinStars>0&&(o.stars||0)<filterMinStars) return false
                  if(!enriched) return true  // show unenriched orgs unless star filter blocks them
                  if(filterMinForks>0&&(enriched.githubForks||0)<filterMinForks) return false
                  if(filterMinMembers>0&&(enriched.orgMembers||0)<filterMinMembers) return false
                  if(filterMinScore>0&&(enriched.leadScore||0)<filterMinScore) return false
                  if(filterShowHasEmail&&!enriched.contactEmail) return false
                  return true
                })
                .sort(sortFn)
              return(
                <div className="card">
                  <div className="card-hd">
                    <div className="ct">
                      Discovered Orgs
                      {discovered.length>0&&<span style={{color:'var(--green)',fontSize:11,fontWeight:400,marginLeft:8}}>
                        {filtered.length} shown{filtered.length!==discovered.length?` of ${discovered.length}`:''}
                      </span>}
                    </div>
                  </div>
                  {discovering&&(
                    <div style={{padding:'40px 0',textAlign:'center',color:'var(--ink3)',fontFamily:'var(--mono)',fontSize:12}}>
                      <div style={{marginBottom:12}}>Searching GitHub across 6 queries...</div>
                    </div>
                  )}
                  {!discovering&&discovered.length===0&&(
                    <div className="empty">
                      <div className="empty-ico">🔍</div>
                      <div className="empty-t">Click Discover Orgs to find fresh leads</div>
                      <div className="empty-s">Runs 6 parallel GitHub searches for orgs building with AI. Excludes companies already in your CRM.</div>
                    </div>
                  )}
                  {filtered.length>0&&(
                    <div className="sg">
                      {filtered.map((org:any)=>{
                        const st=scrSt[org.org]||'idle', d=scraped[org.org]
                        const score=d?.leadScore
                        return(
                          <div key={org.org}
                            className={`scard ${st==='done'?'done':st==='running'?'running':st==='fail'?'fail':''}`}
                            onClick={()=>(st==='idle'||st==='fail')&&scrapeOne({org:org.org,name:org.name,type:org.type,website:org.website})}>
                            <div className="sn">{org.name}</div>
                            <div className="stype">{org.type}</div>
                            <div className="sstar">⭐ {(org.stars||0).toLocaleString()}</div>
                            {d?<>
                              <div style={{display:'flex',gap:8,marginTop:4,flexWrap:'wrap'}}>
                                {d.githubForks>0&&<span style={{fontFamily:'var(--mono)',fontSize:9,color:'var(--ink3)'}}>⑂{d.githubForks}</span>}
                                {d.orgMembers>0&&<span style={{fontFamily:'var(--mono)',fontSize:9,color:'var(--ink3)'}}>👥{d.orgMembers}</span>}
                                {score>0&&<span style={{fontFamily:'var(--mono)',fontSize:9,padding:'1px 5px',borderRadius:3,background:score>=70?'#16a34a15':score>=40?'#d9770615':'var(--s3)',color:score>=70?'var(--green)':score>=40?'var(--yellow)':'var(--ink3)'}}>{score}</span>}
                              </div>
                              {d.contactEmail
                                ?<div className="sst" style={{color:'var(--green)'}}>✓ {d.contactEmail}</div>
                                :<div className="sst" style={{color:'var(--ink4)'}}>no email found</div>}
                            </>:<div className="sst" style={{color:st==='running'?'var(--yellow)':st==='fail'?'var(--red)':'var(--ink4)'}}>
                              {st==='running'?'Enriching...':st==='fail'?'Failed — retry':'Click to enrich'}
                            </div>}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })()}


            <div className="card">
              <div className="ct" style={{marginBottom:14}}>Log</div>
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
                      <th>Company</th><th>Score</th><th>Contact Email</th><th>Status</th><th>Sequence</th><th>Stars</th><th>Email</th><th></th>
                    </tr></thead>
                    <tbody>
                      {leads.map(lead=>(
                        <tr key={lead.id} className={sel.has(lead.id)?'sel':''}>
                          <td><input type="checkbox" className="ck" checked={sel.has(lead.id)} onChange={e=>{const s=new Set(sel);e.target.checked?s.add(lead.id):s.delete(lead.id);setSel(s)}}/></td>
                          <td><strong>{lead.company}</strong></td>
                          <td>
                            {lead.leadScore>0?(
                              <span style={{fontFamily:'var(--mono)',fontSize:11,fontWeight:600,padding:'2px 8px',borderRadius:4,background:lead.leadScore>=70?'#16a34a15':lead.leadScore>=40?'#d9770615':'var(--s3)',color:lead.leadScore>=70?'var(--green)':lead.leadScore>=40?'var(--yellow)':'var(--ink3)'}}>
                                {lead.leadScore}
                              </span>
                            ):<span style={{color:'var(--ink4)',fontSize:11}}>—</span>}
                          </td>
                          <td>{lead.contactEmail?(
                                <div style={{display:'flex',alignItems:'center',gap:5}}>
                                  <span style={{fontFamily:'var(--mono)',fontSize:11}}>{lead.contactEmail}</span>
                                  {lead.jobTitle?.includes('(verified)')&&<span style={{fontFamily:'var(--mono)',fontSize:9,color:'var(--green)',background:'#16a34a10',padding:'1px 5px',borderRadius:3}}>GitHub public</span>}
                                  {lead.jobTitle?.includes('(inferred)')&&<span style={{fontFamily:'var(--mono)',fontSize:9,color:'var(--yellow)',background:'#d9770610',padding:'1px 5px',borderRadius:3}}>pattern guess</span>}
                                </div>
                              ):<span style={{color:'var(--ink4)',fontStyle:'italic',fontSize:11}}>Add in Airtable →</span>}</td>
                          <td><span className={`pill ${lead.status==='Email Sent'?'ps':lead.status==='Replied'?'pr':lead.status==='Booked Call'?'pb2':'pn'}`}>{lead.status||'New'}</span></td>
                          <td>
                            <span style={{fontFamily:'var(--mono)',fontSize:10,color:lead.sequenceStatus==='Replied'?'var(--green)':lead.sequenceStatus==='Booked'?'var(--green)':lead.sequenceStatus==='Cold'?'var(--ink4)':'var(--ink3)'}}>
                              {lead.sequenceStatus||'Cold'}
                              {lead.followUp1Body&&!lead.followUp1Subject.includes('Re:')===false&&<span style={{color:'var(--ink4)',marginLeft:4}}>→FU1</span>}
                            </span>
                          </td>
                          <td><span style={{fontFamily:'var(--mono)',fontSize:10,color:'var(--ink3)'}}>{lead.githubStars>0?`⭐${lead.githubStars.toLocaleString()}`:'—'}</span></td>
                          <td>{lead.emailBody?<span style={{color:'var(--green)',fontFamily:'var(--mono)',fontSize:10}}>✓{lead.followUp1Body?' +seq':''}</span>:<span style={{color:'var(--ink4)',fontSize:10}}>—</span>}</td>
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
                  <div className="ct">{preview.company} — Full Sequence</div>
                  <button className="btn btn-ghost btn-sm" onClick={()=>setPreview(null)}>✕ Close</button>
                </div>
                <div className="em">
                  <div>To: <span>{preview.contactEmail||'(no contact email — add in Airtable)'}</span></div>
                </div>
                {/* Email 1 */}
                <div style={{marginBottom:16}}>
                  <div style={{fontFamily:'var(--mono)',fontSize:10,color:'var(--ink3)',textTransform:'uppercase',letterSpacing:'1px',marginBottom:8,display:'flex',alignItems:'center',gap:8}}>
                    Cold Email · Day 1
                    <span style={{color:'var(--blue)',background:'#2563eb10',padding:'1px 6px',borderRadius:3}}>Send first</span>
                  </div>
                  <div className="em"><div>Subject: <span>{preview.emailSubject}</span></div></div>
                  <div className="ep">{preview.emailBody}</div>
                </div>
                {/* Follow-up 1 */}
                {preview.followUp1Body&&<div style={{marginBottom:16}}>
                  <div style={{fontFamily:'var(--mono)',fontSize:10,color:'var(--ink3)',textTransform:'uppercase',letterSpacing:'1px',marginBottom:8,display:'flex',alignItems:'center',gap:8}}>
                    Follow-up 1 · Day 5
                    <span style={{color:'var(--yellow)',background:'#d9770610',padding:'1px 6px',borderRadius:3}}>If no reply</span>
                  </div>
                  <div className="em"><div>Subject: <span>{preview.followUp1Subject}</span></div></div>
                  <div className="ep">{preview.followUp1Body}</div>
                </div>}
                {/* Follow-up 2 */}
                {preview.followUp2Body&&<div>
                  <div style={{fontFamily:'var(--mono)',fontSize:10,color:'var(--ink3)',textTransform:'uppercase',letterSpacing:'1px',marginBottom:8,display:'flex',alignItems:'center',gap:8}}>
                    Breakup Email · Day 12
                    <span style={{color:'var(--red)',background:'#E8414210',padding:'1px 6px',borderRadius:3}}>Final touchpoint</span>
                  </div>
                  <div className="em"><div>Subject: <span>{preview.followUp2Subject}</span></div></div>
                  <div className="ep">{preview.followUp2Body}</div>
                </div>}
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
                  <button className="btn btn-dark" onClick={genEmails} disabled={genning||regenning||!leads.length||!health?.env?.anthropic}>
                    {genning?'Generating...':'✦ Generate'}
                  </button>
                  {stats.hasEmail>0&&(
                    <button className="btn btn-ghost btn-sm" onClick={regenAllEmails} disabled={genning||regenning}
                      title="Regenerate all existing emails with improved prompt (no dashes, call CTA)">
                      {regenning?`↻ ${regenProgress.done}/${regenProgress.total}...`:'↻ Regen All'}
                    </button>
                  )}
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
              {regenning&&(
                <div className="pgwrap">
                  <div className="pglbl"><span>Regenerating with improved prompt...</span><span>{regenProgress.done}/{regenProgress.total}</span></div>
                  <div className="pgbar"><div className="pgfill" style={{width:`${Math.round((regenProgress.done/Math.max(regenProgress.total,1))*100)}%`}}/></div>
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
                <div className="card-hd">
                  <div className="ct">Generated Sequences</div>
                  <span style={{fontFamily:'var(--mono)',fontSize:10,color:'var(--ink3)'}}>
                    {leads.filter(l=>l.emailBody).length} leads · 3 emails each
                  </span>
                </div>
                {leads.filter(l=>l.emailBody).slice(0,3).map((lead,i,arr)=>{
                  const hasFU1=!!lead.followUp1Body, hasFU2=!!lead.followUp2Body
                  return(
                    <div key={lead.id} style={{marginBottom:i<arr.length-1?24:0,paddingBottom:i<arr.length-1?24:0,borderBottom:i<arr.length-1?'1px solid var(--b)':'none'}}>
                      {/* Lead header with score */}
                      <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:12}}>
                        <strong style={{fontSize:14}}>{lead.company}</strong>
                        <span style={{fontFamily:'var(--mono)',fontSize:10,color:'var(--ink3)'}}>{lead.companyType}</span>
                        {lead.leadScore>0&&<span style={{fontFamily:'var(--mono)',fontSize:10,padding:'2px 7px',borderRadius:4,background:lead.leadScore>=70?'#16a34a15':lead.leadScore>=40?'#d9770615':'var(--s3)',color:lead.leadScore>=70?'var(--green)':lead.leadScore>=40?'var(--yellow)':'var(--ink3)'}}>Score {lead.leadScore}</span>}
                        {lead.contactEmail&&<span style={{fontFamily:'var(--mono)',fontSize:10,color:'var(--green)'}}>✓ {lead.contactEmail}</span>}
                      </div>
                      {/* 3-part sequence tabs */}
                      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:10}}>
                        {/* Cold email */}
                        <div style={{background:'var(--s2)',borderRadius:'var(--r)',padding:'12px',border:'1px solid var(--b)'}}>
                          <div style={{fontFamily:'var(--mono)',fontSize:9,color:'var(--ink3)',textTransform:'uppercase',letterSpacing:'1px',marginBottom:8}}>Cold Email · Day 1</div>
                          <div style={{fontFamily:'var(--mono)',fontSize:11,fontWeight:600,color:'var(--ink)',marginBottom:8}}>{lead.emailSubject}</div>
                          <div style={{fontSize:11,color:'var(--ink3)',lineHeight:1.5,maxHeight:80,overflow:'hidden'}}>{lead.emailBody?.slice(0,200)}{lead.emailBody?.length>200?'…':''}</div>
                        </div>
                        {/* Follow-up 1 */}
                        <div style={{background:hasFU1?'var(--s2)':'var(--s3)',borderRadius:'var(--r)',padding:'12px',border:'1px solid var(--b)',opacity:hasFU1?1:.5}}>
                          <div style={{fontFamily:'var(--mono)',fontSize:9,color:'var(--ink3)',textTransform:'uppercase',letterSpacing:'1px',marginBottom:8}}>Follow-up 1 · Day 5</div>
                          {hasFU1?<>
                            <div style={{fontFamily:'var(--mono)',fontSize:11,fontWeight:600,color:'var(--ink)',marginBottom:8}}>{lead.followUp1Subject}</div>
                            <div style={{fontSize:11,color:'var(--ink3)',lineHeight:1.5,maxHeight:80,overflow:'hidden'}}>{lead.followUp1Body?.slice(0,200)}{lead.followUp1Body?.length>200?'…':''}</div>
                          </>:<div style={{fontSize:11,color:'var(--ink4)',fontStyle:'italic'}}>Not generated yet</div>}
                        </div>
                        {/* Follow-up 2 (breakup) */}
                        <div style={{background:hasFU2?'var(--s2)':'var(--s3)',borderRadius:'var(--r)',padding:'12px',border:'1px solid var(--b)',opacity:hasFU2?1:.5}}>
                          <div style={{fontFamily:'var(--mono)',fontSize:9,color:'var(--ink3)',textTransform:'uppercase',letterSpacing:'1px',marginBottom:8}}>Breakup Email · Day 12</div>
                          {hasFU2?<>
                            <div style={{fontFamily:'var(--mono)',fontSize:11,fontWeight:600,color:'var(--ink)',marginBottom:8}}>{lead.followUp2Subject}</div>
                            <div style={{fontSize:11,color:'var(--ink3)',lineHeight:1.5,maxHeight:80,overflow:'hidden'}}>{lead.followUp2Body?.slice(0,200)}{lead.followUp2Body?.length>200?'…':''}</div>
                          </>:<div style={{fontSize:11,color:'var(--ink4)',fontStyle:'italic'}}>Not generated yet</div>}
                        </div>
                      </div>
                    </div>
                  )
                })}
                {leads.filter(l=>l.emailBody).length>3&&(
                  <div style={{marginTop:16,fontFamily:'var(--mono)',fontSize:11,color:'var(--ink3)',textAlign:'center'}}>
                    +{leads.filter(l=>l.emailBody).length-3} more sequences saved to Airtable
                  </div>
                )}
              </div>
            )}
          </>}

          {/* ══ SEND ══ */}
          {tab==='send'&&<>
            <div className="ph">
              <div className="ph-t">Send Campaign</div>
              <div className="ph-s">Validate emails before sending · PrivateEmail SMTP · 45s cooldown · all sends logged to Airtable</div>
            </div>

            {/* STEP 1 — PROVIDER */}
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
            </div>

            {/* STEP 2 — VALIDATE */}
            <div className="card">
              <div className="card-hd">
                <div className="ct">Step 1 — Validate Emails</div>
                <div className="btn-row">
                  <button className="btn btn-dark" onClick={validateLeads} disabled={validating||!leads.length}>
                    {validating?'Validating...':'▶ Run Validation'}
                  </button>
                  {validation&&<span style={{fontFamily:'var(--mono)',fontSize:10,color:'var(--green)'}}>
                    ✓ {validation.summary.willSend} will send · {validation.summary.blocked} blocked
                  </span>}
                </div>
              </div>
              <p style={{fontSize:12,color:'var(--ink3)',marginBottom:16,lineHeight:1.6}}>
                Checks every contact email before sending — blocks personal addresses (Gmail, Hey, etc.), education emails (.edu), and flags role-based addresses. Prevents spam filter rejections.
              </p>

              {validation&&(
                <div style={{display:'flex',flexDirection:'column',gap:2}}>
                  {/* Summary row */}
                  <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:8,marginBottom:14}}>
                    {[
                      {label:'Ready',val:validation.summary.ready,color:'var(--green)'},
                      {label:'Role-based',val:validation.summary.role,color:'var(--yellow)'},
                      {label:'Personal',val:validation.summary.personal,color:'var(--red)'},
                      {label:'Edu',val:validation.summary.edu,color:'var(--red)'},
                      {label:'Missing',val:validation.summary.missing,color:'var(--ink4)'},
                    ].map(({label,val,color})=>(
                      <div key={label} style={{background:'var(--s2)',borderRadius:'var(--r)',padding:'10px 12px',border:'1px solid var(--b)'}}>
                        <div style={{fontFamily:'var(--sans)',fontWeight:700,fontSize:20,color:val>0?color:'var(--ink4)'}}>{val}</div>
                        <div style={{fontFamily:'var(--mono)',fontSize:9,color:'var(--ink3)',textTransform:'uppercase',letterSpacing:'.8px',marginTop:3}}>{label}</div>
                      </div>
                    ))}
                  </div>

                  {/* Per-lead results */}
                  <div style={{border:'1px solid var(--b)',borderRadius:'var(--r)',overflow:'hidden'}}>
                    <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
                      <thead>
                        <tr>
                          {['Company','Email','Status','Action'].map(h=>(
                            <th key={h} style={{padding:'8px 12px',textAlign:'left',fontFamily:'var(--mono)',fontSize:9,textTransform:'uppercase',letterSpacing:'.8px',color:'var(--ink3)',background:'var(--s2)',borderBottom:'1px solid var(--b)'}}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {validation.results.map((r:any)=>(
                          <tr key={r.id} style={{borderBottom:'1px solid var(--b)'}}>
                            <td style={{padding:'9px 12px'}}><strong>{r.company}</strong></td>
                            <td style={{padding:'9px 12px',fontFamily:'var(--mono)',fontSize:11,maxWidth:200,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{r.email||<span style={{color:'var(--ink4)',fontStyle:'italic'}}>—</span>}</td>
                            <td style={{padding:'9px 12px'}}>
                              <span style={{
                                fontFamily:'var(--mono)',fontSize:9,fontWeight:600,textTransform:'uppercase',
                                padding:'2px 8px',borderRadius:999,border:'1px solid',
                                color:r.status==='ready'?'var(--green)':r.status==='role'?'var(--yellow)':r.status==='missing'?'var(--ink4)':'var(--red)',
                                background:r.status==='ready'?'#16a34a10':r.status==='role'?'#d9770610':r.status==='missing'?'var(--s3)':'#E8414210',
                                borderColor:r.status==='ready'?'#16a34a30':r.status==='role'?'#d9770630':r.status==='missing'?'var(--b2)':'#E8414230',
                              }}>
                                {r.status==='ready'?'✓ Ready':r.status==='role'?'⚠ Role':r.status==='personal'?'✗ Personal':r.status==='edu'?'✗ Edu':r.status==='missing'?'○ Missing':'✗ Invalid'}
                              </span>
                            </td>
                            <td style={{padding:'9px 12px',fontSize:11,color:'var(--ink3)'}}>{r.willSend?<span style={{color:'var(--green)'}}>Will send</span>:<span style={{color:'var(--red)'}}>{r.reason}</span>}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* STEP 3 — SEND */}
            <div className="card">
              <div className="card-hd">
                <div className="ct">Step 2 — Send Campaign</div>
                <div className="btn-row">
                  <button className="btn btn-red"
                    onClick={runCampaign}
                    disabled={sending||!validation||validation.summary.willSend===0}>
                    {sending?`Sending... ${sendPct}%`:
                     !validation?'Validate first →':
                     `▶ Send to ${validation.summary.willSend} leads`}
                  </button>
                  <span style={{fontFamily:'var(--mono)',fontSize:10,color:'var(--ink3)'}}>{stats.sent} sent · {stats.replied} replied</span>
                </div>
              </div>

              {!validation&&(
                <div className="alert aw" style={{marginBottom:0}}>
                  <span className="alert-icon">⚠</span>
                  <div className="alert-body">
                    <div className="alert-title">Run validation before sending</div>
                    Sending without validation caused the previous spam block. PrivateEmail blocks bulk sends to personal/invalid addresses.
                  </div>
                </div>
              )}

              {sending&&(
                <div className="pgwrap">
                  <div className="pglbl"><span>Sending...</span><span>{sendPct}%</span></div>
                  <div className="pgbar"><div className="pgfill" style={{width:`${sendPct}%`}}/></div>
                </div>
              )}

              {/* System checklist */}
              <div className="cklist" style={{marginTop:16}}>
                {[
                  {lbl:'Airtable connected',ok:health?.airtable?.ok??false,soft:false},
                  {lbl:'PrivateEmail SMTP verified',ok:health?.smtp?.ok??false,soft:!!health?.env?.smtpEmail&&!health?.smtp?.ok},
                  {lbl:'Emails generated',ok:stats.hasEmail>0,soft:false},
                  {lbl:'Validation complete',ok:!!validation,soft:false},
                  {lbl:`${validation?.summary?.willSend??0} leads cleared for sending`,ok:(validation?.summary?.willSend??0)>0,soft:false},
                ].map(({lbl,ok,soft}:{lbl:string,ok:boolean,soft:boolean})=>(
                  <div key={lbl} className="crow">
                    <span className="ci" style={{color:ok?'var(--green)':soft?'var(--yellow)':'var(--ink4)'}}>{ok?'✓':soft?'⚠':'○'}</span>
                    <span style={{color:ok?'var(--ink)':'var(--ink3)'}}>{lbl}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* SPAM TIPS */}
            <div className="card" style={{background:'var(--s2)'}}>
              <div className="ct" style={{marginBottom:12}}>Improving Deliverability</div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
                {[
                  {ico:'✗',title:'Blocked — use Hunter.io/Apollo to replace',items:['Personal emails (Gmail, Hey, Outlook)','Education emails (.edu)','Generic inferred emails for unknown contacts']},
                  {ico:'✓',title:'Best practices to avoid spam filters',items:['Warm up domain — send 5–10 manual emails first','Space sends 45s apart (already enforced)','Each email has HTML + plain text (already done)','Unsubscribe link in every email (already added)']},
                ].map(({ico,title,items})=>(
                  <div key={title} style={{padding:'14px 16px',background:'var(--s1)',borderRadius:'var(--r)',border:'1px solid var(--b)'}}>
                    <div style={{fontFamily:'var(--mono)',fontSize:10,fontWeight:600,textTransform:'uppercase',letterSpacing:'1px',color:'var(--ink3)',marginBottom:10}}>{ico} {title}</div>
                    {items.map(item=>(
                      <div key={item} style={{fontSize:11,color:'var(--ink3)',padding:'3px 0',display:'flex',gap:8,alignItems:'flex-start'}}>
                        <span style={{color:'var(--ink4)',flexShrink:0}}>·</span>{item}
                      </div>
                    ))}
                  </div>
                ))}
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
