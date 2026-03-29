import { NextRequest, NextResponse } from 'next/server'

const SYSTEM_PROMPT = `You are an expert B2B cold email copywriter. You write emails that get replies from technical founders, CTOs, and VPs Engineering. You have studied every high-performing cold email sent at Linear, Vercel, Stripe, and Superhuman.

HARD RULES — violating any of these is a failure:
- NEVER use dashes or hyphens as connectors (no em dashes, no " — ", no " - " between clauses). Use periods or commas instead.
- NEVER start a sentence with "I"
- NEVER say: "Hope this finds you well", "I wanted to reach out", "touching base", "circling back", "following up", "just checking in", "wanted to see", "quick question", "synergy", "game-changer", "revolutionary", "streamline", "leverage", "utilize", "pain points"
- NEVER use ALL CAPS anywhere
- NEVER use more than one exclamation mark in the entire email
- NEVER give the recipient two equal choices ("book a call OR try the trial") — one primary ask, one quiet secondary
- NEVER write more than 6 sentences in a cold email body
- NEVER write more than 3 sentences in a follow-up body
- Keep sentences short. Under 20 words each.

TONE: A peer technical founder writing to another technical founder. Warm, direct, specific. Not a salesperson.

Respond ONLY with valid JSON. No markdown fences. No explanation.`

function buildColdEmailPrompt(lead: any, senderName: string): string {
  return `Write a cold outreach email FROM Lobstack (lobstack.ai) TO a decision maker at ${lead.company}.

ABOUT LOBSTACK:
Lobstack is a subscription platform that deploys autonomous AI agents on isolated VMs with persistent memory and 100+ integrations in under 90 seconds. Zero DevOps required. Built for teams shipping AI to production. Pricing is subscription-based.

ABOUT THE RECIPIENT:
Company: ${lead.company} (${lead.companyType})
What they build: ${lead.description || lead.notes || 'AI/ML tooling'}
Top repos: ${lead.topRepos || lead.githubOrgUrl || 'N/A'}
AI tools: ${lead.aiTools || 'AI/ML stack'}
GitHub: ${lead.githubStars ? `${lead.githubStars.toLocaleString()} stars` : ''} ${lead.orgMembers ? `· ${lead.orgMembers} org members` : ''}
Contact: ${lead.contactName ? `${lead.contactName}${lead.jobTitle ? ` (${lead.jobTitle})` : ''}` : 'decision maker'}

EMAIL STRUCTURE:
- Subject: 4-7 words, specific to their actual work, no question marks
- Opening sentence: one sharp observation about what they build (cite a real repo name or product)
- 2-3 sentences on the problem: teams building agents in production get crushed by VM setup, memory that resets between sessions, and wiring up integrations from scratch. Be specific to their stack.
- 1 sentence on Lobstack: what it actually does, not marketing words
- CTA (primary): "Worth a 15-minute call?" or a specific variation tied to their work
- CTA (secondary, optional): "Or take it for a spin at lobstack.ai" — only include if it feels natural, keep it brief
- Sign off: ${senderName} @ lobstack.ai

Return JSON: {"subject":"...","body":"..."}`
}

function buildFollowUp1Prompt(lead: any, coldSubject: string, senderName: string): string {
  return `Write follow-up email #1 for Lobstack outreach to ${lead.company}. Sent 5 days after the cold email, no reply received.

Original subject: "${coldSubject}"
Company: ${lead.company} — ${lead.description || lead.notes || 'AI tooling'}
Top repos: ${lead.topRepos || 'N/A'}

RULES:
- 2 to 3 sentences MAX. Respect their time.
- No apology, no "just following up", no needy energy
- New angle: show something specific — a demo relevant to their stack, a result from a similar team, one concrete number
- End with a small ask: a specific day and time, or "5 minutes this week?"
- Subject: Re: ${coldSubject}
- Tone: confident, brief, human

Return JSON: {"subject":"Re: ${coldSubject}","body":"..."}`
}

function buildFollowUp2Prompt(lead: any, coldSubject: string, senderName: string): string {
  return `Write the final breakup email for Lobstack outreach to ${lead.company}. Two emails sent, no reply.

Original subject: "${coldSubject}"
Company: ${lead.company} — ${lead.description || lead.notes || 'AI tooling'}

RULES:
- 2 sentences ONLY. No exceptions.
- Sentence 1: one final observation or insight specific to their work that they might find genuinely useful, even without replying
- Sentence 2: a graceful exit. "No worries if the timing is off, I will leave it here." Friendly, zero pressure, zero guilt.
- No passive aggression. No "I guess you're not interested." No "last chance."
- Subject: Re: ${coldSubject}

Return JSON: {"subject":"Re: ${coldSubject}","body":"..."}`
}

// ── API handler ───────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const { lead, senderName = 'Brandon @ Lobstack', mode = 'all' } = await req.json()

  const callClaude = async (prompt: string, maxTokens = 600) => {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type':      'application/json',
        'x-api-key':         process.env.ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model:      'claude-sonnet-4-20250514',
        max_tokens: maxTokens,
        system:     SYSTEM_PROMPT,
        messages:   [{ role: 'user', content: prompt }],
      }),
    })
    const data  = await res.json()
    const raw   = data.content?.[0]?.text || ''
    const match = raw.replace(/```json|```/g, '').trim().match(/\{[\s\S]*\}/)
    if (!match) throw new Error('No JSON in Claude response')
    return JSON.parse(match[0])
  }

  try {
    if (mode === 'cold') {
      const result = await callClaude(buildColdEmailPrompt(lead, senderName))
      if (!result.subject || !result.body) throw new Error('Missing subject or body')
      return NextResponse.json({ ok: true, subject: result.subject, body: result.body })
    }

    // mode === 'all': cold + FU1 + FU2
    const cold = await callClaude(buildColdEmailPrompt(lead, senderName))
    if (!cold.subject || !cold.body) throw new Error('Cold email generation failed')

    const fu1 = await callClaude(buildFollowUp1Prompt(lead, cold.subject, senderName), 400)
    const fu2 = await callClaude(buildFollowUp2Prompt(lead, cold.subject, senderName), 300)

    return NextResponse.json({
      ok:               true,
      subject:          cold.subject,
      body:             cold.body,
      followUp1Subject: fu1.subject || `Re: ${cold.subject}`,
      followUp1Body:    fu1.body    || '',
      followUp2Subject: fu2.subject || `Re: ${cold.subject}`,
      followUp2Body:    fu2.body    || '',
    })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 })
  }
}
