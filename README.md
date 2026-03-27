# Lobstack Email Outreach

B2B cold email system for onboarding enterprise customers to [lobstack.ai](https://lobstack.ai).

## Stack

- **Next.js 14** (App Router) — frontend + API routes
- **Airtable** — CRM (Lobstack CRM base, `appnF2fNAyEYnscvo`)
- **PrivateEmail / Gmail** — sending
- **Anthropic Claude** — AI email generation
- **GitHub API** — lead scraping

## Features

1. **Scrape** — pulls 20 AI-forward GitHub orgs, enriches with stars/repos/AI tools
2. **CRM** — full lead management backed by Airtable
3. **Generate** — Claude writes personalised cold emails per lead
4. **Send** — real SMTP via PrivateEmail or Gmail, campaign logged to Airtable

## Setup

### 1. Clone & install

```bash
git clone https://github.com/Lobstack-ai/email-outreach
cd email-outreach
npm install
```

### 2. Environment variables

Copy `.env.example` to `.env.local` and fill in:

```
AIRTABLE_API_KEY=patXXX...
ANTHROPIC_API_KEY=sk-ant-...
SMTP_EMAIL=hello@lobstack.ai
SMTP_PASSWORD=yourpassword
GITHUB_TOKEN=ghp_...
```

Get your Airtable token at [airtable.com/create/tokens](https://airtable.com/create/tokens) — grant **read/write** on the **Lobstack CRM** base.

### 3. Run locally

```bash
npm run dev
# → http://localhost:3000
```

### 4. Deploy to Vercel

```bash
vercel deploy
```

Add the same env vars in Vercel → Settings → Environment Variables.

## Airtable Schema

Base: `appnF2fNAyEYnscvo` (Lobstack CRM)

| Table | ID | Purpose |
|---|---|---|
| Lobstack Leads | `tblMgthKziXfnIPBV` | Lead profiles, email content, status |
| Campaign Log | `tbl6olAfEJ479I9oq` | Every email sent, message IDs, results |

## API Routes

| Route | Method | Purpose |
|---|---|---|
| `/api/airtable` | GET | Load leads |
| `/api/airtable` | POST | Create/update records, log sends |
| `/api/scrape` | GET | Scrape a GitHub org or check rate limit |
| `/api/generate` | POST | Generate personalised email via Claude |
| `/api/send` | POST | Send email via PrivateEmail SMTP |
| `/api/smtp-test` | POST | Verify SMTP credentials |
