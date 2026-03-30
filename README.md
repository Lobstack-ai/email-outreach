<div align="center">

<svg width="72" height="72" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
  <polygon points="18,2 32,10 32,14 18,22 4,14 4,10" fill="#CE7878" opacity="0.55"/>
  <polygon points="18,8 32,16 32,20 18,28 4,20 4,16" fill="#D63839" opacity="0.75"/>
  <polygon points="18,14 32,22 32,26 18,34 4,26 4,22" fill="#E84142" opacity="1.0"/>
</svg>

# Lobstack Outreach

**Open-source autonomous B2B cold email engine**

Discover leads on GitHub · Score by signal · Find decision-maker emails · Generate human 3-part sequences with Claude · Send with warmup protection · Classify replies via IMAP · Reply from an Inbox tab · Get Discord alerts

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/Lobstack-ai/email-outreach)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org)
[![Powered by Claude](https://img.shields.io/badge/Claude-Sonnet%204-E84142)](https://anthropic.com)

[Live Demo](https://email-outreach-rosy.vercel.app) · [Report Bug](https://github.com/Lobstack-ai/email-outreach/issues) · [Request Feature](https://github.com/Lobstack-ai/email-outreach/issues)

</div>

---

## What this is

A complete, self-hosted B2B outbound system that runs entirely on Vercel — free tier included. Point it at GitHub, it finds companies actively building with AI, scores them by 8 signals, finds decision-maker contact emails (via GitHub + Hunter.io fallback), writes personalised 3-part cold email sequences using Claude Sonnet, validates and sends them from your own domain with warmup protection, then automatically fires follow-ups, classifies replies via IMAP, and pings you on Discord when something hot comes in.

Built for founders who want serious outbound without paying $500/mo for Apollo + Outreach + Clearbit combined.

---

## How it works

```
GitHub Search ──► Score ──► Find Emails ──► Generate 3-Part Sequence ──► Validate ──► Send
                                                                                        │
                                                              Warmup enforced: 10/day → 100/day
                                                                                        │
                                                         Vercel Cron runs daily at 9am UTC
                                                                                        │
                                                   Day 5: Auto FU1  ·  Day 12: Auto FU2
                                                                                        │
                                                         IMAP polls inbox for replies
                                                                                        │
                                            Claude classifies → Inbox tab → reply in 1 click
                                                                                        │
                                                         Discord alert fires instantly
```

---

## Features

### 🔍 Lead Discovery
- **Live GitHub search** across 15 rotating queries — finds orgs building AI agents, LLMs, MCP tools, vector databases, and dev infrastructure not already in your CRM
- Queries rotate by hour slot so consecutive runs surface fresh results
- **0–100 lead scoring** from stars, forks, watchers, member count, contributors, open issues, contact availability, and website presence
- **Filter bar** — sort by any signal, set min thresholds, toggle "has email only" before enriching

### 👤 Contact Enrichment
- Fetches org members, scores by bio keywords (CTO, founder, VP Engineering, CEO)
- Checks GitHub public email → marked as "GitHub public"
- Falls back to domain pattern inference (`first@`, `first.last@`, `flast@`)
- **Hunter.io fallback** — when `HUNTER_API_KEY` is set, automatically calls Hunter.io domain search if GitHub yields no email. Returns Hunter-verified results with seniority scoring.
- `Email Confidence` field in Airtable tracks source: GitHub public / Hunter verified / Pattern inferred / Org contact

### ✉️ AI Email Generation (Claude Sonnet 4)
Generates a full 3-part sequence per lead in one API call. Hard rules baked into the system prompt:

| Email | Timing | Notes |
|-------|--------|-------|
| Cold email | Day 1 | Opens with a specific repo observation. Primary CTA: call. Secondary: `lobstack.ai`. |
| Follow-up 1 | Day 5 | 2–3 sentences, new angle, specific offer tied to their stack |
| Breakup email | Day 12 | 2 sentences, graceful exit, one final insight |

**What the system prompt prohibits:** dashes as connectors (`—`), starting sentences with "I", "hope this finds you well", "touching base", "synergy", "pain points", "streamline", "leverage", ALL CAPS, sentences over 20 words. Emails never give two equal choices — primary CTA is always a meeting.

**Regen All** button regenerates all existing sequences using the latest prompt in one click, processing 8 leads at a time.

### ✅ Email Validation
Pre-send classifier blocks or flags:
- Personal emails (Gmail, Outlook, iCloud, Hey, Proton, etc.)
- Education addresses (.edu)
- Role-based addresses (hello@, info@) flagged with lower reply rate warning
- Scrollable results table (380px max, sticky headers) so the page doesn't grow with 100+ leads

### 🚀 Warmup-Aware Sending
The send engine knows what week of warmup you're in and enforces it automatically:

| Week | Daily limit | Cooldown | Stage |
|------|------------|---------|-------|
| 1 | 10/day | 90s | Gentle start |
| 2 | 20/day | 75s | Building trust |
| 3 | 35/day | 60s | Gaining momentum |
| 4 | 50/day | 45s | Good standing |
| 5 | 75/day | 30s | — |
| 6+ | 100/day | 20s | Fully warmed ✓ |

- Daily budget enforced live — counts emails sent today via `Last Contacted` field
- Excess leads deferred to tomorrow (not dropped)
- Confirmation dialog shows send count, deferred count, cooldown, and estimated total time
- Warmup status banner in Send tab: live progress bar, budget remaining, next week preview
- Every send logged to Airtable Campaign Log with message ID
- Copies email to IMAP Sent folder so it appears in webmail

### ⏰ Autonomous Sequences (Vercel Cron)
Runs daily at 9am UTC — zero manual intervention:

1. Connects to IMAP inbox, checks for replies from known lead emails
2. Claude classifies reply intent and writes structured data to dedicated Airtable fields
3. Sends Discord alert immediately for each reply
4. Fires Follow-up 1 for leads 5+ days since cold email with no reply
5. Fires Follow-up 2 for leads 7+ days since Follow-up 1 with no reply
6. Skips anyone who replied or unsubscribed
7. Sends Discord cron summary if anything happened

### 📬 Inbox Tab — Reply in One Click
When leads reply, the Inbox tab surfaces them for immediate action:

- **Left panel:** reply list split into "Needs reply" and "Replied", with color-coded intent badges
- **Right panel:** their full reply text, the original email you sent, Claude's suggested response pre-loaded in an editable textarea
- **Send Reply →** fires via SMTP, saves to Sent folder, marks `Reply Sent = true`, advances to next pending lead
- No email client needed — full reply workflow inside the app

### 🔔 Discord Notifications
Three notification types delivered as rich embeds:

| Trigger | Message |
|---------|---------|
| Reply detected by IMAP | Immediate alert with intent badge, summary, and Claude's suggested reply |
| Cron completes | Summary: leads checked, FU1/FU2 sent, replies found, errors |
| Reply sent from Inbox | Confirmation with company and email |

Intent colors: 🔥 interested (green) · ⏳ not now (yellow) · ❓ question (blue) · 🚫 unsubscribe (red)

Setup: add `DISCORD_WEBHOOK_URL` env var. Test button in Mission Control fires a sample embed.

### 🧠 Reply Intelligence
Claude classifies each incoming reply:

| Intent | Airtable update | Suggested response |
|--------|----------------|-------------------|
| `interested` | Sequence Status → Replied | Meeting confirmation with two specific times |
| `not_now` | Sequence Status → Replied | "Check back in [their timeframe]" |
| `question` | Sequence Status → Replied | Direct answer to their question |
| `unsubscribe` | Sequence Status → Opted Out | Brief polite acknowledgement only |

Reply text, intent, and suggested reply all saved to dedicated Airtable fields for clean structured data.

---

## Stack

| Layer | Technology |
|-------|-----------|
| Frontend + API | Next.js 14 App Router |
| CRM | Airtable REST API |
| AI | Anthropic Claude Sonnet 4 |
| Email sending | Nodemailer → SMTP (any provider) |
| Email receiving | ImapFlow → IMAP |
| Lead discovery | GitHub Search API |
| Email enrichment | Hunter.io (optional fallback) |
| Notifications | Discord Webhooks |
| Scheduling | Vercel Cron |
| Hosting | Vercel |

---

## Quick Start

### 1. Clone and install

```bash
git clone https://github.com/Lobstack-ai/email-outreach
cd email-outreach
npm install
```

### 2. Create your Airtable base

Create a free base at [airtable.com](https://airtable.com) with two tables:

**Lobstack Leads** — fields (all text unless noted):
`Company`, `Contact Name`, `Contact Email`, `Job Title`, `Company Type`, `Status` *(singleSelect)*, `Sequence Status` *(singleSelect)*, `GitHub Org URL`, `Website`, `GitHub Stars` *(number)*, `GitHub Forks` *(number)*, `GitHub Watchers` *(number)*, `Org Members` *(number)*, `Top Repo Contributors` *(number)*, `Open Issues` *(number)*, `Repo Count` *(number)*, `Lead Score` *(number)*, `Top Repos`, `AI Tools Used`, `Email Confidence` *(singleSelect)*, `Personalization Notes`, `Email Subject`, `Email Body`, `Follow-up 1 Subject`, `Follow-up 1 Body`, `Follow-up 2 Subject`, `Follow-up 2 Body`, `Reply Text`, `Reply Intent` *(singleSelect)*, `Suggested Reply`, `Reply Sent` *(checkbox)*, `Date Added`, `Last Contacted`, `Follow Up #` *(number)*, `Source`

**Campaign Log** — fields:
`Campaign ID`, `Company`, `Contact Email`, `Subject`, `Sequence Step`, `Sent At`, `Message ID`, `Result`

### 3. Environment variables

Create `.env.local`:

```env
# Airtable — airtable.com/create/tokens
# Scopes: data.records:read, data.records:write
AIRTABLE_API_KEY=patXXXXXXXXXXXXXX

# Anthropic — console.anthropic.com
ANTHROPIC_API_KEY=sk-ant-XXXXXXXXX

# Your sending email (also used for IMAP reply polling)
SMTP_EMAIL=you@yourdomain.com
SMTP_PASSWORD=yourpassword

# GitHub — github.com/settings/tokens (no repo permissions needed)
# Raises rate limit from 60 to 5,000 req/hr
GITHUB_TOKEN=ghp_XXXXXXXXX

# Hunter.io — hunter.io/api-keys (optional)
# Finds verified corporate emails via domain search when GitHub fails
# Free: 25 searches/mo · Starter: $49/mo for 500
HUNTER_API_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Discord — optional, highly recommended
# Channel → ⚙️ Integrations → Webhooks → New Webhook → Copy URL
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/YOUR_ID/YOUR_TOKEN
```

Update the Airtable base/table IDs in the API routes to match your base.

### 4. Run locally

```bash
npm run dev
# → http://localhost:3000
```

### 5. Deploy to Vercel

```bash
npm i -g vercel && vercel deploy
```

Add all env vars in **Vercel → Settings → Environment Variables**. The Vercel Cron (`0 9 * * *`) starts automatically on deploy.

---

## One-click deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/Lobstack-ai/email-outreach)

---

## App Tour

```
┌─────────────────────────────────────────────────────────────────────┐
│  Mission Control  │  Scrape  │  CRM  │  Generate  │  Send  │ Inbox  │
└─────────────────────────────────────────────────────────────────────┘
```

**Mission Control** — system health, sequence pipeline stats (7 states), domain warmup tracker, Hunter.io status, Discord setup card, cron log

**Scrape** — discover new GitHub orgs (15 rotating queries, deduped vs CRM), filter by score/stars/forks/members, click to enrich one, Enrich All, Save to CRM

**CRM** — full lead table with score badge, sequence status, stars, email confidence; preview modal shows all 3 emails side by side with day labels

**Generate** — generate sequences for new leads, Regen All to apply updated prompt to all existing leads, 3-column sequence preview per lead

**Send** — validate emails (scrollable list, sticky headers), warmup status banner with live budget, send campaign with automatic daily limit enforcement

**Inbox** — two-panel reply workflow: list of pending replies with intent badges, compose panel with their reply + Claude suggestion + send button

---

## API Reference

| Route | Method | Description |
|-------|--------|-------------|
| `/api/health` | GET | Ping all systems, returns env var status |
| `/api/airtable` | GET | Load all leads with pagination |
| `/api/airtable` | POST | Create / update records, log sends |
| `/api/discover` | GET | Run live GitHub search, return orgs not in CRM |
| `/api/scrape` | GET | Enrich a single GitHub org with metrics + contact |
| `/api/generate` | POST | Generate 3-part email sequence via Claude |
| `/api/regenerate` | POST | Batch regenerate existing sequences (8 at a time) |
| `/api/validate-emails` | POST | Pre-send email classification |
| `/api/send` | POST | Send email + save to IMAP Sent folder |
| `/api/send-reply` | POST | Send a reply from the Inbox tab |
| `/api/sequence-tick` | GET | Cron: check inbox for replies + fire follow-ups |
| `/api/hunter` | POST | Domain search + email finder via Hunter.io |
| `/api/hunter` | GET | Verify a specific email address |
| `/api/notify` | POST | Send Discord notification |
| `/api/notify` | GET | Send test Discord embed |
| `/api/inbound-reply` | POST | Webhook for external inbound email services |
| `/api/smtp-test` | POST | Verify SMTP credentials |

---

## Sequence State Machine

```
Cold ──► Email 1 Sent ──► Follow-up 1 Sent ──► Follow-up 2 Sent
              │                   │                     │
              └───────────────────┴─────────────────────┴──► Replied
                                                              Booked
                                                              Opted Out
```

The Vercel cron advances state automatically based on days elapsed and inbox replies.

---

## Lead Scoring (0–100)

| Signal | Max pts | Notes |
|--------|---------|-------|
| GitHub stars | 30 | Log-scaled — 10k stars ≠ 10× better than 1k |
| GitHub forks | 15 | Active adoption signal |
| Org members | 15 | Team size proxy |
| Top contributors | 15 | Community health |
| GitHub watchers | 10 | Interest signal |
| Open issues | 5 | Activity signal |
| Has email | 5 | Reachability |
| Has website | 5 | Legitimacy |

---

## Domain Warmup Schedule

| Week | Daily limit | Cooldown | Notes |
|------|------------|---------|-------|
| 1 | 10 | 90s | New domain — very gentle |
| 2 | 20 | 75s | Building sender reputation |
| 3 | 35 | 60s | Gaining momentum |
| 4 | 50 | 45s | Standard pace |
| 5 | 75 | 30s | Good standing |
| 6+ | 100 | 20s | Fully warmed |

The system calculates your current week from the first send date and enforces limits automatically. Excess leads are deferred to tomorrow, not dropped.

---

## Configuration

**Sequence timing** — `/src/app/api/sequence-tick/route.ts`:
```typescript
const FU1_DAYS = 5   // days after cold email before follow-up 1 fires
const FU2_DAYS = 7   // days after follow-up 1 before follow-up 2 fires
```

**Warmup schedule** — `/src/components/OutreachApp.tsx`:
```typescript
const WARMUP = [
  { dailyMax: 10,  cooldownMs: 90000 },  // Week 1
  { dailyMax: 20,  cooldownMs: 75000 },  // Week 2
  // ...
]
```

**First send date** — update `new Date('2026-03-28')` in `getWarmup()` to your actual campaign start date.

**Discovery queries** — `/src/app/api/discover/route.ts`: edit `SEARCH_QUERIES`. Up to 15 queries, rotating hourly.

**Email persona** — `/src/app/api/generate/route.ts`: edit `SYSTEM_PROMPT` and `buildColdPrompt()`.

---

## Deliverability Notes

- Send from a personal address (`brandon@yourdomain.com`) not a role address (`hello@`) — personal addresses get 30–40% higher reply rates on cold outreach
- The validation step blocks personal/education emails and warns on role addresses
- SMTP sends don't auto-save to Sent folder — the route handles this via IMAP APPEND
- Warmup limits are enforced per calendar day based on `Last Contacted` field date

---

## Why open source?

Most B2B outbound tools are paywalled SaaS with poor deliverability, no transparency into what gets sent, and no ability to tune the AI prompts. This runs on your infrastructure — you own the domain, the CRM, the prompts, and the data.

---

## Contributing

PRs welcome. Highest-impact additions:

- [ ] LinkedIn job posting scraper for hiring intent signals
- [ ] Tech stack detection (Wappalyzer) for lead qualification
- [ ] Multi-sender support / inbox rotation for higher volume
- [ ] Open/click tracking pixel
- [ ] Unsubscribe landing page
- [ ] A/B testing for subject lines
- [ ] Slack notification support alongside Discord
- [ ] Auto-book meetings via Calendly link in suggested replies
- [ ] Apollo.io API integration as alternative to Hunter.io

---

## License

MIT

---

<div align="center">

Built by <a href="https://lobstack.ai">Lobstack</a> — the platform for autonomous AI agents

</div>
