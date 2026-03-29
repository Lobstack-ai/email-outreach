<div align="center">

<img src="https://lobstack.ai/logo.svg" alt="Lobstack" width="64" height="64" />

# Lobstack Outreach

**Open-source B2B cold email engine for AI-forward companies**

Discover leads from GitHub · Enrich with contact data · Generate human-like 3-part sequences with Claude · Send autonomously · Classify replies

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/Lobstack-ai/email-outreach)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org)
[![Powered by Claude](https://img.shields.io/badge/Powered%20by-Claude%20Sonnet-orange)](https://anthropic.com)

[Live Demo](https://email-outreach-rosy.vercel.app) · [Report Bug](https://github.com/Lobstack-ai/email-outreach/issues) · [Request Feature](https://github.com/Lobstack-ai/email-outreach/issues)

</div>

---

## What this is

A complete, self-hosted B2B outbound system that runs on Vercel. Point it at GitHub, it finds companies actively building with AI, scores them, finds decision-maker emails, writes personalised cold email sequences using Claude, validates and sends them, and automatically fires follow-ups and classifies replies — all without manual intervention after the initial send.

Built for founders who want to run serious outbound without paying $500/mo for Apollo + Outreach + Clearbit combined.

---

## How it works

```
GitHub Search → Score Leads → Find Emails → Generate Sequences → Validate → Send
                                                                              ↓
                                                          Vercel Cron (9am UTC daily)
                                                                              ↓
                                                    Day 5: Auto-send Follow-up 1
                                                    Day 12: Auto-send Follow-up 2
                                                              ↓
                                                    IMAP polls inbox for replies
                                                              ↓
                                               Claude classifies: interested / not now /
                                               unsubscribe / question → updates Airtable
```

---

## Features

### 🔍 Lead Discovery
- **Live GitHub search** across 10 parallel queries — finds orgs building with AI agents, LLMs, MCP tools, and dev infrastructure that aren't already in your CRM
- **0-100 lead scoring** based on stars, forks, watchers, org member count, contributors, open issues, and contact availability
- **Filter bar** — sort and filter discovered orgs by any metric before enriching
- 20 hand-picked classic targets + unlimited dynamic discovery

### 👤 Contact Enrichment
- Fetches org members, scores by bio keywords (CTO, founder, VP Engineering, CEO)
- Checks GitHub public email → marks as "GitHub public"
- Falls back to domain pattern inference (first@domain, first.last@domain, flast@domain)
- Stores all GitHub metrics to Airtable: forks, watchers, member count, contributors, open issues, repo count

### ✉️ AI Email Generation (Claude Sonnet)
Generates a full 3-part sequence per lead in one API call:

| Email | Timing | Notes |
|-------|--------|-------|
| Cold email | Day 1 | References specific repos by name, never starts with "I", peer technical tone |
| Follow-up 1 | Day 5 | 2-3 sentences, new angle, threads original subject |
| Breakup email | Day 12 | 2 sentences, graceful exit, one final hook |

The system prompt explicitly prohibits: "Hope this finds you well", "touching base", "circling back", "synergy", ALL CAPS, and every spam trigger pattern.

### ✅ Email Validation
Pre-send classifier blocks:
- Personal emails (Gmail, Hey, Outlook, iCloud, etc.)
- Education emails (.edu)
- Flags role-based addresses (hello@, info@) with lower reply rate warning

### 🚀 Sending
- PrivateEmail SMTP via Vercel serverless (port 587 STARTTLS)
- HTML + plain text multipart for deliverability
- `List-Unsubscribe` header (RFC 2369)
- Saves copy to IMAP Sent folder so it appears in webmail
- 45-second cooldown between sends
- Every send logged to Airtable Campaign Log

### ⏰ Autonomous Sequences (Vercel Cron)
Runs daily at 9am UTC with zero manual intervention:
1. Connects to IMAP inbox, checks for replies from known lead emails
2. Claude classifies intent → updates Airtable (Replied / Opted Out)
3. Fires Follow-up 1 to leads where 5+ days have passed since cold email
4. Fires Follow-up 2 to leads where 7+ days have passed since Follow-up 1
5. Skips anyone who replied or unsubscribed

### 🧠 Reply Intelligence
When a reply comes in, Claude classifies it:
- `interested` → Sequence Status: Replied, suggested response with 2 meeting times
- `not_now` → Suggests "check back in [their timeframe]" response
- `question` → Drafts a direct answer to their specific question
- `unsubscribe` → Marks Opted Out, removes from all future sends

Suggested response written to Airtable Personalization Notes for human review.

---

## Stack

| Layer | Technology |
|-------|-----------|
| Frontend + API | Next.js 14 (App Router) |
| CRM | Airtable (REST API) |
| AI | Anthropic Claude Sonnet 4 |
| Email sending | Nodemailer → PrivateEmail SMTP |
| Email receiving | ImapFlow → PrivateEmail IMAP |
| Lead discovery | GitHub Search API |
| Hosting | Vercel (with Cron) |

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

**Lobstack Leads** — primary fields:
`Company`, `Contact Name`, `Contact Email`, `Job Title`, `Company Type`, `Status`, `GitHub Org URL`, `Website`, `GitHub Stars`, `GitHub Forks`, `GitHub Watchers`, `Org Members`, `Top Repo Contributors`, `Open Issues`, `Repo Count`, `Lead Score`, `Top Repos`, `AI Tools Used`, `Personalization Notes`, `Email Subject`, `Email Body`, `Follow-up 1 Subject`, `Follow-up 1 Body`, `Follow-up 2 Subject`, `Follow-up 2 Body`, `Sequence Status`, `Date Added`, `Last Contacted`, `Follow Up #`, `Source`

**Campaign Log** — fields:
`Campaign ID`, `Company`, `Contact Email`, `Subject`, `Sequence Step`, `Sent At`, `Message ID`, `Result`

### 3. Environment variables

Create `.env.local`:

```env
# Airtable — get token at airtable.com/create/tokens
# Required scopes: data.records:read, data.records:write
AIRTABLE_API_KEY=patXXXXXXXXXXXXXX

# Anthropic — get key at console.anthropic.com
ANTHROPIC_API_KEY=sk-ant-XXXXXXXXX

# Your sending email (SMTP + IMAP for sending and reply detection)
SMTP_EMAIL=hello@yourdomain.com
SMTP_PASSWORD=yourpassword

# GitHub — raises rate limit from 60 to 5,000 req/hr (strongly recommended)
# Create at github.com/settings/tokens — no repo permissions needed
GITHUB_TOKEN=ghp_XXXXXXXXX
```

Update the Airtable base IDs in `/src/app/api/airtable/route.ts` and `/src/app/api/sequence-tick/route.ts` to match your base.

### 4. Run locally

```bash
npm run dev
# → http://localhost:3000
```

### 5. Deploy to Vercel

```bash
npm install -g vercel
vercel deploy
```

Add all env vars in **Vercel → Settings → Environment Variables**.

The Vercel Cron job (`0 9 * * *`) starts automatically on deploy — no additional configuration needed.

---

## Deploy with one click

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
| `/api/sequence-tick` | GET | Cron: check replies + fire follow-ups |
| `/api/inbound-reply` | POST | Webhook for inbound email parse services |
| `/api/smtp-test` | POST | Verify SMTP credentials |
| `/api/enrich` | GET | Standalone org member enrichment |

---

## Airtable Schema Details

### Sequence Status field (7 states)

```
Cold → Email 1 Sent → Follow-up 1 Sent → Follow-up 2 Sent → Replied / Booked / Opted Out
```

The cron job advances this automatically based on days elapsed and inbox replies.

### Lead Score (0–100)

Computed from GitHub signals on scrape:

| Signal | Max Points |
|--------|-----------|
| Stars (log scale) | 30 |
| Forks (log scale) | 15 |
| Org members | 15 |
| Top repo contributors | 15 |
| Watchers | 10 |
| Active issues | 5 |
| Has email contact | 5 |
| Has website | 5 |

---

## Workflow

```
┌─────────────────────────────────────────────────────────────┐
│                        SCRAPE TAB                           │
│  🔍 Discover New Orgs (live GitHub search, deduped vs CRM)  │
│  📌 Classic List (20 hand-picked AI companies)              │
│  Filter: sort by Score/Stars/Forks/Members, min thresholds  │
│  Enrich All → contact emails + GitHub metrics per org       │
│  Save to CRM → all fields written to Airtable               │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                       GENERATE TAB                          │
│  Select leads → Generate sequences                          │
│  Claude writes: cold email + follow-up 1 + breakup email    │
│  All 3 saved to Airtable in one update                      │
│  Preview shows 3-column sequence view per lead              │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                         SEND TAB                            │
│  Step 1: Run Validation → per-lead email quality check      │
│  Step 2: Send Campaign → SMTP with 45s cooldown             │
│  Sequence Status → "Email 1 Sent" in Airtable               │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                    VERCEL CRON (9am UTC)                     │
│  Poll IMAP inbox → match replies to leads                   │
│  Claude classifies reply intent → update Airtable           │
│  Day 5: Fire Follow-up 1 to non-replies                     │
│  Day 12: Fire Follow-up 2 to non-replies                    │
└─────────────────────────────────────────────────────────────┘
```

---

## Configuration

### Adjust sequence timing

In `/src/app/api/sequence-tick/route.ts`:

```typescript
const FU1_DAYS = 5   // days after cold email before follow-up 1
const FU2_DAYS = 7   // days after follow-up 1 before follow-up 2
```

### Change target companies (Classic List)

In `/src/app/api/scrape/route.ts` and `/src/components/OutreachApp.tsx`, edit the `TARGETS` array.

### Change GitHub discovery queries

In `/src/app/api/discover/route.ts`, edit the `SEARCH_QUERIES` array. Up to 10 queries run in parallel.

### Customise email persona

In `/src/app/api/generate/route.ts`, edit `SYSTEM_PROMPT` and the sender name in the prompt builders.

---

## Why open source?

Most B2B outbound tools are paywalled SaaS with poor deliverability, no transparency into what's actually sent, and no ability to customise the AI prompts. This runs entirely on your own infrastructure — you own the sending domain, the CRM, the prompts, and the data.

---

## Contributing

Pull requests welcome. Areas that would have the most impact:

- [ ] Hunter.io / Apollo API integration for email finding
- [ ] LinkedIn job posting scraper for hiring intent signals
- [ ] Tech stack detection (DetectZeStack / Wappalyzer) for lead qualification
- [ ] Multi-sender support / inbox rotation
- [ ] Open/click tracking via pixel
- [ ] Unsubscribe link landing page
- [ ] A/B testing for subject lines

---

## License

MIT — do whatever you want with it.

---

<div align="center">
Built by <a href="https://lobstack.ai">Lobstack</a> · <a href="https://twitter.com/lobstack">@lobstack</a>
</div>
