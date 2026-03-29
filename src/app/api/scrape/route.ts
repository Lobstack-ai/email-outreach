import { NextRequest, NextResponse } from 'next/server'

const TARGETS = [
  { org: 'e2b-dev',        name: 'E2B',          type: 'Dev Tools / DevOps',     web: 'https://e2b.dev' },
  { org: 'inngest',        name: 'Inngest',       type: 'Dev Tools / DevOps',     web: 'https://inngest.com' },
  { org: 'triggerdotdev',  name: 'Trigger.dev',   type: 'Dev Tools / DevOps',     web: 'https://trigger.dev' },
  { org: 'modal-labs',     name: 'Modal Labs',    type: 'Dev Tools / DevOps',     web: 'https://modal.com' },
  { org: 'traceloop',      name: 'Traceloop',     type: 'Dev Tools / DevOps',     web: 'https://traceloop.com' },
  { org: 'langfuse',       name: 'Langfuse',      type: 'Dev Tools / DevOps',     web: 'https://langfuse.com' },
  { org: 'agentops-ai',    name: 'AgentOps',      type: 'AI/ML Startup',          web: 'https://agentops.ai' },
  { org: 'crewaiinc',      name: 'CrewAI',        type: 'AI/ML Startup',          web: 'https://crewai.com' },
  { org: 'langgenius',     name: 'Dify.AI',       type: 'AI/ML Startup',          web: 'https://dify.ai' },
  { org: 'mendableai',     name: 'Mendable',      type: 'AI/ML Startup',          web: 'https://mendable.ai' },
  { org: 'FlowiseAI',     name: 'Flowiseai',     type: 'AI/ML Startup',          web: 'https://flowiseai.com' },
  { org: 'phidatahq',      name: 'Phidata',       type: 'AI/ML Startup',          web: 'https://phidata.com' },
  { org: 'superagent-ai',  name: 'Superagent',    type: 'AI/ML Startup',          web: 'https://superagent.sh' },
  { org: 'replicate',      name: 'Replicate',     type: 'AI/ML Startup',          web: 'https://replicate.com' },
  { org: 'cohere-ai',      name: 'Cohere',        type: 'Enterprise Tech (500+)', web: 'https://cohere.com' },
  { org: 'fly-apps',       name: 'Fly.io',        type: 'SaaS (50-500)',           web: 'https://fly.io' },
  { org: 'render-oss',     name: 'Render',        type: 'SaaS (50-500)',           web: 'https://render.com' },
  { org: 'relevanceai',    name: 'Relevance AI',  type: 'AI/ML Startup',          web: 'https://relevanceai.com' },
  { org: 'steamship-core', name: 'Steamship',     type: 'AI/ML Startup',          web: 'https://steamship.com' },
  { org: 'fixieai',        name: 'Fixie AI',      type: 'AI/ML Startup',          web: 'https://fixie.ai' },
]

