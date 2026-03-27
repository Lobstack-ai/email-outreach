import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'

export async function POST(req: NextRequest) {
  const { email, password } = await req.json()
  if (!email || !password) {
    return NextResponse.json({ ok: false, error: 'Email and password required' }, { status: 400 })
  }

  const transporter = nodemailer.createTransport({
    host: 'mail.privateemail.com',
    port: 587,
    secure: false,
    auth: { user: email, pass: password },
    tls: { rejectUnauthorized: false },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 10000,
  })

  try {
    await transporter.verify()
    transporter.close()
    return NextResponse.json({ ok: true, message: 'SMTP auth verified — PrivateEmail connected' })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 400 })
  }
}
