import { NextRequest, NextResponse } from 'next/server'
import { sendDiscordNotification, TEST_PAYLOAD, type NotifyPayload } from '@/lib/discord'

// POST — called by other routes or external services
export async function POST(req: NextRequest) {
  const payload = await req.json() as NotifyPayload
  const ok = await sendDiscordNotification(payload)
  return NextResponse.json({ ok })
}

// GET — sends a test notification to verify the webhook is working
export async function GET() {
  const ok = await sendDiscordNotification(TEST_PAYLOAD)
  return NextResponse.json({
    ok,
    message: ok
      ? 'Test notification sent to Discord ✓'
      : 'DISCORD_WEBHOOK_URL not configured — add it in Vercel env vars',
  })
}
