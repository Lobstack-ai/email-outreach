import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'
import { ImapFlow } from 'imapflow'

// Email address validation
function validateEmail(email: string): { valid: boolean; reason?: string; warning?: string } {
  if (!email || !email.includes('@')) return { valid: false, reason: 'Invalid email format' }
  const [prefix, domain] = email.toLowerCase().split('@')
  if (!domain) return { valid: false, reason: 'Invalid email format' }
  const personalDomains = [
    'gmail.com','yahoo.com','hotmail.com','outlook.com','live.com',
    'icloud.com','me.com','mac.com','hey.com','proton.me','protonmail.com',
    'fastmail.com','zoho.com','aol.com','msn.com','ymail.com',
  ]
  if (personalDomains.includes(domain)) return { valid: false, reason: `Personal email (${domain}) — not suitable for B2B outreach` }
  if (domain.endsWith('.edu'))          return { valid: false, reason: `Education email (${domain})` }
  const rolePrefixes = ['hello','info','contact','support','admin','noreply','no-reply','team','sales','marketing']
  if (rolePrefixes.includes(prefix))    return { valid: true, warning: `Role-based address (${prefix}@) — lower reply rate` }
  return { valid: true }
}

// Append a copy to IMAP Sent folder so it appears in PrivateEmail webmail
async function appendToSent(
  user: string, pass: string,
  rawMessage: string
): Promise<void> {
  const client = new ImapFlow({
    host: 'mail.privateemail.com',
    port: 993,
    secure: true,
    auth: { user, pass },
    logger: false,
    tls: { rejectUnauthorized: false },
  })
  try {
    await client.connect()
    // PrivateEmail uses "Sent" as the sent folder name
    const sentFolder = 'Sent'
    await client.append(sentFolder, rawMessage, ['\\Seen'])
    await client.logout()
  } catch (e: any) {
    // Non-fatal — email already sent, just log the IMAP error
    console.error('IMAP append to Sent failed:', e.message)
    try { await client.logout() } catch {}
  }
}

export async function POST(req: NextRequest) {
  const { to, subject, body, fromName, fromEmail, smtpPass, validate } = await req.json()

  // Validation-only mode
  if (validate) {
    const result = validateEmail(to)
    return NextResponse.json({ ok: true, ...result })
  }

  const pass = smtpPass || process.env.SMTP_PASSWORD
  const from = fromEmail || process.env.SMTP_EMAIL
  const name = fromName || process.env.SMTP_NAME || 'Brandon @ Lobstack'

  if (!pass || !from)   return NextResponse.json({ ok: false, error: 'SMTP credentials not configured' }, { status: 400 })
  if (!to || !subject || !body) return NextResponse.json({ ok: false, error: 'Missing to, subject, or body' }, { status: 400 })

  const validation = validateEmail(to)
  if (!validation.valid) return NextResponse.json({ ok: false, error: `Email blocked: ${validation.reason}`, blocked: true }, { status: 400 })

  const htmlBody = `<div style="font-family:Arial,sans-serif;font-size:14px;line-height:1.6;color:#333;max-width:600px">
${body.replace(/\n\n/g,'</p><p>').replace(/\n/g,'<br>').replace(/^/,'<p>').replace(/$/,'</p>')}
<p style="margin-top:32px;padding-top:16px;border-top:1px solid #eee;font-size:11px;color:#999">
  You're receiving this because your company builds with AI tools.<br>
  To unsubscribe, reply with "unsubscribe" and you'll be removed immediately.
</p></div>`

  const transporter = nodemailer.createTransport({
    host: 'mail.privateemail.com',
    port: 587,
    secure: false,
    auth: { user: from, pass },
    tls: { rejectUnauthorized: false },
    connectionTimeout: 15000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
  })

  try {
    await transporter.verify()

    // Build the message first so we can save it to Sent
    const messageOptions = {
      from:    `${name} <${from}>`,
      to,
      subject,
      text:    body + '\n\n---\nTo unsubscribe, reply with "unsubscribe".',
      html:    htmlBody,
      headers: {
        'List-Unsubscribe': `<mailto:${from}?subject=unsubscribe>`,
        'Precedence': 'bulk',
      },
      date: new Date(),
    }

    const info = await transporter.sendMail(messageOptions)
    transporter.close()

    // Save a copy to the IMAP Sent folder so it shows in PrivateEmail webmail
    // Build a minimal RFC822 raw message for IMAP append
    const rawMessage = [
      `From: ${name} <${from}>`,
      `To: ${to}`,
      `Subject: ${subject}`,
      `Date: ${new Date().toUTCString()}`,
      `Message-ID: ${info.messageId}`,
      `MIME-Version: 1.0`,
      `Content-Type: text/plain; charset=UTF-8`,
      ``,
      body + '\n\n---\nTo unsubscribe, reply with "unsubscribe".',
    ].join('\r\n')

    // Append async — don't await, don't block the response
    appendToSent(from, pass, rawMessage).catch(e =>
      console.error('appendToSent background error:', e.message)
    )

    return NextResponse.json({
      ok: true,
      messageId: info.messageId,
      warning: validation.warning || null,
    })
  } catch (e: any) {
    const msg = e.message || ''
    let userError = msg
    if (msg.includes('554') || msg.includes('spam') || msg.includes('JFE')) {
      userError = `PrivateEmail spam filter blocked this send. Try: 1) warm up domain first, 2) reduce frequency, 3) vary content. Raw: ${msg}`
    } else if (msg.includes('535') || msg.includes('auth')) {
      userError = `SMTP auth failed — check SMTP_EMAIL and SMTP_PASSWORD in Vercel`
    } else if (msg.includes('timeout') || msg.includes('ECONNREFUSED')) {
      userError = `SMTP connection failed — PrivateEmail server unreachable`
    }
    return NextResponse.json({ ok: false, error: userError }, { status: 500 })
  }
}
