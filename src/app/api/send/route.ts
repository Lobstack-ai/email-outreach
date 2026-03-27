import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'

export async function POST(req: NextRequest) {
  const { to, subject, body, fromName, fromEmail, smtpPass } = await req.json()

  const pass = smtpPass || process.env.SMTP_PASSWORD
  const from = fromEmail || process.env.SMTP_EMAIL

  if (!pass || !from) {
    return NextResponse.json({ ok: false, error: 'SMTP credentials not configured' }, { status: 400 })
  }

  const transporter = nodemailer.createTransport({
    host: 'mail.privateemail.com',
    port: 587,
    secure: false,
    auth: { user: from, pass },
    tls: { rejectUnauthorized: false },
  })

  try {
    const info = await transporter.sendMail({
      from: `${fromName || 'The Lobstack Team'} <${from}>`,
      to,
      subject,
      text: body,
    })
    transporter.close()
    return NextResponse.json({ ok: true, messageId: info.messageId })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 })
  }
}