async function ghFetch(path: string, token?: string) {
  const headers: Record<string, string> = { 'Accept': 'application/vnd.github+json' }
  if (token) headers['Authorization'] = `Bearer ${token}`
  const res = await fetch(`https://api.github.com${path}`, { headers, next: { revalidate: 3600 } })
  if (!res.ok) throw new Error(`GitHub ${res.status}: ${res.statusText}`)
  return res.json()
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const org = searchParams.get('org')
  const token = searchParams.get('token') || process.env.GITHUB_TOKEN

  if (org === 'ratelimit') {
    try {
      const data = await ghFetch('/rate_limit', token || undefined)
      return NextResponse.json({ ok: true, remaining: data.rate?.remaining, limit: data.rate?.limit })
    } catch (e: any) {
      return NextResponse.json({ ok: false, error: e.message })
    }
  }

  if (org === 'all') {
    return NextResponse.json({ ok: true, targets: TARGETS })
  }

  // Accept any org — either from hardcoded list or dynamically discovered
  const knownTarget = TARGETS.find(t => t.org === org)
  const website = searchParams.get('website') || knownTarget?.web || ''

  try {
    const [orgData, repos, members] = await Promise.all([
      ghFetch(`/orgs/${org}`, token || undefined),
      ghFetch(`/orgs/${org}/repos?sort=stars&per_page=5`, token || undefined),
      ghFetch(`/orgs/${org}/members?per_page=20`, token || undefined).catch(() => []),
    ])
    const stars = repos.reduce((s: number, r: any) => s + (r.stargazers_count || 0), 0)
    const topRepos = repos.slice(0, 3).map((r: any) => r.name).join(', ')
    const topics = repos.flatMap((r: any) => r.topics || [])
    const aiTools = Array.from(new Set(topics.filter((t: string) =>
      ['ai', 'llm', 'agent', 'ml', 'gpt', 'claude', 'langchain', 'openai'].some(k => t.includes(k))
    ))).slice(0, 5).join(', ')

    // ── Email enrichment ─────────────────────────────────────────────────────
    // Try to extract domain from website
    let domain: string | null = null
    try {
      const u = new URL(website.startsWith('http') ? website : `https://${website}`)
      domain = u.hostname.replace(/^www\./, '')
    } catch { /* no domain */ }

    // Priority roles for scoring
    const PRIORITY = ['cto','co-founder','cofounder','founder','vp engineering','vp of engineering','head of engineering','ceo','chief technology','chief executive']
    const scoreBio = (bio: string) => PRIORITY.filter(r => (bio||'').toLowerCase().includes(r)).length

    const emailPatterns = (first: string, last: string, dom: string) => {
      const f = first.toLowerCase().replace(/[^a-z]/g, '')
      const l = last.toLowerCase().replace(/[^a-z]/g, '')
      if (!f || !dom) return []
      const pats = [`${f}@${dom}`]
      if (l) pats.push(`${f}.${l}@${dom}`, `${f}${l}@${dom}`, `${f[0]}${l}@${dom}`, `${f[0]}.${l}@${dom}`)
      return pats
    }

    // Enrich top 10 members in parallel
    let bestContact: { name: string; email: string; confidence: string; title: string; githubUrl: string } | null = null

    if (members && members.length > 0) {
      const profiles = await Promise.all(
        (members as any[]).slice(0, 10).map(async (m: any) => {
          const p = await ghFetch(`/users/${m.login}`, token || undefined).catch(() => null)
          if (!p) return null
          const nameParts = (p.name || m.login).trim().split(/\s+/)
          const first = nameParts[0] || ''
          const last = nameParts.slice(1).join(' ') || ''
          const verifiedEmail = p.email?.includes('@') ? p.email : null
          const inferredEmails = domain ? emailPatterns(first, last, domain) : []
          return {
            login: m.login,
            name: p.name || m.login,
            bio: p.bio || '',
            bioScore: scoreBio(p.bio || ''),
            followers: p.followers || 0,
            githubUrl: p.html_url,
            verifiedEmail,
            inferredEmails,
            primaryEmail: verifiedEmail || inferredEmails[0] || null,
            emailConfidence: verifiedEmail ? 'verified' : inferredEmails.length ? 'inferred' : null,
          }
        })
      )

      const valid = profiles
        .filter(Boolean)
        .sort((a: any, b: any) => (b.bioScore - a.bioScore) || (b.followers - a.followers))

      const top = valid[0]
      if (top?.primaryEmail) {
        bestContact = {
          name: top.name,
          email: top.primaryEmail,
          confidence: top.emailConfidence || 'inferred',
          title: top.bio?.split('\n')[0]?.slice(0, 80) || '',
          githubUrl: top.githubUrl,
        }
      }
    }

    // Fallback: org-level email
    if (!bestContact && orgData.email) {
      bestContact = {
        name: orgData.name || org,
        email: orgData.email,
        confidence: 'verified',
        title: 'Organization contact',
        githubUrl: `https://github.com/${org}`,
      }
    }

    return NextResponse.json({
      ok: true,
      data: {
        company: orgData.name || knownTarget?.name || org,
        website: orgData.blog || website || knownTarget?.web || `https://github.com/${org}`,
        description: orgData.description || '',
        githubOrgUrl: `https://github.com/${org}`,
        githubStars: stars,
        companyType: searchParams.get('type') || knownTarget?.type || 'AI/ML Startup',
        topRepos,
        aiTools: aiTools || 'AI/ML tooling',
        // Enriched contact
        contactName: bestContact?.name || null,
        contactEmail: bestContact?.email || null,
        contactTitle: bestContact?.title || null,
        contactConfidence: bestContact?.confidence || null,
        contactGithub: bestContact?.githubUrl || null,
      }
    })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 })
  }
}
