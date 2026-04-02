// Manual inbox scan — scans ALL messages (read + unread), full 60-day lookback
// Classifies replies with Claude, writes to Airtable, marks bounces
import { NextRequest, NextResponse } from 'next/server'
import { ImapFlow } from 'imapflow'

const BASE  = 'appnF2fNAyEYnscvo'
const LEADS = `https://api.airtable.com/v0/${BASE}/tblMgthKziXfnIPBV`
const LOG   = `https://api.airtable.com/v0/${BASE}/tbl6olAfEJ479I9oq`
const AT    = () => process.env.AIRTABLE_API_KEY!

const NDR_SENDERS  = /mailer-daemon|postmaster|mail-delivery|delivery.status|bounce/i
const NDR_SUBJECTS = /undeliverable|delivery.fail|returned.mail|bounce|could.not.deliver|non.delivery|failure.notice/i
const NDR_BODY_RE  = /(?:failed recipient|original recipient|final recipient|to:|for)\s*<?([a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,})>?/gi

function extractNDRRecipient(text: string): string | null {
  NDR_BODY_RE.lastIndex = 0
  const m = NDR_BODY_RE.exec(text)
  return m ? m[1].toLowerCase().trim() : null
}

function extractPlainText(raw: string): string {
  const m = raw.match(/Content-Type: text\/plain[\s\S]*?\r\n\r\n([\s\S]*?)(?:\r\n--|$)/i)
  if (m?.[1]?.trim()) return m[1].trim().slice(0, 3000)
  // Try quoted-printable decode for =XX sequences
  const decoded = raw.replace(/=\r\n/g,'').replace(/=([0-9A-F]{2})/gi,(_,h)=>String.fromCharCode(parseInt(h,16)))
  return decoded.replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim().slice(0,3000)
}

async function classifyReply(text: string, company: string) {
  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': process.env.ANTHROPIC_API_KEY!, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514', max_tokens: 500,
        system: 'Classify B2B sales email replies. Respond ONLY with valid JSON, no markdown.',
        messages: [{ role: 'user', content: `Classify this reply to a cold outreach email from ${company}:\n\n"""\n${text.slice(0,1500)}\n"""\n\nIntent:\n- "interested": wants demo, call, pricing, more info\n- "unsubscribe": remove me, not interested, stop\n- "not_now": bad timing, busy, come back later\n- "question": specific product question\n- "other": OOO, wrong person, unclear\n\nReturn JSON: {"intent":"...","summary":"one sentence","suggestedResponse":"2-3 sentences, warm, never start with I"}` }],
      }),
    })
    const d   = await res.json()
    const raw = d.content?.[0]?.text || ''
    const m   = raw.replace(/```json|```/g,'').trim().match(/\{[\s\S]*\}/)
    if (m) return JSON.parse(m[0])
  } catch {}
  return { intent: 'other', summary: 'Reply received', suggestedResponse: '' }
}

async function atPatch(id: string, fields: any) {
  return fetch(`${LEADS}/${id}`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${AT()}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ fields, typecast: true }),
  })
}

