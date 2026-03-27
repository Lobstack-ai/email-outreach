import { NextRequest, NextResponse } from 'next/server'

const BASE_ID = 'appnF2fNAyEYnscvo'
const LEADS_TABLE = 'tblMgthKziXfnIPBV'
const LOG_TABLE = 'tbl6olAfEJ479I9oq'

const AT_KEY = process.env.AIRTABLE_API_KEY!

async function atFetch(method: string, path: string, body?: any) {
  const url = `https://api.airtable.com/v0/${BASE_ID}/${path}`
  const res = await fetch(url, {
    method,
    headers: {
      'Authorization': `Bearer ${AT_KEY}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error?.message || `Airtable ${res.status}`)
  return data
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const table = searchParams.get('table') || LEADS_TABLE
  try {
    const data = await atFetch('GET', `${table}?pageSize=500`)
    return NextResponse.json({ ok: true, records: data.records || [] })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const { action, table, recordId, fields } = await req.json()
  const tbl = table || LEADS_TABLE
  try {
    if (action === 'create') {
      const data = await atFetch('POST', tbl, { records: [{ fields }] })
      return NextResponse.json({ ok: true, record: data.records?.[0] })
    }
    if (action === 'update') {
      const data = await atFetch('PATCH', `${tbl}/${recordId}`, { fields })
      return NextResponse.json({ ok: true, record: data })
    }
    if (action === 'log') {
      const data = await atFetch('POST', LOG_TABLE, { records: [{ fields }] })
      return NextResponse.json({ ok: true, record: data.records?.[0] })
    }
    if (action === 'ping') {
      const data = await atFetch('GET', `${LEADS_TABLE}?pageSize=1`)
      return NextResponse.json({ ok: true, count: data.records?.length })
    }
    return NextResponse.json({ ok: false, error: 'Unknown action' }, { status: 400 })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 })
  }
}
