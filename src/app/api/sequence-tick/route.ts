import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'
import { ImapFlow } from 'imapflow'
import { sendDiscordNotification } from '@/lib/discord'

const BASE   = 'appnF2fNAyEYnscvo'
const LEADS  = 'tblMgthKziXfnIPBV'
const LOGID  = 'tbl6olAfEJ479I9oq'
const AT     = () => process.env.AIRTABLE_API_KEY!

const FU1_DAYS = 5   // days after cold email before FU1 fires
const FU2_DAYS = 7   // days after FU1 before FU2 fires

// ── Airtable helpers ──────────────────────────────────────────────────────────
async function atGet(path: string) {
  const r = await fetch(`https://api.airtable.com/v0/${BASE}/${path}`, {
    headers: { Authorization: `Bearer ${AT()}` },
  })
  if (!r.ok) throw new Error(`AT GET ${r.status}`)
  return r.json()
}

async function atPatch(recordId: string, fields: Record<string, any>) {
  await fetch(`https://api.airtable.com/v0/${BASE}/${LEADS}/${recordId}`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${AT()}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ fields, typecast: true }),
  })
}

async function atLog(fields: Record<string, any>) {
  await fetch(`https://api.airtable.com/v0/${BASE}/${LOGID}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${AT()}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ records: [{ fields }], typecast: true }),
  })
}

// ── Email send ────────────────────────────────────────────────────────────────
async function sendEmail(to: string, subject: string, body: string, recordId?: string) {
  const from    = process.env.SMTP_EMAIL!
  const pass    = process.env.SMTP_PASSWORD!
  const appUrl  = process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : 'https://email-outreach-rosy.vercel.app'
  const pixel   = recordId
    ? `<img src="${appUrl}/api/track/${recordId}" width="1" height="1" style="display:none" alt=""/>`
    : ''

  const t = nodemailer.createTransport({
    host: 'mail.privateemail.com', port: 587, secure: false,
    auth: { user: from, pass },
    tls: { rejectUnauthorized: false },
    connectionTimeout: 15000, socketTimeout: 15000,
  })
  await t.verify()
  const info = await t.sendMail({
    from:    `Brandon @ Lobstack <${from}>`,
    replyTo: `Brandon @ Lobstack <${from}>`,
    to, subject,
    text: body + '\n\n---\nTo unsubscribe reply with "unsubscribe".',
    html: `<div style="font-family:Arial,sans-serif;font-size:14px;line-height:1.6;max-width:600px">
      ${body.replace(/\n\n/g,'</p><p>').replace(/\n/g,'<br>').replace(/^/,'<p>').replace(/$/,'</p>')}
      <p style="margin-top:32px;padding-top:16px;border-top:1px solid #eee;font-size:11px;color:#999">
        To unsubscribe, reply with "unsubscribe".</p>${pixel}</div>`,
    headers: { 'List-Unsubscribe': `<mailto:${from}?subject=unsubscribe>`, 'Precedence': 'bulk' },
  })
  t.close()
  return info.messageId
}

// ── IMAP reply checker ────────────────────────────────────────────────────────
// Connects to PrivateEmail IMAP, reads unseen messages, matches to leads
async function checkInboxForReplies(
  contactEmails: Set<string>,
  since: Date
): Promise<{ from: string; subject: string; text: string }[]> {
  const host  = process.env.SMTP_EMAIL!
  const pass  = process.env.SMTP_PASSWORD!
  const replies: { from: string; subject: string; text: string }[] = []

  const client = new ImapFlow({
    host: 'mail.privateemail.com',
    port: 993,
    secure: true,
    auth: { user: host, pass },
    logger: false,
    tls: { rejectUnauthorized: false },
  })

  try {
    await client.connect()
    await client.mailboxOpen('INBOX')

    // Search for unseen messages since our last check
    const sinceStr = since.toISOString().split('T')[0]
    const searchResult = await client.search({ seen: false, since: new Date(sinceStr) })
    const msgs = Array.isArray(searchResult) ? searchResult : []

    if (msgs.length > 0) {
      for await (const msg of client.fetch(msgs, { envelope: true, bodyStructure: true, source: true })) {
        const fromAddr = msg.envelope?.from?.[0]?.address?.toLowerCase() || ''
        if (!fromAddr) continue

        // Check if this is from one of our lead contact emails
        if (!contactEmails.has(fromAddr)) continue

        // Extract plain text body
        const raw    = msg.source?.toString() || ''
        const text   = extractPlainText(raw)
        const subject = msg.envelope?.subject || ''

        replies.push({ from: fromAddr, subject, text })

        // Mark as seen so we don't process it again
        await client.messageFlagsAdd([msg.seq], ['\\Seen'])
      }
    }

    await client.mailboxClose()
    await client.logout()
  } catch (e: any) {
    console.error('IMAP error:', e.message)
    // Non-fatal — if IMAP fails, follow-up sequencing still runs
    try { await client.logout() } catch {}
  }

  return replies
}

function extractPlainText(raw: string): string {
  // Simple extraction: find text/plain section or strip HTML
  const plainMatch = raw.match(/Content-Type: text\/plain[\s\S]*?\r\n\r\n([\s\S]*?)(?:\r\n--|\r\n\r\nContent-Type:)/i)
  if (plainMatch) return plainMatch[1].trim()

  // Fallback: strip HTML tags
  return raw.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 2000)
}

// ── Claude reply classifier ───────────────────────────────────────────────────
async function classifyReply(replyText: string, company: string): Promise<{
  intent: 'interested' | 'unsubscribe' | 'not_now' | 'question' | 'other'
  summary: string
  suggestedResponse: string
}> {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY!,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 500,
      system: 'Classify B2B sales email replies and draft short responses. Respond ONLY with valid JSON.',
      messages: [{ role: 'user', content: `Classify this reply to a cold outreach email from ${company}:

"""
${replyText.slice(0, 1000)}
"""

Intent options: "interested" (wants demo/call/more info), "unsubscribe" (remove me/not interested/stop), "not_now" (timing off/busy/later), "question" (specific product question), "other"

Return JSON: {"intent":"...","summary":"one sentence","suggestedResponse":"2-3 sentence reply, never start with I, warm but direct"}` }],
    }),
  })
  const d = await res.json()
  const raw = d.content?.[0]?.text || ''
  const match = raw.replace(/```json|```/g, '').trim().match(/\{[\s\S]*\}/)
  if (!match) return { intent: 'other', summary: 'Reply received', suggestedResponse: '' }
  return JSON.parse(match[0])
}

// ── Days since a date string ──────────────────────────────────────────────────
function daysSince(dateStr: string): number {
  if (!dateStr) return 0
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000)
}

// ── Main cron handler ─────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  // Vercel automatically sets the authorization header for cron jobs
  const auth = req.headers.get('authorization')
  const secret = process.env.CRON_SECRET
  if (secret && auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const results = { repliesFound: 0, fu1Sent: 0, fu2Sent: 0, skipped: 0, errors: 0 }
  const hotReplies: { company: string; intent: string; email: string }[] = []
  const now = new Date()

  try {
    // ── 1. Load all active sequence leads from Airtable ──────────────────────
    let offset: string | undefined
    const leads: any[] = []
    do {
      const data = await atGet(`${LEADS}?pageSize=100${offset ? `&offset=${offset}` : ''}`)
      leads.push(...(data.records || []))
      offset = data.offset
    } while (offset)

    // Build a set of all contact emails we've sent to (for reply matching)
    const activeLookup = new Map<string, any>() // email → record
    for (const r of leads) {
      const email = r.fields['Contact Email']?.toLowerCase()
      const seq   = r.fields['Sequence Status'] || 'Cold'
      if (email && !['Cold', 'Opted Out'].includes(seq)) {
        activeLookup.set(email, r)
      }
    }

    // ── 2. Check inbox for replies ────────────────────────────────────────────
    if (activeLookup.size > 0 && process.env.SMTP_EMAIL && process.env.SMTP_PASSWORD) {
      const since = new Date(now.getTime() - 14 * 86400000) // look back 14 days
      const replies = await checkInboxForReplies(new Set(activeLookup.keys()), since)

    for (const reply of replies) {
        const record = activeLookup.get(reply.from.toLowerCase())
        if (!record) continue

        const company = record.fields['Company'] || reply.from
        const classification = await classifyReply(reply.text, company)

        const statusMap: Record<string, string> = {
          interested:  'Replied',
          unsubscribe: 'Opted Out',
          not_now:     'Replied',
          question:    'Replied',
          other:       'Replied',
        }

        await atPatch(record.id, {
          'Status':           statusMap[classification.intent] || 'Replied',
          'Sequence Status':  statusMap[classification.intent] || 'Replied',
          'Last Contacted':   now.toISOString().split('T')[0],
          // Structured reply fields (used by Inbox tab)
          'Reply Text':       reply.text.slice(0, 5000),
          'Reply Intent':     classification.intent,
          'Suggested Reply':  classification.suggestedResponse,
          // Also keep in Personalization Notes for backwards compat
          'Personalization Notes':
            `[REPLY ${now.toLocaleDateString()} — ${classification.intent.toUpperCase()}]\n` +
            `${classification.summary}\n\n` +
            `Suggested response:\n${classification.suggestedResponse}`,
        })

        await atLog({
          'Campaign ID':   `REPLY-${Date.now()}`,
          'Company':       company,
          'Contact Email': reply.from,
          'Subject':       `REPLY: ${reply.subject}`,
          'Sequence Step': `Reply (${classification.intent})`,
          'Sent At':       now.toISOString(),
          'Result':        classification.intent === 'interested' ? 'Replied - Interested'
                         : classification.intent === 'unsubscribe' ? 'Unsubscribed'
                         : `Replied - ${classification.intent}`,
        })

        // Send immediate Discord alert for each reply
        sendDiscordNotification({
          type:          'new_reply',
          company,
          contactName:   record.fields['Contact Name'] || '',
          email:         reply.from,
          intent:        classification.intent,
          summary:       classification.summary,
          suggestedReply: classification.suggestedResponse,
        }).catch(() => {})

        hotReplies.push({ company, intent: classification.intent, email: reply.from })
        activeLookup.delete(reply.from.toLowerCase())
        results.repliesFound++
      }
    }

    // ── 3. Fire follow-up emails ──────────────────────────────────────────────
    for (const record of leads) {
      const f          = record.fields
      const seq        = f['Sequence Status'] || 'Cold'
      const email      = f['Contact Email']
      const lastDate   = f['Last Contacted']

      // Skip opted-out, replied, booked, or no email
      if (['Replied', 'Booked', 'Opted Out'].includes(seq)) { results.skipped++; continue }
      if (!email) { results.skipped++; continue }

      // FU1: fires 5 days after cold email
      if (seq === 'Email 1 Sent' && f['Follow-up 1 Body'] && f['Follow-up 1 Subject']) {
        if (daysSince(lastDate) >= FU1_DAYS) {
          try {
            const msgId = await sendEmail(email, f['Follow-up 1 Subject'], f['Follow-up 1 Body'], record.id)
            await atPatch(record.id, {
              'Sequence Status': 'Follow-up 1 Sent',
              'Status':          'Email Sent',
              'Last Contacted':  now.toISOString().split('T')[0],
              'Follow Up #':     2,
            })
            await atLog({
              'Campaign ID':   `FU1-${Date.now()}`,
              'Company':       f['Company'] || '',
              'Contact Email': email,
              'Subject':       f['Follow-up 1 Subject'],
              'Sequence Step': 'Follow-up 1',
              'Sent At':       now.toISOString(),
              'Message ID':    msgId,
              'Result':        'Sent',
            })
            results.fu1Sent++
            await new Promise(r => setTimeout(r, 5000)) // 5s cooldown
          } catch (e: any) {
            console.error(`FU1 error for ${f['Company']}: ${e.message}`)
            results.errors++
          }
        } else {
          results.skipped++
        }
        continue
      }

      // FU2: fires 7 days after FU1
      if (seq === 'Follow-up 1 Sent' && f['Follow-up 2 Body'] && f['Follow-up 2 Subject']) {
        if (daysSince(lastDate) >= FU2_DAYS) {
          try {
            const msgId = await sendEmail(email, f['Follow-up 2 Subject'], f['Follow-up 2 Body'], record.id)
            await atPatch(record.id, {
              'Sequence Status': 'Follow-up 2 Sent',
              'Status':          'Email Sent',
              'Last Contacted':  now.toISOString().split('T')[0],
              'Follow Up #':     3,
            })
            await atLog({
              'Campaign ID':   `FU2-${Date.now()}`,
              'Company':       f['Company'] || '',
              'Contact Email': email,
              'Subject':       f['Follow-up 2 Subject'],
              'Sequence Step': 'Follow-up 2',
              'Sent At':       now.toISOString(),
              'Message ID':    msgId,
              'Result':        'Sent',
            })
            results.fu2Sent++
            await new Promise(r => setTimeout(r, 5000))
          } catch (e: any) {
            console.error(`FU2 error for ${f['Company']}: ${e.message}`)
            results.errors++
          }
        } else {
          results.skipped++
        }
      }
    }

    // Send Discord cron summary (replaces email summary)
    const anythingHappened = results.repliesFound > 0 || results.fu1Sent > 0 || results.fu2Sent > 0 || results.errors > 0
    if (anythingHappened) {
      sendDiscordNotification({
        type:         'cron_summary',
        leadsChecked: leads.length,
        repliesFound: results.repliesFound,
        fu1Sent:      results.fu1Sent,
        fu2Sent:      results.fu2Sent,
        errors:       results.errors,
        hotReplies,
      }).catch(() => {})
    }

    return NextResponse.json({
      ok: true,
      timestamp: now.toISOString(),
      leadsChecked: leads.length,
      ...results,
    })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 })
  }
}
