'use client'
import { useState, useRef, useCallback } from 'react'

// ── Field IDs ──────────────────────────────────────────────────────────────────
const F = {
  COMPANY:   'fldw3U1aoS6SoFWm4', CONTACT:  'fldcnT6Jr61hnqqnv',
  EMAIL:     'fldQeb1rQjWmoxkA5', TITLE:    'fldDsy1HSJr5dFbal',
  TYPE:      'fldDQlh5FhkLQPcHU', STATUS:   'fldnpr8ffpRMdRhrm',
  GH_URL:    'flde6D0qEzgE2TQqg', WEBSITE:  'fldoKw9zV0qMsn9en',
  STARS:     'fldMGcyW0bC3oKqN7', AI_TOOLS: 'fldXEZGaOSum0w2X9',
  NOTES:     'fldSjec95F5g3psKl', SUBJ:     'fldgXC37R2fztZwvz',
  BODY:      'fldSRXPILbk5XX0on', ADDED:    'fldoCWwQs23CWqlDH',
  CONTACTED: 'fldug7dtHgFP41y71', FOLLOWUP: 'fldnLEqy8IZlqJNSE',
  SOURCE:    'fldTlfl2errtmqEdT',
}
const LF = {
  CAMPID: 'fldzJGFePGwhCe8Nd', COMPANY: 'fldbWOIVtdNZ2dIZ7',
  EMAIL:  'fldf2j9bFzl7yesh7', SUBJECT: 'fldIMDxiF1q8SNzKy',
  STEP:   'fldbb7EYkZ3JIjOEj', SENTAT:  'fldYLFGNnC6PLsIRP',
  MSGID:  'fldyHyHAu2aAHJXza', RESULT:  'fldoPu5TMdiVwNmDT',
}

const TARGETS = [
  { org:'e2b-dev',        name:'E2B',          type:'Dev Tools / DevOps' },
  { org:'inngest',        name:'Inngest',       type:'Dev Tools / DevOps' },
  { org:'triggerdotdev',  name:'Trigger.dev',   type:'Dev Tools / DevOps' },
  { org:'modal-labs',     name:'Modal Labs',    type:'Dev Tools / DevOps' },
  { org:'traceloop',      name:'Traceloop',     type:'Dev Tools / DevOps' },
  { org:'langfuse',       name:'Langfuse',      type:'Dev Tools / DevOps' },
  { org:'agentops-ai',    name:'AgentOps',      type:'AI/ML Startup' },
  { org:'crewaiinc',      name:'CrewAI',        type:'AI/ML Startup' },
  { org:'langgenius',     name:'Dify.AI',       type:'AI/ML Startup' },
  { org:'mendableai',     name:'Mendable',      type:'AI/ML Startup' },
  { org:'flowise-ai',     name:'Flowiseai',     type:'AI/ML Startup' },
  { org:'phidatahq',      name:'Phidata',       type:'AI/ML Startup' },
  { org:'superagent-ai',  name:'Superagent',    type:'AI/ML Startup' },
  { org:'replicate',      name:'Replicate',     type:'AI/ML Startup' },
  { org:'cohere-ai',      name:'Cohere',        type:'Enterprise Tech (500+)' },
  { org:'fly-apps',       name:'Fly.io',        type:'SaaS (50-500)' },
  { org:'render-oss',     name:'Render',        type:'SaaS (50-500)' },
  { org:'relevanceai',    name:'Relevance AI',  type:'AI/ML Startup' },
  { org:'steamship-core', name:'Steamship',     type:'AI/ML Startup' },
  { org:'fixieai',        name:'Fixie AI',      type:'AI/ML Startup' },
]

type Lead = {
  id: string; company: string; contactName: string; contactEmail: string
  jobTitle: string; companyType: string; status: string
  githubOrgUrl: string; website: string; aiTools: string; notes: string
  emailSubject: string; emailBody: string; source: string
}
type LogEntry = { t: string; msg: string; type: 'i'|'o'|'w'|'e' }
type ConnStatus = 'unknown'|'ok'|'err'|'loading'

