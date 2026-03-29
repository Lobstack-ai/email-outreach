import { NextRequest, NextResponse } from 'next/server'

const PERSONAL_DOMAINS = new Set([
  'gmail.com','yahoo.com','hotmail.com','outlook.com','live.com',
  'icloud.com','me.com','mac.com','hey.com','proton.me','protonmail.com',
  'fastmail.com','zoho.com','aol.com','msn.com','ymail.com',
])
const ROLE_PREFIXES = new Set(['hello','info','contact','support','admin','noreply','no-reply','team','sales','marketing'])

export type EmailStatus = 'ready' | 'personal' | 'edu' | 'role' | 'missing' | 'invalid'

function checkEmail(email: string): { status: EmailStatus; reason: string } {
  if (!email) return { status: 'missing', reason: 'No contact email — add one in Airtable' }
  if (!email.includes('@') || !email.includes('.')) return { status: 'invalid', reason: 'Invalid email format' }

  const [prefix, domain] = email.toLowerCase().split('@')
  if (!domain) return { status: 'invalid', reason: 'Invalid email format' }

  if (PERSONAL_DOMAINS.has(domain)) return { status: 'personal', reason: `Personal email (${domain}) — find a company email via Hunter.io or Apollo` }
  if (domain.endsWith('.edu')) return { status: 'edu', reason: `Education email — not a business decision maker` }
  if (ROLE_PREFIXES.has(prefix)) return { status: 'role', reason: `Role-based address (${prefix}@) — lower reply rates, but will send` }

  return { status: 'ready', reason: 'Ready to send' }
}

export async function POST(req: NextRequest) {
  const { leads } = await req.json()
  if (!Array.isArray(leads)) return NextResponse.json({ ok: false, error: 'leads array required' }, { status: 400 })

  const results = leads.map((lead: any) => {
    const check = checkEmail(lead.contactEmail)
    return {
      id: lead.id,
      company: lead.company,
      email: lead.contactEmail || null,
      ...check,
      willSend: check.status === 'ready' || check.status === 'role',
    }
  })

  const summary = {
    total: results.length,
    ready: results.filter(r => r.status === 'ready').length,
    role: results.filter(r => r.status === 'role').length,
    personal: results.filter(r => r.status === 'personal').length,
    edu: results.filter(r => r.status === 'edu').length,
    missing: results.filter(r => r.status === 'missing').length,
    willSend: results.filter(r => r.willSend).length,
    blocked: results.filter(r => !r.willSend).length,
  }

  return NextResponse.json({ ok: true, results, summary })
}
