<div align="center">

<svg width="64" height="64" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
  <polygon points="18,2 32,10 32,14 18,22 4,14 4,10" fill="#CE7878" opacity="0.55"/>
  <polygon points="18,8 32,16 32,20 18,28 4,20 4,16" fill="#D63839" opacity="0.75"/>
  <polygon points="18,14 32,22 32,26 18,34 4,26 4,22" fill="#E84142" opacity="1.0"/>
</svg>

# Lobstack Outreach

**Open-source autonomous B2B cold email engine for AI companies**

Discover leads on GitHub · Score by signal · Find decision-maker emails · Generate human 3-part sequences with Claude · Send autonomously · Classify replies via IMAP

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/Lobstack-ai/email-outreach)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org)
[![Powered by Claude](https://img.shields.io/badge/Powered%20by-Claude%20Sonnet-E84142)](https://anthropic.com)

[Live Demo](https://email-outreach-rosy.vercel.app) · [Report Bug](https://github.com/Lobstack-ai/email-outreach/issues) · [Request Feature](https://github.com/Lobstack-ai/email-outreach/issues)

</div>

---

## What this is

A complete, self-hosted B2B outbound system that runs entirely on Vercel. Point it at GitHub, it finds companies actively building with AI, scores them by GitHub signals, finds decision-maker contact emails, writes personalised 3-part cold email sequences using Claude Sonnet, validates and sends them from your own domain, then automatically fires follow-ups and classifies replies — all without manual intervention after the initial send.

Built for founders who want serious outbound without paying $500/mo for Apollo + Outreach + Clearbit combined.

---

## How it works

```
GitHub Search ──► Score Leads ──► Find Emails ──► Generate Sequences ──► Validate ──► Send
                                                                                        │
                                                               Vercel Cron (9am UTC daily)
                                                                                        │
                                                         Day 5: Auto-send Follow-up 1
                                                         Day 12: Auto-send Follow-up 2
                                                                                        │
                                                         IMAP polls inbox for replies
                                                                                        │
                                                  Claude classifies: interested / not now /
                                                  unsubscribe / question → updates Airtable
```

---

## Features

### 🔍 Lead Discovery
- **Live GitHub search** across 15 rotating queries — finds orgs building AI agents, LLMs, MCP tools, vector databases, and dev infrastructure not already in your CRM
- **0–100 lead scoring** from stars, forks, watchers, org member count, contributors, open issues, and contact availability
- **Filter bar** — sort and filter discovered orgs by any metric before enriching
- Queries rotate by hour slot so each discover run surfaces fresh results

### 👤 Contact Enrichment
- Fetches org members, scores by bio keywords (CTO, founder, VP Engineering, CEO)
- Checks GitHub public email and marks as verified
- Falls back to domain pattern inference (`first@domain`, `first.last@domain`, `flast@domain`)
- Stores all GitHub metrics to Airtable: forks, watchers, member count, contributors, open issues, repo count

### ✉️ AI Email Generation (Claude Sonnet 4)
Generates a full 3-part sequence per lead in one API call:

| Email | Timing | Style |
|-------|--------|-------|
| Cold email | Day 1 | References specific repos by name. Opens with an observation, not a pitch. One clear CTA. |
| Follow-up 1 | Day 5 | 2–3 sentences, new angle, specific offer or demo tied to their stack |
| Breakup email | Day 12 | 2 sentences, graceful exit, one final insight |

**Hard rules baked into the system prompt:** no dashes as connectors, never starts with "I", no "hope this finds you well", no "touching base", no "synergy", no ALL CAPS, sentences under 20 words, primary CTA is always a call/meeting.

### ✅ Email Validation
Pre-send classifier blocks or flags:
- Personal emails (Gmail, Outlook, iCloud, Hey, Proton, etc.)
- Education addresses (.edu)
- Role-based addresses (hello@, info@) flagged with lower reply rate warning

### 🚀 Sending
- Any SMTP provider via Nodemailer (PrivateEmail, Gmail, Sendgrid, etc.)
- HTML + plain text multipart for deliverability
- `List-Unsubscribe` header included (RFC 2369)
- Saves copy to IMAP Sent folder so it appears in webmail
- 45-second cooldown between sends
- Every send logged to Airtable Campaign Log with message ID

### ⏰ Autonomous Sequences (Vercel Cron)
Runs daily at 9am UTC — zero manual intervention required:
1. Connects to IMAP inbox, checks for replies from known lead emails
2. Claude classifies reply intent → updates Airtable (Replied / Opted Out)
3. Fires Follow-up 1 for leads 5+ days since cold email with no reply
4. Fires Follow-up 2 for leads 7+ days since Follow-up 1 with no reply
5. Skips anyone who replied or unsubscribed

### 🧠 Reply Intelligence
When a reply arrives, Claude classifies intent:

| Intent | Action |
|--------|--------|
| `interested` | Status → Replied, suggested meeting response written to Airtable |
| `not_now` | Status → Replied, suggests a "check back in X weeks" response |
| `question` | Status → Replied, drafts a direct answer to their specific question |
| `unsubscribe` | Status → Opted Out, removed from all future sends |

Suggested response is written to Personalization Notes for human review before sending.

---

## Stack

| Layer | Technology |
|-------|-----------|
| Frontend + API | Next.js 14 App Router |
| CRM | Airtable REST API |
| AI | Anthropic Claude Sonnet 4 |
| Email sending | Nodemailer → SMTP |
| Email receiving | ImapFlow → IMAP |
| Lead discovery | GitHub Search API |
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

**Lobstack Leads** — fields:
`Company`, `Contact Name`, `Contact Email`, `Job Title`, `Company Type`, `Status`, `Sequence Status`, `GitHub Org URL`, `Website`, `GitHub Stars`, `GitHub Forks`, `GitHub Watchers`, `Org Members`, `Top Repo Contributors`, `Open Issues`, `Repo Count`, `Lead Score`, `Top Repos`, `AI Tools Used`, `Personalization Notes`, `Email Subject`, `Email Body`, `Follow-up 1 Subject`, `Follow-up 1 Body`, `Follow-up 2 Subject`, `Follow-up 2 Body`, `Date Added`, `Last Contacted`, `Follow Up #`, `Source`

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

# Your sending email address (also used for IMAP reply polling)
SMTP_EMAIL=you@yourdomain.com
SMTP_PASSWORD=yourpassword

# GitHub — github.com/settings/tokens
# Raises rate limit from 60 to 5,000 req/hr
GITHUB_TOKEN=ghp_XXXXXXXXX
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

Add env vars in **Vercel → Settings → Environment Variables**. The cron job (`0 9 * * *`) starts automatically.

---

## One-click deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/Lobstack-ai/email-outreach)

---

## API Reference

| Route | Method | Description |
|-------|--------|-------------|
| `/api/health` | GET | Ping all systems — Airtable, SMTP, GitHub, Anthropic |
| `/api/airtable` | GET | Load all leads with pagination |
| `/api/airtable` | POST | Create / update records, log sends |
| `/api/discover` | GET | Run live GitHub search, return orgs not in CRM |
| `/api/scrape` | GET | Enrich a single GitHub org with metrics + contact |
| `/api/generate` | POST | Generate 3-part email sequence via Claude |
| `/api/validate-emails` | POST | Pre-send email classification |
| `/api/send` | POST | Send email + save copy to IMAP Sent folder |
| `/api/sequence-tick` | GET | Cron: check inbox for replies + fire follow-ups |
| `/api/inbound-reply` | POST | Webhook endpoint for inbound email services |
| `/api/smtp-test` | POST | Verify SMTP credentials |

---

## Sequence State Machine

```
Cold ──► Email 1 Sent ──► Follow-up 1 Sent ──► Follow-up 2 Sent
                │                  │                    │
                └──────────────────┴────────────────────┴──► Replied
                                                              Booked
                                                              Opted Out
```

The Vercel cron advances state automatically based on days elapsed and inbox replies.

---

## Lead Scoring (0–100)

| Signal | Max Points | Notes |
|--------|-----------|-------|
| GitHub stars | 30 | Log-scaled so 10k stars ≠ 10× better than 1k |
| GitHub forks | 15 | Active adoption signal |
| Org members | 15 | Team size proxy |
| Top contributors | 15 | Community health |
| GitHub watchers | 10 | Interest without commitment |
| Open issues | 5 | Activity signal |
| Has email contact | 5 | Reachability |
| Has website | 5 | Legitimacy |

---

## Configuration

**Sequence timing** — `/src/app/api/sequence-tick/route.ts`:
```typescript
const FU1_DAYS = 5   // days after cold email before follow-up 1
const FU2_DAYS = 7   // days after follow-up 1 before follow-up 2
```

**Discovery queries** — `/src/app/api/discover/route.ts`:
Edit `SEARCH_QUERIES` to target different verticals. Queries rotate hourly for freshness.

**Email persona** — `/src/app/api/generate/route.ts`:
Edit `SYSTEM_PROMPT` and the sender name in `buildColdEmailPrompt`.

---

## Delivery Notes

- Send from a personal address (`brandon@yourdomain.com`) not a role address (`hello@`) — personal addresses get 30–40% higher reply rates on cold outreach
- Warm up your domain before bulk sends — start with 5–10/day, ramp over 2 weeks
- The validation step blocks personal emails and flags role addresses before sending
- SMTP sends don't auto-save to Sent folder — the route handles this via IMAP APPEND

---

## Why open source?

Most B2B outbound tools are paywalled SaaS with poor deliverability, no transparency into what gets sent, and no ability to tune the AI prompts. This runs on your infrastructure — you own the domain, the CRM, the prompts, and the data.

---

## Contributing

PRs welcome. Highest-impact additions:

- [ ] Hunter.io / Apollo API for email finding
- [ ] LinkedIn job posting scraper for hiring intent signals
- [ ] Tech stack detection for lead qualification
- [ ] Multi-sender support / inbox rotation
- [ ] Open/click tracking pixel
- [ ] Unsubscribe landing page
- [ ] A/B testing for subject lines
- [ ] Slack/Teams notification on hot replies

---

## License

MIT

---

<div align="center">
Built by <a href="https://lobstack.ai">Lobstack</a> — the platform for autonomous AI agents
</div>
