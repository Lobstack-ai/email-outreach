import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { lead, senderName } = await req.json()

  const prompt = `Write a cold B2B email for Lobstack (lobstack.ai) — deploy autonomous AI agents on isolated VMs with persistent memory + 100+ integrations in under 90 seconds. No DevOps required.

Target company: ${lead.company} (${lead.companyType})
Website: ${lead.website || 'N/A'}
GitHub: ${lead.githubOrgUrl || 'N/A'}
AI tools they use: ${lead.aiTools || 'AI/ML tools'}
About: ${lead.notes || lead.company}

Rules:
- Subject: ≤8 words, specific, no emoji, avoid clichés like "quick question"
- Body: 4-5 sentences MAX. Technical peer-to-peer tone. No "Hope this finds you well."
- Reference their specific work (GitHub repos, what they build)
- Pain point: running AI agents in production = infra hell, memory issues, integration nightmares
- CTA: single clear ask — 15-min call or free trial at lobstack.ai
- Sign off as: ${senderName || 'The Lobstack Team'} @ lobstack.ai

Return ONLY valid JSON, no markdown: {"subject":"...","body":"..."}`

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        system: 'You write cold B2B outreach emails. Respond ONLY with valid JSON.',
        messages: [{ role: 'user', content: prompt }],
      }),
    })
    const data = await res.json()
    const raw = data.content?.[0]?.text || ''
    const clean = raw.replace(/```json|```/g, '').trim()
    const match = clean.match(/\{[\s\S]*\}/)
    if (!match) throw new Error('No JSON in response')
    const parsed = JSON.parse(match[0])
    if (!parsed.subject || !parsed.body) throw new Error('Missing subject or body')
    return NextResponse.json({ ok: true, subject: parsed.subject, body: parsed.body })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 })
  }
}
