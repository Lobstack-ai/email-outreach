import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'

// Validate an email address before sending
function validateEmail(email: string): { valid: boolean; reason?: string; warning?: string } {
  if (!email || !email.includes('@')) return { valid: false, reason: 'Invalid email format' }

  const [, domain] = email.toLowerCase().split('@')

  // Block personal/consumer domains for B2B outreach
  const personalDomains = [
    'gmail.com','yahoo.com','hotmail.com','outlook.com','live.com',
    'icloud.com','me.com','mac.com','hey.com','proton.me','protonmail.com',
    'fastmail.com','zoho.com','aol.com','msn.com','ymail.com',
  ]
  if (personalDomains.includes(domain)) {
    return { valid: false, reason: `Personal email domain (${domain}) — not suitable for B2B outreach` }
  }

  // Block edu emails
  if (domain.endsWith('.edu')) {
    return { valid: false, reason: `Education email (${domain}) — not a business contact` }
  }

  // Warn on role-based addresses (still send, but flag)
  const rolePrefix = email.split('@')[0].toLowerCase()
  const rolePrefixes = ['hello','info','contact','support','admin','noreply','no-reply','team','sales','marketing']
  if (rolePrefixes.includes(rolePrefix)) {
    return { valid: true, warning: `Role-based address (${rolePrefix}@) — lower reply rate expected` }
  }

  return { valid: true }
}

export async function POST(req: NextRequest) {
  const { to, subject, body, fromName, fromEmail, smtpPass, validate } = await req.json()

  // Validation-only mode — just check the email without sending
  if (validate) {
    const result = validateEmail(to)
    return NextResponse.json({ ok: true, ...result })
  }

  const pass = smtpPass || process.env.SMTP_PASSWORD
  const from = fromEmail || process.env.SMTP_EMAIL
  const name = fromName || process.env.SMTP_NAME || 'The Lobstack Team'

  if (!pass || !from) {
    return NextResponse.json({ ok: false, error: 'SMTP credentials not configured' }, { status: 400 })
  }
  if (!to || !subject || !body) {
    return NextResponse.json({ ok: false, error: 'Missing to, subject, or body' }, { status: 400 })
  }

  // Pre-send email validation
  const validation = validateEmail(to)
  if (!validation.valid) {
    return NextResponse.json({ ok: false, error: `Email blocked: ${validation.reason}`, blocked: true }, { status: 400 })
  }

  // Build HTML version for better deliverability
  const htmlBody = `<div style="font-family:Arial,sans-serif;font-size:14px;line-height:1.6;color:#333;max-width:600px">
${body.replace(/\n\n/g,'</p><p>').replace(/\n/g,'<br>').replace(/^/,'<p>').replace(/$/,'</p>')}
<p style="margin-top:32px;padding-top:16px;border-top:1px solid #eee;font-size:11px;color:#999">
  You're receiving this because your company builds with AI tools.<br>
  To unsubscribe, reply with "unsubscribe" and you'll be removed immediately.
</p>
</div>`

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
    // Verify connection first
    await transporter.verify()

    const info = await transporter.sendMail({
      from: `${name} <${from}>`,
      replyTo: `${name} <inbound@replies.lobstack.ai>`,
      to,
      subject,
      text: body + '\n\n---\nTo unsubscribe, reply with "unsubscribe".',
      html: htmlBody,
      headers: {
        'X-Mailer': 'Lobstack Outreach',
        'List-Unsubscribe': `<mailto:${from}?subject=unsubscribe>`,
        'Precedence': 'bulk',
      },
    })
    transporter.close()
    return NextResponse.json({
      ok: true,
      messageId: info.messageId,
      warning: validation.warning || null,
    })
  } catch (e: any) {
    // Parse PrivateEmail specific error codes
    const msg = e.message || ''
    let userError = msg
    if (msg.includes('554') || msg.includes('spam') || msg.includes('JFE')) {
      userError = `PrivateEmail spam filter blocked this send. Try: 1) warm up the domain by sending a few manual emails first, 2) reduce send frequency, 3) vary email content more. Raw error: ${msg}`
    } else if (msg.includes('535') || msg.includes('auth')) {
      userError = `SMTP authentication failed — check SMTP_EMAIL and SMTP_PASSWORD in Vercel env vars`
    } else if (msg.includes('timeout') || msg.includes('ECONNREFUSED')) {
      userError = `SMTP connection failed — PrivateEmail server unreachable`
    }
    return NextResponse.json({ ok: false, error: userError }, { status: 500 })
  }
}
