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
  { org: 'FlowiseAI',      name: 'Flowiseai',     type: 'AI/ML Startup',          web: 'https://flowiseai.com' },
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

// Compute a lead quality score 0-100 based on GitHub signals
function computeLeadScore(data: {
  stars: number; forks: number; watchers: number;
  memberCount: number; contributors: number; repoCount: number;
  openIssues: number; hasEmail: boolean; hasWebsite: boolean;
}): number {
  let score = 0
  // Stars: up to 30 pts (log scale)
  score += Math.min(30, Math.round(Math.log10(data.stars + 1) * 10))
  // Forks: up to 15 pts
  score += Math.min(15, Math.round(Math.log10(data.forks + 1) * 6))
  // Org members: up to 15 pts (5-100 is sweet spot)
  if (data.memberCount >= 3) score += Math.min(15, Math.round(data.memberCount / 5))
  // Contributors on top repo: up to 15 pts
  score += Math.min(15, Math.round(data.contributors / 2))
  // Watchers: up to 10 pts
  score += Math.min(10, Math.round(Math.log10(data.watchers + 1) * 4))
  // Active issues: signals product usage (up to 5 pts)
  if (data.openIssues > 10) score += 5
  else if (data.openIssues > 0) score += 2
  // Bonus: has email contact
  if (data.hasEmail) score += 5
  // Bonus: has website
  if (data.hasWebsite) score += 5
  return Math.min(100, score)
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const org   = searchParams.get('org')
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

  if (!org) return NextResponse.json({ ok: false, error: 'org required' }, { status: 400 })

  const knownTarget = TARGETS.find(t => t.org === org)
  const website     = searchParams.get('website') || knownTarget?.web || ''

  try {
    // Fetch org, top repos, members, AND contributors for top repo in parallel
    const [orgData, repos, members] = await Promise.all([
      ghFetch(`/orgs/${org}`, token || undefined),
      ghFetch(`/orgs/${org}/repos?sort=stars&per_page=5`, token || undefined),
      ghFetch(`/orgs/${org}/members?per_page=30`, token || undefined).catch(() => []),
    ])

    // Aggregate stats across top repos
    const stars      = repos.reduce((s: number, r: any) => s + (r.stargazers_count || 0), 0)
    const forks      = repos.reduce((s: number, r: any) => s + (r.forks_count || 0), 0)
    const watchers   = repos.reduce((s: number, r: any) => s + (r.watchers_count || 0), 0)
    const openIssues = repos.reduce((s: number, r: any) => s + (r.open_issues_count || 0), 0)
    const topRepoNames = repos.slice(0, 3).map((r: any) => r.name).join(', ')

    // Get contributors count for the single top repo
    const topRepo = repos[0]
    let contributors = 0
    if (topRepo) {
      try {
        const contrib = await ghFetch(
          `/repos/${org}/${topRepo.name}/contributors?per_page=1&anon=false`,
          token || undefined
        )
        // GitHub returns array; use org member count as proxy if only 1 returned
        contributors = Array.isArray(contrib) ? contrib.length : 0
        // Try to get accurate count from header (GitHub paginates)
        // Use member count as a reasonable proxy
        if (contributors <= 1) contributors = Math.max(members.length, contributors)
      } catch { contributors = members.length }
    }

    const topics = repos.flatMap((r: any) => r.topics || [])
    const aiTools = Array.from(new Set(topics.filter((t: string) =>
      ['ai', 'llm', 'agent', 'ml', 'gpt', 'claude', 'langchain', 'openai', 'rag', 'vector'].some(k => t.includes(k))
    ))).slice(0, 8).join(', ')

    // ── Email enrichment ────────────────────────────────────────────────────────
    let domain: string | null = null
    try {
      const u = new URL(website.startsWith('http') ? website : `https://${website}`)
      domain = u.hostname.replace(/^www\./, '')
    } catch { /* no domain */ }

    const PRIORITY = [
      'cto','co-founder','cofounder','founder','vp engineering','vp of engineering',
      'head of engineering','ceo','chief technology','chief executive','cpo','head of product',
    ]
    const scoreBio = (bio: string) => PRIORITY.filter(r => (bio||'').toLowerCase().includes(r)).length

    const emailPatterns = (first: string, last: string, dom: string) => {
      const f = first.toLowerCase().replace(/[^a-z]/g, '')
      const l = last.toLowerCase().replace(/[^a-z]/g, '')
      if (!f || !dom) return []
      const pats = [`${f}@${dom}`]
      if (l) pats.push(`${f}.${l}@${dom}`, `${f}${l}@${dom}`, `${f[0]}${l}@${dom}`, `${f[0]}.${l}@${dom}`)
      return pats
    }

    let bestContact: { name: string; email: string; confidence: string; title: string; githubUrl: string } | null = null

    if (members && members.length > 0) {
      const profiles = await Promise.all(
        (members as any[]).slice(0, 10).map(async (m: any) => {
          const p = await ghFetch(`/users/${m.login}`, token || undefined).catch(() => null)
          if (!p) return null
          const nameParts = (p.name || m.login).trim().split(/\s+/)
          const first = nameParts[0] || ''
          const last  = nameParts.slice(1).join(' ') || ''
          const verifiedEmail  = p.email?.includes('@') ? p.email : null
          const inferredEmails = domain ? emailPatterns(first, last, domain) : []
          return {
            name:           p.name || m.login,
            bio:            p.bio || '',
            bioScore:       scoreBio(p.bio || ''),
            followers:      p.followers || 0,
            githubUrl:      p.html_url,
            primaryEmail:   verifiedEmail || inferredEmails[0] || null,
            emailConfidence:verifiedEmail ? 'verified' : inferredEmails.length ? 'inferred' : null,
          }
        })
      )
      const valid = profiles.filter(Boolean)
        .sort((a: any, b: any) => (b.bioScore - a.bioScore) || (b.followers - a.followers))
      const top = valid[0]
      if (top?.primaryEmail) {
        bestContact = {
          name:       top.name,
          email:      top.primaryEmail,
          confidence: top.emailConfidence || 'inferred',
          title:      top.bio?.split('\n')[0]?.slice(0, 80) || '',
          githubUrl:  top.githubUrl,
        }
      }
    }

    if (!bestContact && orgData.email) {
      bestContact = {
        name:       orgData.name || org,
        email:      orgData.email,
        confidence: 'verified',
        title:      'Organization contact',
        githubUrl:  `https://github.com/${org}`,
      }
    }

    const leadScore = computeLeadScore({
      stars, forks, watchers,
      memberCount:  Array.isArray(members) ? members.length : 0,
      contributors,
      repoCount:    orgData.public_repos || repos.length,
      openIssues,
      hasEmail:     !!bestContact?.email,
      hasWebsite:   !!(orgData.blog || website),
    })

    return NextResponse.json({
      ok:   true,
      data: {
        company:         orgData.name || knownTarget?.name || org,
        website:         orgData.blog || website || `https://github.com/${org}`,
        description:     orgData.description || '',
        githubOrgUrl:    `https://github.com/${org}`,
        companyType:     searchParams.get('type') || knownTarget?.type || 'AI/ML Startup',
        // GitHub metrics
        githubStars:     stars,
        githubForks:     forks,
        githubWatchers:  watchers,
        orgMembers:      Array.isArray(members) ? members.length : 0,
        contributors,
        openIssues,
        repoCount:       orgData.public_repos || repos.length,
        topRepos:        topRepoNames,
        aiTools:         aiTools || 'AI/ML tooling',
        leadScore,
        // Contact
        contactName:     bestContact?.name || null,
        contactEmail:    bestContact?.email || null,
        contactTitle:    bestContact?.title || null,
        contactConfidence: bestContact?.confidence || null,
        contactGithub:   bestContact?.githubUrl || null,
      }
    })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 })
  }
}
