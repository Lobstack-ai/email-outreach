import { NextRequest, NextResponse } from 'next/server'

// ── helpers ───────────────────────────────────────────────────────────────────

const GH_HEADERS = () => {
  const h: Record<string, string> = { Accept: 'application/vnd.github+json' }
  if (process.env.GITHUB_TOKEN) h.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`
  return h
}

async function ghGet(path: string) {
  const r = await fetch(`https://api.github.com${path}`, { headers: GH_HEADERS() })
  if (!r.ok) return null
  return r.json()
}

// Common b2b email patterns to try
function emailPatterns(first: string, last: string, domain: string): { email: string; pattern: string }[] {
  const f = first.toLowerCase().replace(/[^a-z]/g, '')
  const l = last.toLowerCase().replace(/[^a-z]/g, '')
  if (!f || !l || !domain) return []
  return [
    { email: `${f}@${domain}`,           pattern: 'first@domain' },
    { email: `${f}.${l}@${domain}`,       pattern: 'first.last@domain' },
    { email: `${f}${l}@${domain}`,        pattern: 'firstlast@domain' },
    { email: `${f[0]}${l}@${domain}`,     pattern: 'flast@domain' },
    { email: `${f[0]}.${l}@${domain}`,    pattern: 'f.last@domain' },
    { email: `${f}_${l}@${domain}`,       pattern: 'first_last@domain' },
  ]
}

function extractDomain(url: string): string | null {
  try {
    const u = new URL(url.startsWith('http') ? url : `https://${url}`)
    return u.hostname.replace(/^www\./, '')
  } catch { return null }
}

function parseName(fullName: string): { first: string; last: string } {
  const parts = (fullName || '').trim().split(/\s+/)
  return { first: parts[0] || '', last: parts.slice(1).join(' ') || '' }
}

// Priority roles we care about
const PRIORITY_ROLES = [
  'cto', 'co-founder', 'cofounder', 'founder', 'vp engineering',
  'vp of engineering', 'head of engineering', 'engineering lead',
  'ceo', 'chief technology', 'chief executive',
]

function scoreBio(bio: string): number {
  if (!bio) return 0
  const b = bio.toLowerCase()
  return PRIORITY_ROLES.filter(r => b.includes(r)).length
}

// ── main enrichment logic ─────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const org = searchParams.get('org')
  const website = searchParams.get('website') || ''

  if (!org) return NextResponse.json({ ok: false, error: 'org required' }, { status: 400 })

  const domain = extractDomain(website) || null
  const contacts: any[] = []

  try {
    // Step 1: Get org members (public)
    const members = await ghGet(`/orgs/${org}/members?per_page=30`) || []

    // Step 2: Enrich each member with their public profile
    const enriched = await Promise.all(
      members.slice(0, 20).map(async (m: any) => {
        const profile = await ghGet(`/users/${m.login}`)
        if (!profile) return null

        const bioScore = scoreBio(profile.bio || '')
        const { first, last } = parseName(profile.name || profile.login)
        const profileEmail = profile.email || null

        // Build email candidates
        const candidates: { email: string; source: string; confidence: 'verified'|'inferred' }[] = []

        if (profileEmail && profileEmail.includes('@')) {
          candidates.push({ email: profileEmail, source: 'GitHub profile', confidence: 'verified' })
        }

        if (domain && first) {
          const patterns = emailPatterns(first, last, domain)
          patterns.forEach(p => candidates.push({
            email: p.email,
            source: `Pattern: ${p.pattern}`,
            confidence: 'inferred',
          }))
        }

        return {
          login: m.login,
          name: profile.name || m.login,
          bio: profile.bio || '',
          company: profile.company || '',
          location: profile.location || '',
          githubUrl: profile.html_url,
          avatarUrl: profile.avatar_url,
          followers: profile.followers || 0,
          publicRepos: profile.public_repos || 0,
          bioScore,
          primaryEmail: candidates[0]?.email || null,
          emailConfidence: candidates[0]?.confidence || null,
          allCandidates: candidates.slice(0, 4),
        }
      })
    )

    const valid = enriched
      .filter(Boolean)
      .sort((a: any, b: any) => (b.bioScore - a.bioScore) || (b.followers - a.followers))

    // Step 3: Fallback — try org's public email / repos contributors
    if (valid.length === 0) {
      const orgData = await ghGet(`/orgs/${org}`)
      if (orgData?.email) {
        contacts.push({
          name: orgData.name || org,
          bio: orgData.description || '',
          primaryEmail: orgData.email,
          emailConfidence: 'verified',
          source: 'GitHub org profile',
          githubUrl: `https://github.com/${org}`,
        })
      }
    }

    // Step 4: Pick best contact — highest bio score, then follower count
    const best = valid[0] || contacts[0] || null

    return NextResponse.json({
      ok: true,
      org,
      domain,
      contacts: valid.slice(0, 5),
      best: best ? {
        name: best.name,
        bio: best.bio,
        email: best.primaryEmail,
        confidence: best.emailConfidence,
        githubUrl: best.githubUrl,
        title: best.bio?.split('\n')[0]?.slice(0, 80) || '',
      } : null,
      totalFound: valid.length,
    })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 })
  }
}
