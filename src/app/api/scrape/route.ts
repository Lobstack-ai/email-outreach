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
  { org: 'flowise-ai',     name: 'Flowiseai',     type: 'AI/ML Startup',          web: 'https://flowiseai.com' },
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

  const target = TARGETS.find(t => t.org === org)
  if (!target) return NextResponse.json({ ok: false, error: 'Org not found' }, { status: 404 })

  try {
    const [orgData, repos] = await Promise.all([
      ghFetch(`/orgs/${org}`, token || undefined),
      ghFetch(`/orgs/${org}/repos?sort=stars&per_page=5`, token || undefined),
    ])
    const stars = repos.reduce((s: number, r: any) => s + (r.stargazers_count || 0), 0)
    const topRepos = repos.slice(0, 3).map((r: any) => r.name).join(', ')
    const topics = repos.flatMap((r: any) => r.topics || [])
    const aiTools = Array.from(new Set(topics.filter((t: string) =>
      ['ai', 'llm', 'agent', 'ml', 'gpt', 'claude', 'langchain', 'openai'].some(k => t.includes(k))
    ))).slice(0, 5).join(', ')

    return NextResponse.json({
      ok: true,
      data: {
        company: orgData.name || target.name,
        website: orgData.blog || target.web,
        description: orgData.description || '',
        githubOrgUrl: `https://github.com/${org}`,
        githubStars: stars,
        companyType: target.type,
        topRepos,
        aiTools: aiTools || 'AI/ML tooling',
      }
    })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 })
  }
}
