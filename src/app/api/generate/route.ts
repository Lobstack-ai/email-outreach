import { NextRequest, NextResponse } from 'next/server'

// ── Email quality rules applied to every generation ──────────────────────────
const SYSTEM_PROMPT = `You are an expert B2B cold email copywriter who has studied the best-performing outbound emails at companies like Linear, Stripe, and Vercel. You write emails that:

1. Sound like a real person wrote them — not a robot, not a template
2. Are genuinely specific to the recipient — reference what they actually build
3. Are short (4-6 sentences max for cold, 2-3 for follow-ups)
4. Never use: "Hope this finds you well", "I wanted to reach out", "touching base", "circling back", "synergy", "game-changer", "revolutionary", "quick question"
5. Never start with "I" — start with "You", "Your", "We noticed", or a direct observation
6. Have one clear, non-pushy CTA — never multiple asks
7. Pass spam filters: no ALL CAPS, no excessive punctuation, no "FREE" or "LIMITED TIME"
8. Feel like a peer-to-peer message from a fellow technical founder, not a sales pitch

Respond ONLY with valid JSON, no markdown fences, no explanation.`

function buildColdEmailPrompt(lead: any, senderName: string): string {
  return `Write a cold outreach email FROM Lobstack (lobstack.ai) TO a decision maker at ${lead.company}.

ABOUT LOBSTACK:
Lobstack deploys autonomous AI agents on isolated VMs with persistent memory and 100+ integrations in under 90 seconds. Zero DevOps required. Built for teams shipping AI to production.

ABOUT THE RECIPIENT'S COMPANY:
- Company: ${lead.company} (${lead.companyType})
- What they build: ${lead.description || lead.notes || 'AI/ML tooling'}
- Top repos: ${lead.topRepos || lead.githubOrgUrl || 'N/A'}
- AI tools they use: ${lead.aiTools || 'AI/ML stack'}
- GitHub: ${lead.githubStars ? `${lead.githubStars.toLocaleString()} stars` : ''} ${lead.githubForks ? `· ${lead.githubForks} forks` : ''} ${lead.orgMembers ? `· ${lead.orgMembers} org members` : ''}
- Website: ${lead.website || 'N/A'}
- Contact: ${lead.contactName ? `${lead.contactName}${lead.jobTitle ? ` (${lead.jobTitle})` : ''}` : 'decision maker'}

WRITING RULES:
- Subject: 4-7 words, curiosity-driven, no question marks, highly specific to their work
- Body: 4-6 sentences. No filler. Reference their specific repos/products by name.
- Pain point angle: building AI agents in production means infrastructure hell, memory persistence nightmares, integration bottlenecks — Lobstack kills all of that
- CTA: "Worth a 15-minute call?" or "Want to see it in action on [their repo/product]?" — pick whichever fits
- Sign off: ${senderName} @ lobstack.ai
- Tone: peer technical founder talking to another technical founder. Warm but direct.

Return JSON: {"subject":"...","body":"..."}`
}

function buildFollowUp1Prompt(lead: any, coldEmailSubject: string, senderName: string): string {
  return `Write follow-up email #1 (sent 4-5 days after cold email got no reply) for Lobstack outreach to ${lead.company}.

Context:
- Original subject line was: "${coldEmailSubject}"
- They haven't replied but haven't unsubscribed
- Company: ${lead.company} — ${lead.description || lead.notes || 'AI tooling'}
- Their top repos: ${lead.topRepos || 'N/A'}

Rules for follow-up #1:
- Thread the original email (reply to same thread, so no need to re-explain everything)
- 2-3 sentences MAX — they're busy, get to the point
- New angle: offer something specific — a demo on their actual repo, a quick screen share, a case study
- Don't be apologetic or needy ("just following up", "wanted to check in")  
- Make it easy to say yes: "5 minutes on Thursday?" is better than "when are you free?"
- Subject should be "Re: [original subject]" style

Return JSON: {"subject":"Re: ${coldEmailSubject}","body":"..."}`
}

function buildFollowUp2Prompt(lead: any, coldEmailSubject: string, senderName: string): string {
  return `Write follow-up email #2 (sent 7-9 days after follow-up #1, still no reply) for Lobstack outreach to ${lead.company}.

Context:
- Original subject: "${coldEmailSubject}"
- 2 emails sent with no reply
- Company: ${lead.company} — ${lead.description || lead.notes || 'AI tooling'}

Rules for follow-up #2 (the "breakup" email):
- This is the last email in the sequence — make it clear, friendly, no hard feelings
- 2 sentences MAX
- Give them an easy out: "No worries if timing's off — I'll leave it here"
- Include ONE final value hook or insight relevant to their specific work
- No passive aggression, no guilt-tripping
- Lighthearted closing — these are founders/engineers, they appreciate directness

Return JSON: {"subject":"Re: ${coldEmailSubject}","body":"..."}`
}

// ── API handler ───────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const { lead, senderName = 'The Lobstack Team', mode = 'all' } = await req.json()

  const callClaude = async (prompt: string, maxTokens = 600) => {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key':           process.env.ANTHROPIC_API_KEY!,
        'anthropic-version':   '2023-06-01',
      },
      body: JSON.stringify({
        model:      'claude-sonnet-4-20250514',
        max_tokens: maxTokens,
        system:     SYSTEM_PROMPT,
        messages:   [{ role: 'user', content: prompt }],
      }),
    })
    const data = await res.json()
    const raw  = data.content?.[0]?.text || ''
    const match = raw.replace(/```json|```/g, '').trim().match(/\{[\s\S]*\}/)
    if (!match) throw new Error('No JSON in Claude response')
    return JSON.parse(match[0])
  }

  try {
    // Mode 'cold' — just generate the initial cold email
    if (mode === 'cold') {
      const result = await callClaude(buildColdEmailPrompt(lead, senderName))
      if (!result.subject || !result.body) throw new Error('Missing subject or body')
      return NextResponse.json({ ok: true, subject: result.subject, body: result.body })
    }

    // Mode 'all' — generate cold email + both follow-ups in sequence
    // Step 1: cold email
    const cold = await callClaude(buildColdEmailPrompt(lead, senderName))
    if (!cold.subject || !cold.body) throw new Error('Cold email generation failed')

    // Step 2: follow-up 1 (uses cold subject for threading)
    const fu1 = await callClaude(buildFollowUp1Prompt(lead, cold.subject, senderName), 400)

    // Step 3: follow-up 2 (breakup email)
    const fu2 = await callClaude(buildFollowUp2Prompt(lead, cold.subject, senderName), 300)

    return NextResponse.json({
      ok:      true,
      // Cold email
      subject: cold.subject,
      body:    cold.body,
      // Follow-ups
      followUp1Subject: fu1.subject || `Re: ${cold.subject}`,
      followUp1Body:    fu1.body || '',
      followUp2Subject: fu2.subject || `Re: ${cold.subject}`,
      followUp2Body:    fu2.body || '',
    })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 })
  }
}
