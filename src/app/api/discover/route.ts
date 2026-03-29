import { NextRequest, NextResponse } from 'next/server'

const SEARCH_QUERIES = [
  'ai+agent+deploy+stars:>100',
  'llm+agent+platform+stars:>100',
  'autonomous+agent+cloud+stars:>50',
  'mcp+server+tools+stars:>30',
  'openai+sdk+saas+stars:>100',
  'anthropic+claude+api+stars:>50',
  'langchain+agent+stars:>100',
  'ai+workflow+automation+stars:>100',
  'ai+agent+framework+stars:>200',
  'llm+inference+platform+stars:>100',
]

const SKIP = new Set([
  'microsoft','google','facebook','meta','amazon','aws','apple',
  'openai','anthropic','apache','kubernetes','vercel','netlify',
  'github','docker','hashicorp','elastic','cloudflare','stripe',
  'twilio','sendgrid','mongodb','redis','postgres','nvidia','intel','ibm',
  'pytorch','tensorflow','huggingface',
])

function classifyOrg(topics: string[], repos: string[]): string {
  const all = [...topics, ...repos].join(' ').toLowerCase()
  if (/devops|deploy|infra|cloud|server|platform|host|ci|cd/.test(all)) return 'Dev Tools / DevOps'
  if (/enterprise|b2b|corp|saas/.test(all))                              return 'SaaS (50-500)'
  return 'AI/ML Startup'
}

async function ghSearch(q: string, token?: string): Promise<any[]> {
  const headers: Record<string,string> = { Accept: 'application/vnd.github+json' }
  if (token) headers.Authorization = `Bearer ${token}`
  const r = await fetch(
    `https://api.github.com/search/repositories?q=${q}&sort=stars&per_page=30`,
    { headers, next: { revalidate: 3600 } }
  )
  if (!r.ok) return []
  return (await r.json()).items || []
}

export async function GET(req: NextRequest) {
  const sp        = new URL(req.url).searchParams
  const token     = sp.get('token') || process.env.GITHUB_TOKEN
  const existing  = (sp.get('existing') || '').toLowerCase().split(',').filter(Boolean)
  const limit     = parseInt(sp.get('limit') || '60')
  const nQueries  = Math.min(parseInt(sp.get('queries') || '6'), SEARCH_QUERIES.length)

  const existingSet = new Set(existing)

  try {
    const allResults = await Promise.all(
      SEARCH_QUERIES.slice(0, nQueries).map(q => ghSearch(q, token || undefined))
    )

    const orgMap: Record<string, {
      stars: number; repos: string[]; topics: string[]; website: string; description: string
    }> = {}

    for (const items of allResults) {
      for (const repo of items) {
        if (repo.owner?.type !== 'Organization') continue
        const slug = repo.owner.login.toLowerCase()
        if (SKIP.has(slug)) continue

        const key = repo.owner.login
        if (!orgMap[key]) {
          orgMap[key] = { stars: 0, repos: [], topics: [], website: '', description: '' }
        }
        orgMap[key].stars += repo.stargazers_count || 0
        orgMap[key].repos.push(repo.name)
        orgMap[key].topics.push(...(repo.topics || []))
        if (!orgMap[key].website && repo.homepage) orgMap[key].website = repo.homepage
        if (!orgMap[key].description && repo.description) orgMap[key].description = repo.description
      }
    }

    const orgs = Object.entries(orgMap)
      .map(([login, d]) => ({
        org:         login,
        name:        login,
        stars:       d.stars,
        topRepos:    Array.from(new Set(d.repos)).slice(0, 3).join(', '),
        topics:      Array.from(new Set(d.topics)).slice(0, 6),
        website:     d.website || `https://github.com/${login}`,
        description: d.description,
        type:        classifyOrg(d.topics, d.repos),
        isNew:       !existingSet.has(login.toLowerCase()),
      }))
      .filter(o => o.isNew) // only surface genuinely new orgs
      .sort((a, b) => b.stars - a.stars)
      .slice(0, limit)

    return NextResponse.json({
      ok: true, orgs, total: orgs.length,
      queriesRun: nQueries, timestamp: new Date().toISOString(),
    })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 })
  }
}
