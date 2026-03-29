import { NextRequest, NextResponse } from 'next/server'

const BASE  = 'appnF2fNAyEYnscvo'
const TABLE = 'tblMgthKziXfnIPBV'
const AT    = () => process.env.AIRTABLE_API_KEY!

// Regenerate all emails using updated system prompt
// Processes leads in batches to avoid timeout
export async function POST(req: NextRequest) {
  const { recordIds, senderName = 'Brandon @ Lobstack', dryRun = false } = await req.json()

  // Load leads to regenerate
  let leads: any[] = []

  if (recordIds?.length) {
    // Specific records
    for (const id of recordIds) {
      const r = await fetch(`https://api.airtable.com/v0/${BASE}/${TABLE}/${id}`, {
        headers: { Authorization: `Bearer ${AT()}` },
      })
      if (r.ok) {
        const d = await r.json()
        leads.push(d)
      }
    }
  } else {
    // All leads with email body (full regeneration)
    let offset: string | undefined
    do {
      const qs = offset ? `pageSize=100&offset=${offset}` : 'pageSize=100'
      const r = await fetch(`https://api.airtable.com/v0/${BASE}/${TABLE}?${qs}`, {
        headers: { Authorization: `Bearer ${AT()}` },
      })
      const d = await r.json()
      const withEmail = (d.records || []).filter((rec: any) => rec.fields['Email Body'])
      leads.push(...withEmail)
      offset = d.offset
    } while (offset)
  }

  if (!leads.length) {
    return NextResponse.json({ ok: true, processed: 0, message: 'No leads to regenerate' })
  }

  // Process first batch of 10 (Vercel serverless timeout is ~25s)
  // Client should call repeatedly until done = true
  const batchSize = 8
  const batch = leads.slice(0, batchSize)
  const results: { id: string; company: string; ok: boolean; error?: string }[] = []

  for (const record of batch) {
    const f = record.fields
    const lead = {
      id:           record.id,
      company:      f['Company'] || '',
      companyType:  f['Company Type'] || 'AI/ML Startup',
      description:  f['Personalization Notes'] || '',
      notes:        f['Personalization Notes'] || '',
      topRepos:     f['Top Repos'] || '',
      aiTools:      f['AI Tools Used'] || '',
      githubStars:  f['GitHub Stars'] || 0,
      githubForks:  f['GitHub Forks'] || 0,
      orgMembers:   f['Org Members'] || 0,
      website:      f['Website'] || '',
      githubOrgUrl: f['GitHub Org URL'] || '',
      contactName:  f['Contact Name'] || '',
      jobTitle:     f['Job Title'] || '',
      contactEmail: f['Contact Email'] || '',
    }

    try {
      if (dryRun) {
        results.push({ id: record.id, company: lead.company, ok: true })
        continue
      }

      // Call generate API
      const genRes = await fetch(`${process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000'}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lead, senderName, mode: 'all' }),
      })
      const gen = await genRes.json()
      if (!gen.ok) throw new Error(gen.error)

      // Save to Airtable
      await fetch(`https://api.airtable.com/v0/${BASE}/${TABLE}/${record.id}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${AT()}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fields: {
            'Email Subject':      gen.subject,
            'Email Body':         gen.body,
            'Follow-up 1 Subject': gen.followUp1Subject || '',
            'Follow-up 1 Body':    gen.followUp1Body    || '',
            'Follow-up 2 Subject': gen.followUp2Subject || '',
            'Follow-up 2 Body':    gen.followUp2Body    || '',
          },
          typecast: true,
        }),
      })

      results.push({ id: record.id, company: lead.company, ok: true })
    } catch (e: any) {
      results.push({ id: record.id, company: lead.company, ok: false, error: e.message })
    }

    // Small delay to avoid rate limits
    await new Promise(r => setTimeout(r, 500))
  }

  return NextResponse.json({
    ok:        true,
    processed: results.length,
    total:     leads.length,
    done:      leads.length <= batchSize,
    remaining: Math.max(0, leads.length - batchSize),
    results,
  })
}
