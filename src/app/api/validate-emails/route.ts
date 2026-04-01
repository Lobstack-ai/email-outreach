import { NextRequest, NextResponse } from 'next/server'
import dns from 'dns/promises'

const PERSONAL_DOMAINS = new Set([
  'gmail.com','yahoo.com','hotmail.com','outlook.com','live.com',
  'icloud.com','me.com','mac.com','hey.com','proton.me','protonmail.com',
  'fastmail.com','zoho.com','aol.com','msn.com','ymail.com','inbox.com',
])
const ROLE_PREFIXES = new Set([
  'hello','info','contact','support','admin','noreply','no-reply',
  'team','sales','marketing','help','enquiries','enquiry','office',
  'mail','accounts','billing','legal','privacy',
])
const KNOWN_GOOD_DOMAINS = new Set([
  'google.com','microsoft.com','apple.com','amazon.com','github.com',
  'stripe.com','vercel.com','netlify.com','cloudflare.com',
])

export type EmailStatus = 'ready' | 'personal' | 'edu' | 'role' | 'missing' | 'invalid' | 'no_mx'

async function checkMX(domain: string): Promise<boolean> {
  // Skip DNS check for well-known domains (always valid)
  if (KNOWN_GOOD_DOMAINS.has(domain)) return true
  try {
    const records = await dns.resolveMx(domain)
    return records && records.length > 0
  } catch {
    return false
  }
}

async function checkEmail(
  email: string,
  verifyMX = false
): Promise<{ status: EmailStatus; reason: string; willSend: boolean; warning?: string }> {
  if (!email) return { status: 'missing', reason: 'No contact email', willSend: false }
  if (!email.includes('@') || !email.includes('.'))
    return { status: 'invalid', reason: 'Invalid email format', willSend: false }

  const [prefix, domain] = email.toLowerCase().split('@')
  if (!domain || !domain.includes('.'))
    return { status: 'invalid', reason: 'Invalid domain', willSend: false }

  if (PERSONAL_DOMAINS.has(domain))
    return { status: 'personal', reason: `Personal email (${domain}) — find a company address`, willSend: false }
  if (domain.endsWith('.edu'))
    return { status: 'edu', reason: 'Education address — not a business decision maker', willSend: false }

  const isRole = ROLE_PREFIXES.has(prefix)

  // MX record check — verify the domain can actually receive email
  if (verifyMX) {
    const hasMX = await checkMX(domain)
    if (!hasMX) {
      return {
        status: 'no_mx',
        reason: `Domain ${domain} has no MX records — email will bounce`,
        willSend: false,
      }
    }
  }

  if (isRole) {
    return {
      status: 'role',
      reason: `Role address (${prefix}@) — lower reply rates`,
      willSend: true,
      warning: 'Role address — consider finding a personal contact',
    }
  }

  return { status: 'ready', reason: 'Ready to send', willSend: true }
}

// Try to find a better email via Hunter.io when one is missing or invalid
async function hunterLookup(domain: string): Promise<string | null> {
  if (!process.env.HUNTER_API_KEY || !domain) return null
  try {
    const r = await fetch(
      `https://api.hunter.io/v2/domain-search?domain=${encodeURIComponent(domain)}&limit=3&api_key=${process.env.HUNTER_API_KEY}`,
      { signal: AbortSignal.timeout(5000) }
    )
    if (!r.ok) return null
    const d = await r.json()
    const emails = (d?.data?.emails || [])
      .filter((e: any) => e.value && e.confidence > 50)
      .map((e: any) => {
        let score = e.confidence
        const pos = (e.position || '').toLowerCase()
        if (/cto|ceo|founder|vp|head|chief/.test(pos)) score += 30
        if (e.type === 'personal') score += 10
        return { ...e, score }
      })
      .sort((a: any, b: any) => b.score - a.score)
    return emails[0]?.value || null
  } catch { return null }
}

export async function POST(req: NextRequest) {
  const { leads, verifyMX = true, tryHunter = true } = await req.json()
  if (!Array.isArray(leads))
    return NextResponse.json({ ok: false, error: 'leads array required' }, { status: 400 })

  const results = await Promise.all(leads.map(async (lead: any) => {
    let email     = lead.contactEmail || ''
    let hunterEmail: string | null = null
    let hunterUsed = false

    // If missing or invalid, try Hunter.io
    if (tryHunter && (!email || !email.includes('@'))) {
      const website = lead.website || ''
      let domain: string | null = null
      try { domain = new URL(website.startsWith('http') ? website : `https://${website}`).hostname.replace(/^www\./, '') } catch {}
      if (domain) {
        hunterEmail = await hunterLookup(domain)
        if (hunterEmail) { email = hunterEmail; hunterUsed = true }
      }
    }

    const check = await checkEmail(email, verifyMX)

    return {
      id:          lead.id,
      company:     lead.company,
      email:       email || null,
      originalEmail: lead.contactEmail || null,
      hunterEmail: hunterUsed ? hunterEmail : null,
      hunterUsed,
      ...check,
    }
  }))

  const summary = {
    total:     results.length,
    ready:     results.filter(r => r.status === 'ready').length,
    role:      results.filter(r => r.status === 'role').length,
    personal:  results.filter(r => r.status === 'personal').length,
    edu:       results.filter(r => r.status === 'edu').length,
    missing:   results.filter(r => r.status === 'missing').length,
    no_mx:     results.filter(r => r.status === 'no_mx').length,
    invalid:   results.filter(r => r.status === 'invalid').length,
    hunterFound: results.filter(r => r.hunterUsed).length,
    willSend:  results.filter(r => r.willSend).length,
    blocked:   results.filter(r => !r.willSend).length,
  }

  return NextResponse.json({ ok: true, results, summary })
}
