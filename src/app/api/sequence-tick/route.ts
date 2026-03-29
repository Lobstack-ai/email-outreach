import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'

const BASE    = 'appnF2fNAyEYnscvo'
const LEADS   = 'tblMgthKziXfnIPBV'
const AT_KEY  = () => process.env.AIRTABLE_API_KEY!
const CRON_SECRET = process.env.CRON_SECRET

// Days after initial send before each follow-up fires
const FU1_DAYS = 5
const FU2_DAYS = 12

async function atGet(path: string) {
  const r = await fetch(`https://api.airtable.com/v0/${BASE}/${path}`, {
    headers: { Authorization: `Bearer ${AT_KEY()}` },
  })
  if (!r.ok) throw new Error(`Airtable GET ${r.status}`)
  return r.json()
}

async function atPatch(recordId: string, fields: Record<string, any>) {
  const r = await fetch(`https://api.airtable.com/v0/${BASE}/${LEADS}/${recordId}`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${AT_KEY()}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ fields, typecast: true }),
  })
  if (!r.ok) throw new Error(`Airtable PATCH ${r.status}`)
  return r.json()
}

async function sendEmail(to: string, subject: string, body: string) {
  const from  = process.env.SMTP_EMAIL!
  const pass  = process.env.SMTP_PASSWORD!
  const t = nodemailer.createTransport({
    host: 'mail.privateemail.com', port: 587, secure: false,
    auth: { user: from, pass },
    tls: { rejectUnauthorized: false },
  })
  await t.verify()
  const info = await t.sendMail({
    from: `The Lobstack Team <${from}>`,
    to, subject,
    text: body + '\n\n---\nTo unsubscribe reply with "unsubscribe".',
    html: `<div style="font-family:Arial,sans-serif;font-size:14px;line-height:1.6;max-width:600px">
      ${body.replace(/\n\n/g,'</p><p>').replace(/\n/g,'<br>').replace(/^/,'<p>').replace(/$/,'</p>')}
      <p style="margin-top:32px;padding-top:16px;border-top:1px solid #eee;font-size:11px;color:#999">
        To unsubscribe, reply with "unsubscribe".
      </p></div>`,
    headers: {
      'List-Unsubscribe': `<mailto:${from}?subject=unsubscribe>`,
      'Precedence': 'bulk',
    },
  })
  t.close()
  return info.messageId
}

function daysSince(dateStr: string): number {
  if (!dateStr) return 0
  const d = new Date(dateStr)
  const now = new Date()
  return Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24))
}

export async function GET(req: NextRequest) {
  // Verify this is called by Vercel Cron or with the cron secret
  const authHeader = req.headers.get('authorization')
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const results = { fu1Sent: 0, fu2Sent: 0, skipped: 0, errors: 0 }

  try {
    // Fetch all leads that are in an active sequence
    // We page through all records looking for ones that need action
    let offset: string | undefined
    const leads: any[] = []
    do {
      const qs = offset
        ? `pageSize=100&offset=${offset}`
        : `pageSize=100`
      const data = await atGet(`${LEADS}?${qs}`)
      leads.push(...(data.records || []))
      offset = data.offset
    } while (offset)

    const now = new Date()

    for (const record of leads) {
      const f = record.fields
      const seqStatus     = f['Sequence Status'] || 'Cold'
      const contactEmail  = f['Contact Email']
      const lastContacted = f['Last Contacted']
      const fu1Subject    = f['Follow-up 1 Subject']
      const fu1Body       = f['Follow-up 1 Body']
      const fu2Subject    = f['Follow-up 2 Subject']
      const fu2Body       = f['Follow-up 2 Body']

      // Skip if opted out, replied, booked, or no contact email
      if (['Replied', 'Booked', 'Opted Out'].includes(seqStatus)) {
        results.skipped++
        continue
      }
      if (!contactEmail) { results.skipped++; continue }

      // Check if FU1 should fire
      if (seqStatus === 'Email 1 Sent' && fu1Subject && fu1Body) {
        const days = daysSince(lastContacted)
        if (days >= FU1_DAYS) {
          try {
            const msgId = await sendEmail(contactEmail, fu1Subject, fu1Body)
            await atPatch(record.id, {
              'Sequence Status': 'Follow-up 1 Sent',
              'Last Contacted':  now.toISOString().split('T')[0],
              'Follow Up #':     2,
              'Status':          'Email Sent',
            })
            // Log to Campaign Log
            await fetch(`https://api.airtable.com/v0/${BASE}/tbl6olAfEJ479I9oq`, {
              method: 'POST',
              headers: { Authorization: `Bearer ${AT_KEY()}`, 'Content-Type': 'application/json' },
              body: JSON.stringify({
                records: [{ fields: {
                  'Campaign ID':   `SEQ-FU1-${Date.now()}`,
                  'Company':       f['Company'] || '',
                  'Contact Email': contactEmail,
                  'Subject':       fu1Subject,
                  'Sequence Step': 'Follow-up 1',
                  'Sent At':       now.toISOString(),
                  'Message ID':    msgId,
                  'Result':        'Sent',
                }}],
                typecast: true,
              }),
            })
            results.fu1Sent++
          } catch (e: any) {
            console.error(`FU1 error for ${f['Company']}: ${e.message}`)
            results.errors++
          }
          // Cooldown between sends
          await new Promise(r => setTimeout(r, 5000))
        } else {
          results.skipped++
        }
        continue
      }

      // Check if FU2 should fire
      if (seqStatus === 'Follow-up 1 Sent' && fu2Subject && fu2Body) {
        const days = daysSince(lastContacted)
        if (days >= (FU2_DAYS - FU1_DAYS)) { // days since FU1 was sent
          try {
            const msgId = await sendEmail(contactEmail, fu2Subject, fu2Body)
            await atPatch(record.id, {
              'Sequence Status': 'Follow-up 2 Sent',
              'Last Contacted':  now.toISOString().split('T')[0],
              'Follow Up #':     3,
              'Status':          'Email Sent',
            })
            await fetch(`https://api.airtable.com/v0/${BASE}/tbl6olAfEJ479I9oq`, {
              method: 'POST',
              headers: { Authorization: `Bearer ${AT_KEY()}`, 'Content-Type': 'application/json' },
              body: JSON.stringify({
                records: [{ fields: {
                  'Campaign ID':   `SEQ-FU2-${Date.now()}`,
                  'Company':       f['Company'] || '',
                  'Contact Email': contactEmail,
                  'Subject':       fu2Subject,
                  'Sequence Step': 'Follow-up 2',
                  'Sent At':       now.toISOString(),
                  'Message ID':    msgId,
                  'Result':        'Sent',
                }}],
                typecast: true,
              }),
            })
            results.fu2Sent++
          } catch (e: any) {
            console.error(`FU2 error for ${f['Company']}: ${e.message}`)
            results.errors++
          }
          await new Promise(r => setTimeout(r, 5000))
        } else {
          results.skipped++
        }
      }
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
