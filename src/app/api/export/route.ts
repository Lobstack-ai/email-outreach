import { NextRequest, NextResponse } from 'next/server'

const BASE  = 'appnF2fNAyEYnscvo'
const TABLE = 'tblMgthKziXfnIPBV'
const AT    = () => process.env.AIRTABLE_API_KEY!

function esc(v: string) {
  if (!v) return ''
  const s = String(v).replace(/"/g, '""')
  return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s}"` : s
}

export async function GET(req: NextRequest) {
  const sp     = new URL(req.url).searchParams
  const filter = sp.get('filter') || 'all'  // all | sent | replied | new | noemail

  try {
    // Load all records
    let records: any[] = []
    let offset: string | undefined
    do {
      const qs = offset ? `pageSize=100&offset=${offset}` : 'pageSize=100'
      const r  = await fetch(`https://api.airtable.com/v0/${BASE}/${TABLE}?${qs}`, {
        headers: { Authorization: `Bearer ${AT()}` },
      })
      const d = await r.json()
      records.push(...(d.records || []))
      offset = d.offset
    } while (offset)

    // Apply filter
    if (filter !== 'all') {
      records = records.filter(r => {
        const f    = r.fields
        const stat = f['Status'] || ''
        const seq  = f['Sequence Status'] || ''
        if (filter === 'sent')    return stat === 'Email Sent'
        if (filter === 'replied') return stat === 'Replied'
        if (filter === 'new')     return stat === 'New'
        if (filter === 'noemail') return !f['Contact Email']
        return true
      })
    }

    // Build CSV
    const COLS = [
      'Company', 'Contact Name', 'Contact Email', 'Job Title', 'Company Type',
      'Status', 'Sequence Status', 'Reply Intent', 'Open Count', 'Last Opened',
      'Lead Score', 'GitHub Stars', 'Org Members', 'GitHub Org URL', 'Website',
      'Email Subject', 'Last Contacted', 'Date Added', 'Source', 'Bounced', 'Disqualified',
    ]

    const header = COLS.map(esc).join(',')
    const rows   = records.map(r => {
      const f = r.fields
      return COLS.map(col => {
        const v = f[col]
        if (v === null || v === undefined) return ''
        if (typeof v === 'object' && 'name' in v) return esc(v.name) // singleSelect
        if (typeof v === 'boolean') return v ? '1' : '0'
        return esc(String(v))
      }).join(',')
    })

    const csv      = [header, ...rows].join('\n')
    const filename = `lobstack-leads-${filter}-${new Date().toISOString().split('T')[0]}.csv`

    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type':        'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control':       'no-store',
      },
    })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 })
  }
}
