import { NextRequest, NextResponse } from 'next/server'

const SKIP = new Set([
  'openai','anthropic','google','microsoft','meta','amazon','apple',
  'notion','figma','linear','vercel','stripe','twilio','github',
])

// Score a PH post 0–100
function scorePost(post: any): number {
  const votes    = post.votesCount    || 0
  const comments = post.commentsCount || 0
  const hasSite  = !!(post.website || post.makers?.[0]?.websiteUrl)
  const hasMaker = !!(post.makers?.[0]?.name)
  return Math.min(100, Math.round(
    Math.log10(Math.max(votes, 1))    * 25 +
    Math.log10(Math.max(comments, 1)) * 10 +
    (hasSite  ? 15 : 0) +
    (hasMaker ? 10 : 0)
  ))
}

async function fetchPosts(topic: string): Promise<any[]> {
  // PH has a public posts endpoint by topic — no auth needed for basic data
  const url = `https://www.producthunt.com/frontend/graphql`
  const query = `{
    topic(slug: "${topic}") {
      posts(first: 20, order: NEWEST) {
        nodes {
          id name tagline description url votesCount commentsCount
          website createdAt
          makers { name headline twitterUsername websiteUrl }
          topics { nodes { name } }
        }
      }
    }
  }`
  try {
    const r = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ query }),
      signal: AbortSignal.timeout(8000),
    })
    const d = await r.json()
    return d?.data?.topic?.posts?.nodes || []
  } catch {
    return []
  }
}

async function fetchPostsRSS(topic: string): Promise<any[]> {
  // Fallback: use PH RSS which is fully public
  try {
    const r = await fetch(`https://www.producthunt.com/topics/${topic}/feed`, {
      signal: AbortSignal.timeout(8000),
    })
    const xml = await r.text()
    const items: any[] = []
    const itemRx = /<item>([\s\S]*?)<\/item>/g
    let m
    while ((m = itemRx.exec(xml)) !== null) {
      const block = m[1]
      const title   = (/<title><!\[CDATA\[(.*?)\]\]><\/title>/.exec(block)?.[1] || '').trim()
      const link    = (/<link>(.*?)<\/link>/.exec(block)?.[1] || '').trim()
      const desc    = (/<description><!\[CDATA\[(.*?)\]\]><\/description>/.exec(block)?.[1] || '').trim()
      const pubDate = (/<pubDate>(.*?)<\/pubDate>/.exec(block)?.[1] || '').trim()
      if (title) items.push({ title, link, description: desc, pubDate })
    }
    return items
  } catch {
    return []
  }
}

export async function GET(req: NextRequest) {
  try {
    // Load CRM names to dedupe
    const crmNames = new Set<string>()
    try {
      const at = await fetch(
        `https://api.airtable.com/v0/appnF2fNAyEYnscvo/tblMgthKziXfnIPBV?pageSize=200&fields[]=Company`,
        { headers: { Authorization: `Bearer ${process.env.AIRTABLE_API_KEY}` } }
      ).then(r => r.json())
      for (const rec of at.records || []) {
        if (rec.fields['Company']) crmNames.add(rec.fields['Company'].toLowerCase())
      }
    } catch {}

    const topics = ['artificial-intelligence', 'developer-tools', 'machine-learning', 'bots']
    const seen   = new Set<string>()
    const orgs: any[] = []

    for (const topic of topics) {
      const posts = await fetchPostsRSS(topic)

      for (const post of posts) {
        const title = post.title || ''
        const key   = title.toLowerCase().trim()

        if (!title || seen.has(key)) continue
        seen.add(key)

        const nameLower = key
        if (Array.from(SKIP).some(s => nameLower.includes(s))) continue
        if (crmNames.has(nameLower)) continue

        const orgSlug = title.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()

        orgs.push({
          source:      'producthunt',
          org:         orgSlug,
          name:        title,
          type:        'AI/ML Startup',
          website:     '',
          url:         post.link || '',
          tagline:     post.description?.slice(0, 120) || '',
          description: post.description || '',
          createdAt:   post.pubDate || '',
          score:       40, // base score — enriched later via GitHub scrape
        })
      }
    }

    return NextResponse.json({ ok: true, orgs: orgs.slice(0, 40), total: orgs.length })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 })
  }
}
