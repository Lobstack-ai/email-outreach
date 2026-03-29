import { NextRequest, NextResponse } from 'next/server'

// Hunter.io API integration for finding verified email addresses
// Sign up free at hunter.io — 25 searches/mo free, $49/mo for 500

const HUNTER_BASE = 'https://api.hunter.io/v2'

async function hunterDomainSearch(domain: string, company: string, apiKey: string) {
  const url = `${HUNTER_BASE}/domain-search?domain=${encodeURIComponent(domain)}&company=${encodeURIComponent(company)}&limit=5&api_key=${apiKey}`
  const r = await fetch(url)
  if (!r.ok) {
    const err = await r.json().catch(() => ({}))
    throw new Error(err.errors?.[0]?.details || `Hunter API ${r.status}`)
  }
  return r.json()
}

async function hunterEmailFinder(domain: string, firstName: string, lastName: string, apiKey: string) {
  const url = `${HUNTER_BASE}/email-finder?domain=${encodeURIComponent(domain)}&first_name=${encodeURIComponent(firstName)}&last_name=${encodeURIComponent(lastName)}&api_key=${apiKey}`
  const r = await fetch(url)
  if (!r.ok) return null
  return r.json()
}

async function hunterEmailVerify(email: string, apiKey: string) {
  const url = `${HUNTER_BASE}/email-verifier?email=${encodeURIComponent(email)}&api_key=${apiKey}`
  const r = await fetch(url)
  if (!r.ok) return null
  return r.json()
}

function extractDomain(website: string, githubOrgUrl: string): string | null {
  // Try website first
  if (website && !website.includes('github.com')) {
    try {
      const url = new URL(website.startsWith('http') ? website : `https://${website}`)
      return url.hostname.replace('www.', '')
    } catch {}
  }
  return null
}

function scoreEmail(email: any, confidence: number): number {
  if (!email) return 0
  // Hunter confidence + type bonus
  let score = confidence || 0
  if (email.type === 'personal') score += 10  // personal > generic
  if (email.position?.toLowerCase().includes('cto') ||
      email.position?.toLowerCase().includes('founder') ||
      email.position?.toLowerCase().includes('ceo') ||
      email.position?.toLowerCase().includes('vp')) score += 15
  return Math.min(score, 100)
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.HUNTER_API_KEY
  if (!apiKey) {
    return NextResponse.json({
      ok: false,
      error: 'HUNTER_API_KEY not configured. Sign up free at hunter.io',
      setupRequired: true,
    }, { status: 400 })
  }

  const { domain, company, website, githubOrgUrl, contactName } = await req.json()

  const targetDomain = domain || extractDomain(website, githubOrgUrl)
  if (!targetDomain) {
    return NextResponse.json({ ok: false, error: 'No domain available to search' }, { status: 400 })
  }

  try {
    // Step 1: Domain search — get all emails Hunter knows for this domain
    const domainResult = await hunterDomainSearch(targetDomain, company || '', apiKey)
    const emails = domainResult?.data?.emails || []
    const domainConfidence = domainResult?.data?.domain ? 100 : 0

    if (emails.length === 0 && !contactName) {
      return NextResponse.json({
        ok: true,
        found: false,
        domain: targetDomain,
        message: 'No emails found for this domain',
      })
    }

    // Step 2: If we have a contact name, try email finder for better targeting
    let finderResult = null
    if (contactName && targetDomain) {
      const nameParts = contactName.trim().split(/\s+/)
      if (nameParts.length >= 2) {
        finderResult = await hunterEmailFinder(
          targetDomain,
          nameParts[0],
          nameParts.slice(1).join(' '),
          apiKey
        )
      }
    }

    // Step 3: Score and rank all candidates
    const candidates: { email: string; confidence: number; score: number; source: string; firstName?: string; lastName?: string; position?: string; type?: string }[] = []

    // Add finder result if confident
    if (finderResult?.data?.email && finderResult.data.confidence > 40) {
      candidates.push({
        email:      finderResult.data.email,
        confidence: finderResult.data.confidence,
        score:      scoreEmail(finderResult.data, finderResult.data.confidence),
        source:     'hunter-finder',
        firstName:  finderResult.data.first_name,
        lastName:   finderResult.data.last_name,
        position:   finderResult.data.position,
        type:       finderResult.data.type,
      })
    }

    // Add domain search results, prioritise decision-makers
    for (const e of emails.slice(0, 5)) {
      if (!e.value) continue
      candidates.push({
        email:      e.value,
        confidence: e.confidence || 0,
        score:      scoreEmail(e, e.confidence || 0),
        source:     'hunter-domain',
        firstName:  e.first_name,
        lastName:   e.last_name,
        position:   e.position,
        type:       e.type,
      })
    }

    // Sort by score descending
    candidates.sort((a, b) => b.score - a.score)
    const best = candidates[0]

    if (!best) {
      return NextResponse.json({ ok: true, found: false, domain: targetDomain })
    }

    return NextResponse.json({
      ok:           true,
      found:        true,
      email:        best.email,
      confidence:   best.confidence,
      score:        best.score,
      source:       best.source,
      firstName:    best.firstName,
      lastName:     best.lastName,
      position:     best.position,
      type:         best.type,
      domain:       targetDomain,
      allCandidates: candidates,
      // Hunter pattern for this domain (useful for manual lookup)
      pattern:       domainResult?.data?.pattern,
      patternConfidence: domainResult?.data?.pattern_confidence,
    })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 })
  }
}

// GET — verify a specific email address
export async function GET(req: NextRequest) {
  const apiKey = process.env.HUNTER_API_KEY
  if (!apiKey) return NextResponse.json({ ok: false, error: 'HUNTER_API_KEY not configured' }, { status: 400 })

  const email = new URL(req.url).searchParams.get('email')
  if (!email) return NextResponse.json({ ok: false, error: 'email param required' }, { status: 400 })

  try {
    const result = await hunterEmailVerify(email, apiKey)
    const d = result?.data
    return NextResponse.json({
      ok:     true,
      email:  d?.email,
      status: d?.status,      // 'valid' | 'invalid' | 'accept_all' | 'unknown'
      score:  d?.score,
      regexp: d?.regexp,
      gibberish: d?.gibberish,
      disposable: d?.disposable,
      webmail: d?.webmail,
      mxRecords: d?.mx_records,
      smtpServer: d?.smtp_server,
      smtpCheck: d?.smtp_check,
    })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 })
  }
}
