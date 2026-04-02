// Manual inbox scan — same logic as sequence-tick but scans ALL messages (read + unread)
// 60-day lookback to catch any missed replies or bounces
import { NextRequest, NextResponse } from 'next/server'
import { ImapFlow } from 'imapflow'

const BASE  = 'appnF2fNAyEYnscvo'
const LEADS = `https://api.airtable.com/v0/${BASE}/tblMgthKziXfnIPBV`
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
  return raw.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 3000)
}

export async function POST(req: NextRequest) {
  const { days = 60 } = await req.json().catch(() => ({}))

  try {
    // Load all sent leads
    let offset: string | undefined
    const leads: any[] = []
    do {
      const data = await fetch(`${LEADS}?pageSize=100${offset ? `&offset=${offset}` : ''}`, {
        headers: { Authorization: `Bearer ${AT()}` }, next: { revalidate: 0 }
      }).then(r => r.json())
      leads.push(...(data.records || []))
      offset = data.offset
    } while (offset)

    const contactEmails = new Set<string>()
    const emailToRecord = new Map<string, any>()
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
    const found: { type: 'reply'|'bounce'; company: string; email: string; subject: string; preview: string }[] = []

    const client = new ImapFlow({
      host: 'mail.privateemail.com', port: 993, secure: true,
      auth: { user: host, pass }, logger: false, tls: { rejectUnauthorized: false },
    })

    await client.connect()
    await client.mailboxOpen('INBOX')

    const since = new Date(Date.now() - days * 86400000)
    // Scan ALL messages — read and unread
    const uids = await client.search({ since })
    const msgList = Array.isArray(uids) ? uids : []

    const newReplies: string[] = []
    const newBounces: string[] = []

    if (msgList.length > 0) {
      for await (const msg of client.fetch(msgList, { envelope: true, source: true })) {
        const fromAddr   = msg.envelope?.from?.[0]?.address?.toLowerCase() || ''
        const fromDomain = fromAddr.split('@')[1] || ''
        const subject    = msg.envelope?.subject || ''
        const raw        = msg.source?.toString() || ''
        const text       = extractPlainText(raw)

        if (!fromAddr) continue

        const isNDR = NDR_SENDERS.test(fromAddr) || NDR_SUBJECTS.test(subject)

        if (isNDR) {
          const failed = extractNDRRecipient(text) || extractNDRRecipient(raw) ||
            Array.from(contactEmails).find(e => raw.toLowerCase().includes(e))
          if (failed && contactEmails.has(failed)) {
            const r = emailToRecord.get(failed)
            if (r && !r.fields['Bounced']) {
              // Mark bounced
              await fetch(`${LEADS}/${r.id}`, {
                method: 'PATCH',
                headers: { Authorization: `Bearer ${AT()}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ fields: { 'Bounced': true, 'Bounce Reason': text.slice(0, 200), 'Status': 'New', 'Sequence Status': 'Cold' }, typecast: true }),
              })
              found.push({ type: 'bounce', company: r.fields['Company'] || failed, email: failed, subject, preview: text.slice(0, 100) })
              newBounces.push(failed)
            }
          }
          continue
        }

        // Normal reply
        let matchedEmail = contactEmails.has(fromAddr) ? fromAddr : null
        if (!matchedEmail) {
          const dm = domainToEmails.get(fromDomain) || []
          if (dm.length === 1) matchedEmail = dm[0]
        }

        if (matchedEmail) {
          const r = emailToRecord.get(matchedEmail)
          if (r && !r.fields['Reply Text']) {
            found.push({ type: 'reply', company: r.fields['Company'] || matchedEmail, email: matchedEmail, subject, preview: text.slice(0, 100) })
            newReplies.push(matchedEmail)
          }
        }
      }
    }

    await client.mailboxClose()
    await client.logout()

    return NextResponse.json({
      ok: true,
      scanned: msgList.length,
      found: found.length,
      newReplies: newReplies.length,
      newBounces: newBounces.length,
      details: found,
    })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ ok: false, error: 'Use POST' }, { status: 405 })
}
