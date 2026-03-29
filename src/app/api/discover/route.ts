import { NextRequest, NextResponse } from 'next/server'

// Broad, varied queries to surface fresh leads each run
const SEARCH_QUERIES = [
  'ai+agent+framework+stars:>50',
  'llm+agent+platform+stars:>30',
  'autonomous+agents+production+stars:>20',
  'mcp+tools+server+stars:>10',
  'anthropic+claude+sdk+stars:>20',
  'openai+agent+deploy+stars:>50',
  'langchain+rag+stars:>100',
  'ai+workflow+automation+stars:>50',
  'llm+inference+serving+stars:>50',
  'vector+database+embeddings+stars:>100',
  'ai+code+assistant+stars:>50',
  'multi+agent+orchestration+stars:>20',
  'ai+memory+persistence+stars:>10',
  'generative+ai+platform+stars:>50',
  'llmops+monitoring+stars:>20',
]

const SKIP = new Set([
  'microsoft','google','facebook','meta','amazon','aws','apple',
  'openai','anthropic','apache','kubernetes','vercel','netlify',
  'github','docker','hashicorp','elastic','cloudflare','stripe',
  'twilio','sendgrid','mongodb','redis','postgres','nvidia','intel','ibm',
  'pytorch','tensorflow','huggingface','awslabs','aws-samples',
  'googleapis','azure','microsoft','dotnet','golang','rust-lang',
])

function classifyOrg(topics: string[], repos: string[]): string {
  const all = [...topics, ...repos].join(' ').toLowerCase()
  if (/devops|deploy|infra|cloud|server|platform|host|ci|cd/.test(all)) return 'Dev Tools / DevOps'
  if (/enterprise|b2b|corp|saas/.test(all)) return 'SaaS (50-500)'
  return 'AI/ML Startup'
}

async function ghSearch(q: string, token?: string): Promise<any[]> {
  const headers: Record<string, string> = { Accept: 'application/vnd.github+json' }
  if (token) headers.Authorization = `Bearer ${token}`
  const r = await fetch(
    `https://api.github.com/search/repositories?q=${q}&sort=updated&per_page=30`,
    { headers }  // NO cache — always fresh results
  )
  if (!r.ok) {
    console.error(`GitHub search failed for query "${q}": ${r.status}`)
    return []
  }
  return (await r.json()).items || []
}

export async function GET(req: NextRequest) {
  const sp       = new URL(req.url).searchParams
  const token    = process.env.GITHUB_TOKEN  // always use server token
  const existing = (sp.get('existing') || '').toLowerCase().split(',').filter(Boolean)
  const limit    = parseInt(sp.get('limit') || '60')
  const nQueries = Math.min(parseInt(sp.get('queries') || '8'), SEARCH_QUERIES.length)

  const existingSet = new Set(existing)

  try {
    // Rotate which queries we run based on time — ensures fresh results each hour
    const hourSlot = Math.floor(Date.now() / (1000 * 60 * 60)) % SEARCH_QUERIES.length
    const rotatedQueries = [
      ...SEARCH_QUERIES.slice(hourSlot),
      ...SEARCH_QUERIES.slice(0, hourSlot),
    ].slice(0, nQueries)

    const allResults = await Promise.all(
      rotatedQueries.map(q => ghSearch(q, token))
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

    // Filter out existing CRM orgs AND well-known skip list
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
      .filter(o => o.isNew)
      .sort((a, b) => b.stars - a.stars)
      .slice(0, limit)

    return NextResponse.json({
      ok: true, orgs, total: orgs.length,
      queriesRun: nQueries,
      queriesUsed: rotatedQueries,
      timestamp: new Date().toISOString(),
    }, {
      headers: {
        // No caching — every discover run should return fresh results
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      }
    })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 })
  }
}