async function atLog(fields: any) {
  return fetch(LOG, {
    method: 'POST',
    headers: { Authorization: `Bearer ${AT()}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ records: [{ fields }], typecast: true }),
  })
}

export async function POST(req: NextRequest) {
  const { days = 60 } = await req.json().catch(() => ({}))

  try {
    // Load all sent leads
    let offset: string | undefined
    const leads: any[] = []
    do {
      const data = await fetch(
        `${LEADS}?pageSize=100${offset ? `&offset=${offset}` : ''}`,
        { headers: { Authorization: `Bearer ${AT()}` }, next: { revalidate: 0 } }
      ).then(r => r.json())
      leads.push(...(data.records || []))
      offset = data.offset
    } while (offset)

    const contactEmails  = new Set<string>()
    const emailToRecord  = new Map<string, any>()
    const domainToEmails = new Map<string, string[]>()

    for (const r of leads) {
      const email = r.fields['Contact Email']?.toLowerCase()
      const seq   = r.fields['Sequence Status'] || 'Cold'
      if (email && !['Cold', 'Opted Out'].includes(seq)) {
        contactEmails.add(email)
        emailToRecord.set(email, r)
        const domain = email.split('@')[1]
        if (domain) {
          if (!domainToEmails.has(domain)) domainToEmails.set(domain, [])
          domainToEmails.get(domain)!.push(email)
        }
      }
    }

    const host = process.env.SMTP_EMAIL!
    const pass = process.env.SMTP_PASSWORD!
    const now  = new Date()

    const processed: { type: string; company: string; email: string; subject: string; intent?: string; preview: string }[] = []
    let newReplies = 0, newBounces = 0

    const client = new ImapFlow({
      host: 'mail.privateemail.com', port: 993, secure: true,
      auth: { user: host, pass }, logger: false, tls: { rejectUnauthorized: false },
    })

    await client.connect()
    await client.mailboxOpen('INBOX')

    const since  = new Date(Date.now() - days * 86400000)
    const uids   = await client.search({ since })
    const msgList = Array.isArray(uids) ? uids : []

    for await (const msg of client.fetch(msgList, { envelope: true, source: true })) {
      const fromAddr   = msg.envelope?.from?.[0]?.address?.toLowerCase() || ''
      const fromDomain = fromAddr.split('@')[1] || ''
      const subject    = msg.envelope?.subject || ''
      const raw        = msg.source?.toString() || ''
      const text       = extractPlainText(raw)

      if (!fromAddr) continue

      // ── NDR bounce ──────────────────────────────────────────────────────
      if (NDR_SENDERS.test(fromAddr) || NDR_SUBJECTS.test(subject)) {
        const failed = extractNDRRecipient(text) || extractNDRRecipient(raw) ||
          Array.from(contactEmails).find(e => raw.toLowerCase().includes(e))
        if (failed && contactEmails.has(failed)) {
          const r = emailToRecord.get(failed)
          if (r && !r.fields['Bounced']) {
            await atPatch(r.id, {
              'Bounced':         true,
              'Bounce Reason':   text.slice(0, 200),
              'Bounce Date':     now.toISOString().split('T')[0],
              'Status':          'New',
              'Sequence Status': 'Cold',
            })
            await atLog({
              'Campaign ID':   `BOUNCE-SCAN-${Date.now()}`,
              'Company':       r.fields['Company'] || failed,
              'Contact Email': failed,
              'Subject':       subject,
              'Sequence Step': 'Bounce',
              'Sent At':       now.toISOString(),
              'Result':        'Bounced - NDR (found by inbox scan)',
            })
            processed.push({ type: 'bounce', company: r.fields['Company'] || failed, email: failed, subject, preview: text.slice(0, 100) })
            newBounces++
          }
        }
        try { await client.messageFlagsAdd([msg.seq], ['\\Seen']) } catch {}
        continue
      }

      // ── Normal reply: exact match ────────────────────────────────────
      let matchedEmail = contactEmails.has(fromAddr) ? fromAddr : null

      // Fuzzy: same domain, single lead
      if (!matchedEmail) {
        const dm = domainToEmails.get(fromDomain) || []
        if (dm.length === 1) matchedEmail = dm[0]
      }

      if (!matchedEmail) continue

      const r = emailToRecord.get(matchedEmail)
      if (!r) continue

      // Skip if already has reply text (already processed)
      if (r.fields['Reply Text']) continue

      const company = r.fields['Company'] || matchedEmail
      const classification = await classifyReply(text, company)

      const statusMap: Record<string,string> = {
        interested: 'Replied', unsubscribe: 'Opted Out',
        not_now: 'Replied', question: 'Replied', other: 'Replied',
      }

      await atPatch(r.id, {
        'Status':           statusMap[classification.intent] || 'Replied',
        'Sequence Status':  statusMap[classification.intent] || 'Replied',
        'Last Contacted':   now.toISOString().split('T')[0],
        'Reply Text':       text.slice(0, 5000),
        'Reply Date':       now.toISOString().split('T')[0],
        'Reply Intent':     classification.intent,
        'Suggested Reply':  classification.suggestedResponse,
        'Personalization Notes':
          `[REPLY ${now.toLocaleDateString()} — ${classification.intent.toUpperCase()}]\n` +
          `${classification.summary}\n\nSuggested:\n${classification.suggestedResponse}`,
      })

      await atLog({
        'Campaign ID':   `REPLY-SCAN-${Date.now()}`,
        'Company':       company,
        'Contact Email': matchedEmail,
        'Subject':       `REPLY: ${subject}`,
        'Sequence Step': `Reply (${classification.intent})`,
        'Sent At':       now.toISOString(),
        'Result':        classification.intent === 'interested' ? 'Replied - Interested'
                       : classification.intent === 'unsubscribe' ? 'Unsubscribed'
                       : `Replied - ${classification.intent}`,
      })

      try { await client.messageFlagsAdd([msg.seq], ['\\Seen']) } catch {}

      processed.push({ type: 'reply', company, email: matchedEmail, subject, intent: classification.intent, preview: text.slice(0, 120) })
      newReplies++
    }

    await client.mailboxClose()
    await client.logout()

    return NextResponse.json({
      ok: true,
      scanned:    msgList.length,
      found:      processed.length,
      newReplies,
      newBounces,
      details:    processed,
    })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ ok: false, error: 'Use POST' }, { status: 405 })
}