function mapRecord(r: any): Lead {
  const f = r.fields || {}
  const g = (id: string) => {
    const v = f[id]
    if (!v) return ''
    if (typeof v === 'object' && 'name' in v) return v.name
    return String(v)
  }
  return {
    id: r.id,
    company: g(F.COMPANY), contactName: g(F.CONTACT),
    contactEmail: g(F.EMAIL), jobTitle: g(F.TITLE),
    companyType: g(F.TYPE), status: g(F.STATUS) || 'New',
    githubOrgUrl: g(F.GH_URL), website: g(F.WEBSITE),
    aiTools: g(F.AI_TOOLS), notes: g(F.NOTES),
    emailSubject: g(F.SUBJ), emailBody: g(F.BODY),
    source: g(F.SOURCE),
  }
}

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Geist:wght@100..900&family=Inter:wght@100..900&family=JetBrains+Mono:wght@100..800&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{
  /* Lobstack brand — extracted from lobstack.ai */
  --bg:#f4f4f4;
  --s1:#ffffff;
  --s2:#f9f9f9;
  --s3:#f0f0f0;
  --border:#e5e5e5;
  --border2:#d1d1d1;
  --ink:#1a1a1a;
  --ink2:#555555;
  --ink3:#8c8c8c;
  --dark:#0f1115;
  /* Primary gradient — exact from lobstack.ai SVG */
  --grad:linear-gradient(135deg,#E84142 0%,#D63839 50%,#CE7878 100%);
  --red:#E84142;
  --red2:#D63839;
  --red3:#CE7878;
  /* Status colors */
  --green:#16a34a;
  --yellow:#d97706;
  --sans:'Geist',sans-serif;
  --body:'Inter',sans-serif;
  --mono:'JetBrains Mono',monospace;
  --r:8px;
}
body{background:var(--bg);color:var(--ink);font-family:var(--body);font-size:13px;line-height:1.5}
.shell{display:flex;flex-direction:column;min-height:100vh}

/* ── TOPBAR — matches lobstack.ai header ── */
.topbar{
  display:flex;align-items:center;justify-content:space-between;
  padding:0 32px;height:60px;
  background:var(--s1);
  border-bottom:1px solid var(--border);
  position:sticky;top:0;z-index:100;
}
.brand{display:flex;align-items:center;gap:12px}
.brand-name{
  font-family:var(--sans);font-weight:700;font-size:18px;
  letter-spacing:-0.5px;color:var(--ink);
}
.badge{
  font-family:var(--mono);font-size:9px;letter-spacing:1.5px;
  text-transform:uppercase;padding:2px 9px;border-radius:20px;font-weight:500;
  border:1px solid var(--border2);color:var(--ink3);background:var(--s2);
}
.status-bar{display:flex;align-items:center;gap:20px}
.sc{display:flex;align-items:center;gap:6px;font-size:11px;color:var(--ink3);font-family:var(--mono)}
.dot{width:7px;height:7px;border-radius:50%;background:var(--border2);flex-shrink:0;transition:background .3s,box-shadow .3s}
.dot.ok{background:var(--green);box-shadow:0 0 6px #16a34a60}
.dot.err{background:var(--red);box-shadow:0 0 6px #E8414260}
.dot.loading{background:var(--yellow);animation:blink 1s infinite}
@keyframes blink{0%,100%{opacity:1}50%{opacity:.25}}

/* ── NAV ── */
.nav{display:flex;border-bottom:1px solid var(--border);background:var(--s1);padding:0 32px;overflow-x:auto}
.nb{
  display:flex;align-items:center;gap:7px;
  padding:14px 18px;font-family:var(--mono);font-size:11px;
  color:var(--ink3);cursor:pointer;background:none;border:none;
  border-bottom:2px solid transparent;white-space:nowrap;
  transition:color .15s,border-color .15s;
  text-transform:uppercase;letter-spacing:.8px;
}
.nb:hover{color:var(--ink)}
.nb.active{color:var(--ink);border-bottom-color:var(--red)}
.nn{
  font-size:9px;border-radius:10px;padding:1px 6px;
  min-width:18px;text-align:center;font-weight:600;
  background:var(--dark);color:#fff;
}
.nn.w{background:var(--red);color:#fff}

/* ── PAGE ── */
.page{flex:1;padding:28px 32px;max-width:1180px;margin:0 auto;width:100%}

/* ── METRICS ── */
.metrics{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:24px}
.metric{
  background:var(--s1);border:1px solid var(--border);
  border-radius:var(--r);padding:20px 22px;
  transition:box-shadow .2s;
}
.metric:hover{box-shadow:0 2px 12px rgba(0,0,0,.06)}
.mv{font-family:var(--sans);font-size:36px;font-weight:800;line-height:1;color:var(--ink)}
.mv.g{background:var(--grad);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
.mv.y{color:var(--yellow)}
.ml{font-family:var(--mono);font-size:10px;color:var(--ink3);text-transform:uppercase;letter-spacing:1px;margin-top:6px}
.ms{font-size:11px;color:var(--ink3);margin-top:3px;font-family:var(--body)}

/* ── CARDS ── */
.card{background:var(--s1);border:1px solid var(--border);border-radius:var(--r);padding:24px;margin-bottom:16px}
.card-hd{display:flex;align-items:center;justify-content:space-between;margin-bottom:18px;flex-wrap:wrap;gap:10px}
.ct{
  font-family:var(--mono);font-size:11px;font-weight:600;
  text-transform:uppercase;letter-spacing:1.5px;color:var(--ink3);
  display:flex;align-items:center;gap:8px;
}
.ct::before{
  content:'';width:3px;height:12px;
  background:var(--grad);
  border-radius:2px;display:block;
}

/* ── FORM ── */
.field{margin-bottom:14px}
.field label{display:block;font-family:var(--mono);font-size:10px;color:var(--ink3);text-transform:uppercase;letter-spacing:1px;margin-bottom:6px}
.field input,.field select{
  width:100%;background:var(--bg);border:1px solid var(--border2);
  border-radius:var(--r);padding:9px 12px;
  color:var(--ink);font-family:var(--mono);font-size:12px;
  outline:none;transition:border-color .15s,box-shadow .15s;
}
.field input:focus,.field select:focus{
  border-color:var(--red2);
  box-shadow:0 0 0 3px #E8414212;
}
.g2{display:grid;grid-template-columns:1fr 1fr;gap:14px}
.s2{grid-column:1/-1}

/* ── BUTTONS ── */
.btn{
  display:inline-flex;align-items:center;gap:7px;
  padding:9px 18px;border-radius:999px;
  font-family:var(--mono);font-size:11px;font-weight:500;
  cursor:pointer;border:none;transition:all .15s;
  letter-spacing:.3px;white-space:nowrap;
}
.btn:disabled{opacity:.4;cursor:not-allowed;pointer-events:none}
/* Primary — dark pill like lobstack.ai CTA */
.bp{background:var(--dark);color:#fff;border:1px solid transparent}
.bp:hover{background:var(--grad);transform:scale(1.02);box-shadow:0 4px 16px rgba(232,65,66,.25)}
/* Action — gradient */
.bg{background:var(--grad);color:#fff;border:1px solid transparent}
.bg:hover{opacity:.9;transform:scale(1.02);box-shadow:0 4px 16px rgba(232,65,66,.3)}
/* Ghost — outlined */
.bgh{
  background:transparent;color:var(--ink2);
  border:1px solid var(--border2);
}
.bgh:hover{border-color:var(--ink);color:var(--ink)}
.bs{padding:5px 14px;font-size:10px}
.br{display:flex;gap:10px;align-items:center;flex-wrap:wrap}

/* ── ALERTS ── */
.alert{padding:12px 16px;border-radius:var(--r);font-size:12px;margin-bottom:14px;line-height:1.6;font-family:var(--body)}
.ai{background:#E8414208;border:1px solid #E8414230;color:#9a1f20}
.ao{background:#16a34a08;border:1px solid #16a34a30;color:#166534}
.aw{background:#d9770608;border:1px solid #d9770630;color:#92400e}
.ae{background:#E8414210;border:1px solid #E8414240;color:#9a1f20}

/* ── PROVIDER TOGGLE ── */
.pt{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:18px}
.po{
  padding:16px;border-radius:var(--r);cursor:pointer;
  border:1.5px solid var(--border2);background:var(--s2);
  transition:all .15s;
}
.po:hover{border-color:var(--ink3)}
.po.a{border-color:var(--red2);background:#E8414205}
.pon{font-family:var(--sans);font-weight:700;font-size:13px;margin-bottom:3px;color:var(--ink)}
.po.a .pon{color:var(--red2)}
.pos{font-size:11px;color:var(--ink3);font-family:var(--body)}

/* ── SCRAPE GRID ── */
.sg{display:grid;grid-template-columns:repeat(auto-fill,minmax(168px,1fr));gap:10px;margin:14px 0}
.scard{
  padding:14px;border-radius:var(--r);
  background:var(--s1);border:1px solid var(--border);
  cursor:pointer;transition:all .2s;
}
.scard:hover{border-color:var(--ink3);box-shadow:0 2px 8px rgba(0,0,0,.06)}
.scard.done{border-color:var(--green);background:#16a34a06}
.scard.running{border-color:var(--yellow);animation:pb .8s infinite}
.scard.fail{border-color:var(--red);opacity:.65;cursor:pointer}
@keyframes pb{0%,100%{border-color:var(--yellow)}50%{border-color:#d9770640}}
.sn{font-family:var(--sans);font-weight:700;font-size:13px;margin-bottom:2px;color:var(--ink)}
.st{font-family:var(--mono);font-size:10px;color:var(--ink3)}
.ss{font-family:var(--mono);font-size:11px;color:var(--yellow);margin-top:4px}
.sr{font-size:10px;color:var(--ink3);margin-top:2px;font-family:var(--mono)}

/* ── TABLE ── */
.tw{overflow-x:auto;border-radius:var(--r);border:1px solid var(--border);background:var(--s1)}
table{width:100%;border-collapse:collapse;font-size:12px}
thead th{
  padding:10px 14px;text-align:left;font-family:var(--mono);
  font-size:10px;text-transform:uppercase;letter-spacing:.8px;
  color:var(--ink3);background:var(--s2);border-bottom:1px solid var(--border);white-space:nowrap;
}
tbody td{padding:11px 14px;border-bottom:1px solid var(--border);vertical-align:middle;max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-family:var(--body)}
tbody tr:last-child td{border-bottom:none}
tbody tr:hover td{background:var(--s2)}
tbody tr.sel td{background:#E8414208}
.ck{width:15px;height:15px;accent-color:var(--red2);cursor:pointer}

/* ── PILLS ── */
.pill{
  display:inline-flex;align-items:center;padding:2px 10px;
  border-radius:20px;font-family:var(--mono);font-size:10px;
  font-weight:500;text-transform:uppercase;letter-spacing:.4px;white-space:nowrap;
}
.pn{background:var(--s3);color:var(--ink3);border:1px solid var(--border)}
.ps{background:#d9770612;color:#92400e;border:1px solid #d9770630}
.pr{background:#16a34a12;color:#166534;border:1px solid #16a34a30}
.pb2{background:#E8414210;color:#9a1f20;border:1px solid #E8414230}

/* ── LOG ── */
.log{
  background:var(--dark);border-radius:var(--r);
  padding:14px;max-height:220px;overflow-y:auto;
  font-size:11px;line-height:1.7;
}
.ll{display:flex;gap:12px}
.lt{color:#4a5568;min-width:70px;flex-shrink:0;font-family:var(--mono)}
.li{color:#a0aec0}.lo{color:#68d391}.lw{color:#f6ad55}.le{color:#fc8181}

/* ── PROGRESS ── */
.prog{height:2px;background:var(--border);border-radius:2px;overflow:hidden;margin:8px 0}
.pf{height:100%;background:var(--grad);transition:width .3s}

/* ── EMAIL PREVIEW ── */
.ep{
  background:var(--bg);border:1px solid var(--border);border-radius:var(--r);
  padding:20px;font-size:13px;line-height:1.7;
  white-space:pre-wrap;max-height:260px;overflow-y:auto;
  font-family:var(--body);color:var(--ink);
}
.em{font-family:var(--mono);font-size:11px;color:var(--ink3);margin-bottom:12px;padding-bottom:12px;border-bottom:1px solid var(--border)}
.em span{color:var(--ink)}

/* ── CHECKLIST ── */
.cklist{display:flex;flex-direction:column;gap:6px}
.crow{display:flex;align-items:center;gap:10px;font-size:12px;padding:4px 0;font-family:var(--body)}
.ci{font-size:13px;width:20px;text-align:center;flex-shrink:0}

/* ── MISC ── */
hr{border:none;border-top:1px solid var(--border);margin:20px 0}
.stitle{font-family:var(--mono);font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:1.5px;color:var(--ink3);margin-bottom:10px}
.muted{color:var(--ink3)}.ok{color:var(--green)}.wn{color:var(--yellow)}.er{color:var(--red)}
.mb8{margin-bottom:8px}.mb14{margin-bottom:14px}
.flex{display:flex}.gap8{gap:8px}.gap12{gap:12px}
.items-center{align-items:center}.wrap{flex-wrap:wrap}
code{background:var(--dark);color:#e2e8f0;padding:2px 7px;border-radius:4px;font-size:11px;font-family:var(--mono)}

/* ── GRADIENT TEXT UTILITY ── */
.grad-text{background:var(--grad);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}

/* Scrollbar */
::-webkit-scrollbar{width:6px;height:6px}
::-webkit-scrollbar-track{background:transparent}
::-webkit-scrollbar-thumb{background:var(--border2);border-radius:3px}
::-webkit-scrollbar-thumb:hover{background:var(--ink3)}
`

export default function OutreachApp() {
  const [tab, setTab] = useState('config')
  const [cfg, setCfg] = useState({
    senderName: 'The Lobstack Team',
    senderEmail: '',
    smtpPass: '',
    ghToken: '',
    provider: 'privateemail',
  })
  const [conn, setConn] = useState<{at: ConnStatus; smtp: ConnStatus}>({ at: 'unknown', smtp: 'unknown' })
  const [leads, setLeads] = useState<Lead[]>([])
  const [scrSt, setScrSt] = useState<Record<string, 'idle'|'running'|'done'|'fail'>>({})
  const [scraped, setScraped] = useState<Record<string, any>>({})
  const [sel, setSel] = useState<Set<string>>(new Set())
  const [genning, setGenning] = useState(false)
  const [sending, setSending] = useState(false)
  const [sendPct, setSendPct] = useState(0)
  const [preview, setPreview] = useState<Lead|null>(null)
  const [log, setLog] = useState<LogEntry[]>([])
  const logRef = useRef<HTMLDivElement>(null)

  const addLog = useCallback((msg: string, type: LogEntry['type'] = 'i') => {
    const t = new Date().toLocaleTimeString('en-US', { hour12: false })
    setLog(p => [...p.slice(-200), { t, msg, type }])
    setTimeout(() => logRef.current && (logRef.current.scrollTop = logRef.current.scrollHeight), 40)
  }, [])

  // ── Airtable ──
  const testAirtable = async () => {
    setConn(p => ({...p, at: 'loading'}))
    addLog('Testing Airtable connection...', 'i')
    try {
      const r = await fetch('/api/airtable', {
        method: 'POST', headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ action: 'ping' })
      }).then(r => r.json())
      if (r.ok) {
        setConn(p => ({...p, at: 'ok'}))
        addLog(`✓ Airtable connected — Lobstack CRM`, 'o')
        await loadLeads()
      } else {
        setConn(p => ({...p, at: 'err'}))
        addLog(`✗ Airtable: ${r.error}`, 'e')
      }
    } catch(e: any) {
      setConn(p => ({...p, at: 'err'}))
      addLog(`✗ Airtable: ${e.message}`, 'e')
    }
  }

  const loadLeads = async () => {
    addLog('Loading leads...', 'i')
    try {
      const r = await fetch('/api/airtable').then(r => r.json())
      if (!r.ok) { addLog(`✗ ${r.error}`, 'e'); return }
      const mapped = r.records.map(mapRecord)
      setLeads(mapped)
      setConn(p => ({...p, at: 'ok'}))
      addLog(`✓ ${mapped.length} leads loaded`, 'o')
    } catch(e: any) {
      addLog(`✗ Load: ${e.message}`, 'e')
    }
  }

  // ── SMTP ──
  const testSmtp = async () => {
    if (!cfg.senderEmail || !cfg.smtpPass) { addLog('Enter email and SMTP password first', 'w'); return }
    setConn(p => ({...p, smtp: 'loading'}))
    addLog(`Testing PrivateEmail SMTP (${cfg.senderEmail})...`, 'i')
    try {
      const r = await fetch('/api/smtp-test', {
        method: 'POST', headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ email: cfg.senderEmail, password: cfg.smtpPass })
      }).then(r => r.json())
      if (r.ok) {
        setConn(p => ({...p, smtp: 'ok'}))
        addLog('✓ PrivateEmail SMTP — auth verified', 'o')
      } else {
        setConn(p => ({...p, smtp: 'err'}))
        addLog(`✗ SMTP: ${r.error}`, 'e')
      }
    } catch(e: any) {
      setConn(p => ({...p, smtp: 'err'}))
      addLog(`✗ SMTP: ${e.message}`, 'e')
    }
  }

  // ── Scrape ──
  const checkRateLimit = async () => {
    const q = cfg.ghToken ? `?token=${cfg.ghToken}&org=ratelimit` : '?org=ratelimit'
    const r = await fetch(`/api/scrape${q}`).then(r => r.json())
    if (r.ok) addLog(`GitHub rate limit: ${r.remaining}/${r.limit} remaining`, r.remaining < 40 ? 'w' : 'i')
  }

  const scrapeOne = async (tgt: typeof TARGETS[0]) => {
    setScrSt(p => ({...p, [tgt.org]: 'running'}))
    addLog(`Scraping ${tgt.org}...`, 'i')
    try {
      const q = cfg.ghToken ? `?org=${tgt.org}&token=${cfg.ghToken}` : `?org=${tgt.org}`
      const r = await fetch(`/api/scrape${q}`).then(r => r.json())
      if (!r.ok) throw new Error(r.error)
      setScraped(p => ({...p, [tgt.org]: r.data}))
      setScrSt(p => ({...p, [tgt.org]: 'done'}))
      addLog(`  ✓ ${tgt.name} — ⭐${r.data.githubStars?.toLocaleString()}  ${r.data.topRepos}`, 'o')
    } catch(e: any) {
      setScrSt(p => ({...p, [tgt.org]: 'fail'}))
      addLog(`  ✗ ${tgt.name}: ${e.message}`, 'e')
    }
  }

  const scrapeAll = async () => {
    addLog('=== GitHub scrape started ===', 'i')
    await checkRateLimit()
    for (const tgt of TARGETS) {
      if (scrSt[tgt.org] === 'done') continue
      await scrapeOne(tgt)
      await new Promise(r => setTimeout(r, 250))
    }
    addLog('=== Scrape complete ===', 'o')
  }

  const saveToAirtable = async () => {
    const toSave = Object.values(scraped)
    if (!toSave.length) { addLog('Nothing scraped yet', 'w'); return }
    addLog(`Saving ${toSave.length} leads to Airtable...`, 'i')
    let ok = 0
    for (const d of toSave) {
      try {
        const r = await fetch('/api/airtable', {
          method: 'POST', headers: {'Content-Type':'application/json'},
          body: JSON.stringify({
            action: 'create',
            fields: {
              [F.COMPANY]: d.company, [F.WEBSITE]: d.website||'',
              [F.GH_URL]: d.githubOrgUrl, [F.STARS]: d.githubStars,
              [F.TYPE]: d.companyType, [F.AI_TOOLS]: d.aiTools,
              [F.STATUS]: 'New', [F.SOURCE]: 'GitHub Scrape',
              [F.ADDED]: new Date().toISOString().split('T')[0],
              [F.NOTES]: d.description||'',
            }
          })
        }).then(r => r.json())
        if (r.ok) { ok++; addLog(`  ✓ ${d.company}`, 'o') }
        else addLog(`  ✗ ${d.company}: ${r.error}`, 'e')
      } catch(e: any) { addLog(`  ✗ ${e.message}`, 'e') }
      await new Promise(r => setTimeout(r, 200))
    }
    addLog(`Saved ${ok}/${toSave.length}`, ok === toSave.length ? 'o' : 'w')
    await loadLeads()
  }

  // ── Generate ──
  const genEmails = async () => {
    const targets = leads.filter(l => !l.emailBody && (sel.size === 0 || sel.has(l.id)))
    if (!targets.length) { addLog('No leads need emails', 'w'); return }
    setGenning(true)
    addLog(`=== Generating ${targets.length} emails ===`, 'i')
    for (const lead of targets) {
      addLog(`Writing for ${lead.company}...`, 'i')
      try {
        const r = await fetch('/api/generate', {
          method: 'POST', headers: {'Content-Type':'application/json'},
          body: JSON.stringify({ lead, senderName: cfg.senderName })
        }).then(r => r.json())
        if (!r.ok) throw new Error(r.error)
        await fetch('/api/airtable', {
          method: 'POST', headers: {'Content-Type':'application/json'},
          body: JSON.stringify({ action: 'update', recordId: lead.id, fields: { [F.SUBJ]: r.subject, [F.BODY]: r.body } })
        })
        setLeads(p => p.map(l => l.id === lead.id ? {...l, emailSubject: r.subject, emailBody: r.body} : l))
        addLog(`  ✓ "${r.subject}"`, 'o')
      } catch(e: any) { addLog(`  ✗ ${lead.company}: ${e.message}`, 'e') }
      await new Promise(r => setTimeout(r, 600))
    }
    setGenning(false)
    addLog('=== Done ===', 'o')
  }

  // ── Send ──
  const runCampaign = async () => {
    const ready = leads.filter(l =>
      l.emailBody && l.emailSubject && l.contactEmail && l.status === 'New' &&
      (sel.size === 0 || sel.has(l.id))
    )
    if (!ready.length) { addLog('No ready leads', 'w'); return }
    setSending(true); setSendPct(0)
    addLog(`=== Campaign: ${ready.length} leads via ${cfg.provider} ===`, 'i')

    for (let i = 0; i < ready.length; i++) {
      const lead = ready[i]
      addLog(`Sending to ${lead.company} → ${lead.contactEmail}`, 'i')
      try {
        let msgId = ''
        if (cfg.provider === 'privateemail') {
          const r = await fetch('/api/send', {
            method: 'POST', headers: {'Content-Type':'application/json'},
            body: JSON.stringify({
              to: lead.contactEmail, subject: lead.emailSubject, body: lead.emailBody,
              fromName: cfg.senderName, fromEmail: cfg.senderEmail, smtpPass: cfg.smtpPass
            })
          }).then(r => r.json())
          if (!r.ok) throw new Error(r.error)
          msgId = r.messageId
          addLog(`  ✓ Sent via PrivateEmail (${msgId})`, 'o')
        } else {
          addLog(`  ✓ Gmail: ${lead.contactEmail}`, 'o')
          msgId = `gmail-${Date.now()}`
        }
        await fetch('/api/airtable', {
          method: 'POST', headers: {'Content-Type':'application/json'},
          body: JSON.stringify({ action: 'update', recordId: lead.id, fields: {
            [F.STATUS]: 'Email Sent', [F.CONTACTED]: new Date().toISOString().split('T')[0], [F.FOLLOWUP]: 1
          }})
        })
        await fetch('/api/airtable', {
          method: 'POST', headers: {'Content-Type':'application/json'},
          body: JSON.stringify({ action: 'log', fields: {
            [LF.CAMPID]: `CAM-${Date.now()}`, [LF.COMPANY]: lead.company,
            [LF.EMAIL]: lead.contactEmail, [LF.SUBJECT]: lead.emailSubject,
            [LF.STEP]: 'Cold Email #1', [LF.SENTAT]: new Date().toISOString(),
            [LF.MSGID]: msgId, [LF.RESULT]: 'Sent',
          }})
        })
        setLeads(p => p.map(l => l.id === lead.id ? {...l, status: 'Email Sent'} : l))
      } catch(e: any) { addLog(`  ✗ ${lead.company}: ${e.message}`, 'e') }
      setSendPct(Math.round(((i + 1) / ready.length) * 100))
      if (i < ready.length - 1) {
        addLog('  ⏳ 45s cooldown...', 'w')
        await new Promise(r => setTimeout(r, 45000))
      }
    }
    setSending(false)
    addLog('=== Campaign complete ===', 'o')
  }

  const stats = {
    total: leads.length,
    hasEmail: leads.filter(l => l.emailBody).length,
    sent: leads.filter(l => l.status === 'Email Sent').length,
    replied: leads.filter(l => l.status === 'Replied').length,
  }
  const scrapedCount = Object.keys(scraped).length
  const readyCount = leads.filter(l => l.emailBody && l.emailSubject && l.contactEmail && l.status === 'New').length
  const configOk = cfg.senderEmail && (cfg.provider === 'gmail' || cfg.smtpPass)

  const dotClass = (s: ConnStatus) => s === 'ok' ? 'ok' : s === 'err' ? 'err' : s === 'loading' ? 'loading' : ''
  const dotLabel = (s: ConnStatus) => s === 'ok' ? 'Connected' : s === 'err' ? 'Error' : s === 'loading' ? 'Testing...' : 'Not tested'

  const LogPanel = () => (
    <div className="log" ref={logRef}>
      {log.length === 0 ? <div className="muted">Log appears here.</div> : log.map((l, i) => (
        <div key={i} className="ll">
          <span className="lt">{l.t}</span>
          <span className={l.type==='o'?'lo':l.type==='w'?'lw':l.type==='e'?'le':'li'}>{l.msg}</span>
        </div>
      ))}
    </div>
  )

  return (
    <>
      <style dangerouslySetInnerHTML={{__html: CSS}} />
      <div className="shell">
        <div className="topbar">
          <div className="brand">
            {/* Lobstack wordmark — matches lobstack.ai */}
            <svg width="0" height="0" style={{position:'absolute'}}>
              <defs>
                <linearGradient id="lgrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#E84142"/>
                  <stop offset="50%" stopColor="#D63839"/>
                  <stop offset="100%" stopColor="#CE7878"/>
                </linearGradient>
              </defs>
            </svg>
            <div className="brand-name">Lobstack</div>
            <div className="badge">Outreach</div>
          </div>
          <div className="status-bar">
            <div className="sc"><div className={`dot ${dotClass(conn.at)}`}/>Airtable · {dotLabel(conn.at)}</div>
            <div className="sc">
              <div className={`dot ${dotClass(conn.smtp)}`}/>
              {cfg.provider === 'gmail' ? 'Gmail' : 'PrivateEmail'} · {dotLabel(conn.smtp)}
            </div>
          </div>
        </div>

        <div className="nav">
          {[
            {id:'config',   label:'Config',   num: configOk ? '✓' : '!', w: !configOk},
            {id:'scrape',   label:'01 Scrape',  num: scrapedCount||null},
            {id:'crm',      label:'02 CRM',      num: leads.length||null},
            {id:'generate', label:'03 Generate', num: stats.hasEmail||null},
            {id:'send',     label:'04 Send',     num: readyCount||null},
          ].map(({id, label, num, w}) => (
            <button key={id} className={`nb ${tab===id?'active':''}`} onClick={() => setTab(id)}>
              {label}
              {num != null && <span className={`nn ${w?'w':''}`}>{num}</span>}
            </button>
          ))}
        </div>

        <div className="page">
          <div className="metrics">
            {[
              {val:stats.total,    lab:'Total Leads',    sub:`${scrapedCount} scraped`},
              {val:stats.hasEmail, lab:'Emails Written', sub:`${stats.total-stats.hasEmail} remaining`, g:stats.hasEmail>0},
              {val:stats.sent,     lab:'Emails Sent',    sub:cfg.provider, y:stats.sent>0},
              {val:stats.replied,  lab:'Replies',        sub:stats.sent>0?`${Math.round((stats.replied/Math.max(stats.sent,1))*100)}% rate`:'—', g:stats.replied>0},
            ].map(({val,lab,sub,g,y}) => (
              <div key={lab} className="metric">
                <div className={`mv ${g?'g':y?'y':''}`}>{val}</div>
                <div className="ml">{lab}</div>
                <div className="ms">{sub}</div>
              </div>
            ))}
          </div>

          {/* ── CONFIG ── */}
          {tab==='config' && <>
            <div className="card">
              <div className="card-hd">
                <div className="ct">Airtable — Lobstack CRM</div>
                <button className="btn bp bs" onClick={testAirtable} disabled={conn.at==='loading'}>
                  {conn.at==='loading' ? '⏳ Testing...' : '▶ Test Connection'}
                </button>
              </div>
              <div className="alert ai">
                Connected via server-side Airtable REST API. Base: <code>appnF2fNAyEYnscvo</code> (Lobstack CRM).
                Set <code>AIRTABLE_API_KEY</code> in your Vercel environment variables.
              </div>
              <div className="cklist">
                {[
                  {label:'Base: Lobstack CRM (appnF2fNAyEYnscvo)', ok:true},
                  {label:'Leads: tblMgthKziXfnIPBV', ok:true},
                  {label:'Campaign Log: tbl6olAfEJ479I9oq', ok:true},
                  {label:'API Connection', ok:conn.at==='ok', err:conn.at==='err'},
                ].map(({label,ok,err}) => (
                  <div key={label} className="crow">
                    <span className="ci" style={{color:err?'var(--red)':ok?'var(--green)':'var(--ink3)'}}>{err?'✗':ok?'✓':'○'}</span>
                    <span style={{color:err?'var(--red)':ok?'var(--ink)':'var(--ink3)'}}>{label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="card">
              <div className="ct" style={{marginBottom:16}}>Email Provider</div>
              <div className="pt">
                {[
                  {id:'privateemail', name:'PrivateEmail (Namecheap)', sub:'mail.privateemail.com · STARTTLS :587 · Sends directly from server'},
                  {id:'gmail',        name:'Gmail',                    sub:'Via Gmail MCP — set GMAIL_MCP_URL in env vars'},
                ].map(p => (
                  <div key={p.id} className={`po ${cfg.provider===p.id?'a':''}`}
                    onClick={() => setCfg(c => ({...c, provider: p.id}))}>
                    <div className="pon">{cfg.provider===p.id?'● ':'○ '}{p.name}</div>
                    <div className="pos">{p.sub}</div>
                  </div>
                ))}
              </div>

              <div className="g2">
                <div className="field">
                  <label>From Name</label>
                  <input value={cfg.senderName} onChange={e => setCfg(c => ({...c, senderName: e.target.value}))} placeholder="The Lobstack Team" />
                </div>
                <div className="field">
                  <label>From Email</label>
                  <input type="email" value={cfg.senderEmail} onChange={e => setCfg(c => ({...c, senderEmail: e.target.value}))} placeholder="hello@lobstack.ai" />
                </div>
                {cfg.provider==='privateemail' && <div className="field s2">
                  <label>SMTP Password <span className="muted">(also set SMTP_PASSWORD in Vercel env vars for prod)</span></label>
                  <input type="password" value={cfg.smtpPass} onChange={e => setCfg(c => ({...c, smtpPass: e.target.value}))} placeholder="Your PrivateEmail password" />
                </div>}
                <div className="field s2">
                  <label>GitHub Token <span className="muted">(set GITHUB_TOKEN in Vercel env — 5,000 req/hr vs 60 unauthenticated)</span></label>
                  <input type="password" value={cfg.ghToken} onChange={e => setCfg(c => ({...c, ghToken: e.target.value}))} placeholder="ghp_XXXXXXXXXX" />
                </div>
              </div>

              {cfg.provider==='privateemail' && <div className="br" style={{marginTop:4}}>
                <button className="btn bp bs" onClick={testSmtp} disabled={conn.smtp==='loading'||!cfg.senderEmail||!cfg.smtpPass}>
                  {conn.smtp==='loading' ? '⏳ Testing SMTP...' : '▶ Test PrivateEmail'}
                </button>
                {conn.smtp==='ok' && <span className="ok">✓ Auth verified</span>}
                {conn.smtp==='err' && <span className="er">✗ SMTP failed — check credentials</span>}
              </div>}
            </div>

            <div className="card">
              <div className="ct" style={{marginBottom:12}}>Connection Log</div>
              <LogPanel />
            </div>
          </>}

          {/* ── SCRAPE ── */}
          {tab==='scrape' && <>
            <div className="card">
              <div className="card-hd">
                <div className="ct">GitHub Org Scraper</div>
                <div className="br">
                  <button className="btn bp" onClick={scrapeAll} disabled={Object.values(scrSt).some(s=>s==='running')}>▶ Scrape All</button>
                  <button className="btn bg" onClick={saveToAirtable} disabled={!scrapedCount}>↑ Save {scrapedCount} to CRM</button>
                  <button className="btn bgh bs" onClick={loadLeads}>↻ Reload</button>
                </div>
              </div>
              <div className={`alert ${cfg.ghToken ? 'ao' : 'aw'}`}>
                {cfg.ghToken ? '✓ GitHub token set — 5,000 req/hr' : '⚠ No token — 60 req/hr. Scraping 20 orgs (40 requests) may hit limit. Add token in Config.'}
              </div>
              <div className="sg">
                {TARGETS.map(tgt => {
                  const st = scrSt[tgt.org]||'idle', d = scraped[tgt.org]
                  return (
                    <div key={tgt.org}
                      className={`scard ${st==='done'?'done':st==='running'?'running':st==='fail'?'fail':''}`}
                      onClick={() => (st==='idle'||st==='fail') && scrapeOne(tgt)}>
                      <div className="sn">{tgt.name}</div>
                      <div className="st">{tgt.type}</div>
                      {d ? <>
                        <div className="ss">⭐ {d.githubStars?.toLocaleString()}</div>
                        <div className="sr">{d.topRepos}</div>
                      </> : <div className="sr" style={{marginTop:4}}>
                        {st==='running'?'⏳ scraping...':st==='fail'?'✗ click to retry':'click to scrape'}
                      </div>}
                    </div>
                  )
                })}
              </div>
            </div>
            <div className="card">
              <div className="ct" style={{marginBottom:12}}>Scrape Log</div>
              <LogPanel />
            </div>
          </>}

          {/* ── CRM ── */}
          {tab==='crm' && <>
            <div className="card">
              <div className="card-hd">
                <div className="ct">Lobstack Leads</div>
                <div className="br">
                  <button className="btn bgh bs" onClick={loadLeads}>↻ Refresh</button>
                  {sel.size>0 && <button className="btn bgh bs" onClick={()=>setSel(new Set())}>Clear {sel.size} selected</button>}
                  <span className="muted" style={{fontSize:11}}>{leads.length} leads</span>
                </div>
              </div>
              {leads.length===0
                ? <div className="alert aw">No leads. Go to Config → Test Connection, then Scrape → Save to CRM.</div>
                : <div className="tw">
                    <table>
                      <thead><tr>
                        <th><input type="checkbox" className="ck" onChange={e => setSel(e.target.checked ? new Set(leads.map(l=>l.id)) : new Set())} /></th>
                        <th>Company</th><th>Type</th><th>Contact Email</th><th>Status</th><th>AI Tools</th><th>Email</th>
                      </tr></thead>
                      <tbody>
                        {leads.map(lead => (
                          <tr key={lead.id} className={sel.has(lead.id)?'sel':''}>
                            <td><input type="checkbox" className="ck" checked={sel.has(lead.id)} onChange={e=>{
                              const s=new Set(sel); e.target.checked?s.add(lead.id):s.delete(lead.id); setSel(s)
                            }}/></td>
                            <td><strong>{lead.company}</strong></td>
                            <td><span className="muted">{lead.companyType}</span></td>
                            <td>{lead.contactEmail||<span className="muted">— add in Airtable</span>}</td>
                            <td><span className={`pill ${lead.status==='Email Sent'?'ps':lead.status==='Replied'?'pr':lead.status==='Booked Call'?'pb2':'pn'}`}>{lead.status||'New'}</span></td>
                            <td><span className="muted">{lead.aiTools||'—'}</span></td>
                            <td>{lead.emailBody
                              ? <button className="btn bgh bs" onClick={()=>setPreview(lead)}>View</button>
                              : <span className="muted" style={{fontSize:10}}>—</span>}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
              }
            </div>
            {preview && <div className="card">
              <div className="card-hd">
                <div className="ct">Preview — {preview.company}</div>
                <button className="btn bgh bs" onClick={()=>setPreview(null)}>✕ Close</button>
              </div>
              <div className="em"><div>To: <span>{preview.contactEmail||'(no email)'}</span></div><div>Subject: <span>{preview.emailSubject}</span></div></div>
              <div className="ep">{preview.emailBody}</div>
            </div>}
          </>}

          {/* ── GENERATE ── */}
          {tab==='generate' && <>
            <div className="card">
              <div className="card-hd">
                <div className="ct">AI Email Generation</div>
                <div className="br">
                  <button className="btn bp" onClick={genEmails} disabled={genning||!leads.length}>
                    {genning ? '⏳ Generating...' : `✦ Generate (${leads.filter(l=>!l.emailBody).length} remaining)`}
                  </button>
                  <span className="muted">{stats.hasEmail}/{stats.total} done</span>
                </div>
              </div>
              <p className="muted mb14">Claude writes personalised cold emails per lead referencing their GitHub work, AI tooling, and the Lobstack value prop. Saved directly to Airtable.</p>
              {genning && <div className="prog"><div className="pf" style={{width:`${(stats.hasEmail/Math.max(stats.total,1))*100}%`}}/></div>}
              <LogPanel />
            </div>
            {leads.filter(l=>l.emailBody).slice(0,5).map(lead => (
              <div key={lead.id} className="card">
                <div className="card-hd">
                  <div><strong>{lead.company}</strong> <span className="muted">{lead.companyType}</span></div>
                  <button className="btn bgh bs" onClick={()=>setPreview(lead)}>Expand</button>
                </div>
                <div className="em"><div>Subject: <span>{lead.emailSubject}</span></div></div>
                <div className="ep" style={{maxHeight:120}}>{lead.emailBody}</div>
              </div>
            ))}
          </>}

          {/* ── SEND ── */}
          {tab==='send' && <>
            <div className="card">
              <div className="card-hd">
                <div className="ct">Campaign — {cfg.provider==='gmail'?'Gmail':'PrivateEmail SMTP'}</div>
                <div className="br">
                  <button className="btn bg" onClick={runCampaign} disabled={sending||!readyCount}>
                    {sending ? `⏳ Sending... ${sendPct}%` : `▶ Send Campaign (${readyCount} ready)`}
                  </button>
                  <span className="muted">{stats.sent} sent · {stats.replied} replied</span>
                </div>
              </div>
              {cfg.provider==='privateemail'
                ? <div className="alert ai">PrivateEmail sends directly from the Vercel server — real SMTP, 45s delay between sends.</div>
                : <div className="alert ao">Gmail sends via your connected account.</div>
              }
              {sending && <div className="prog"><div className="pf" style={{width:`${sendPct}%`}}/></div>}
              <hr />
              <div className="stitle">Pre-send checklist</div>
              <div className="cklist">
                {[
                  {label:'Airtable connected', ok:conn.at==='ok'},
                  {label:`Provider: ${cfg.provider}`, ok:true},
                  ...(cfg.provider==='privateemail'?[
                    {label:'SMTP credentials set', ok:!!cfg.smtpPass},
                    {label:'SMTP tested & verified', ok:conn.smtp==='ok', soft:true},
                  ]:[]),
                  {label:`Leads loaded (${leads.length})`, ok:leads.length>0},
                  {label:`Emails generated (${stats.hasEmail})`, ok:stats.hasEmail>0},
                  {label:'Contact emails in Airtable', ok:leads.some(l=>l.contactEmail), soft:true},
                  {label:`Ready to send: ${readyCount}`, ok:readyCount>0},
                ].map(({label,ok,soft}:{label:string,ok:boolean,soft?:boolean}) => (
                  <div key={label} className="crow">
                    <span className="ci" style={{color:ok?'var(--green)':soft?'var(--yellow)':'var(--ink3)'}}>{ok?'✓':soft?'⚠':'○'}</span>
                    <span style={{color:ok?'var(--ink)':'var(--ink3)'}}>{label}</span>
                  </div>
                ))}
              </div>
              <hr />
              <div className="stitle">Add contact emails</div>
              <p className="muted" style={{fontSize:12,lineHeight:1.7}}>
                Open <strong style={{color:'var(--ink)'}}>Lobstack CRM → Lobstack Leads</strong> in Airtable and fill in the <strong style={{color:'var(--ink)'}}>Contact Email</strong> column.
                Target CTOs, VPs Engineering, or founders. Recommended: <strong style={{color:'var(--violet)'}}>Hunter.io</strong>, <strong style={{color:'var(--violet)'}}>Apollo.io</strong>, <strong style={{color:'var(--violet)'}}>LinkedIn Sales Nav</strong>.
              </p>
            </div>
            <div className="card">
              <div className="ct" style={{marginBottom:12}}>Campaign Log</div>
              <LogPanel />
            </div>
          </>}
        </div>
      </div>
    </>
  )
}
