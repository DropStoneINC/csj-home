import { type NextRequest } from 'next/server'
import { fail, json, withDb } from '@/lib/server/api'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

const STATUSES = ['open', 'planned', 'done', 'dismissed'] as const

export async function GET(req: NextRequest) {
  const { db, res } = withDb()
  if (res) return res
  const s = req.nextUrl.searchParams.get('status') ?? 'open'
  const status = s === 'all' || STATUSES.includes(s as (typeof STATUSES)[number]) ? s : 'open'
  let q = db.from('feedback').select('id, kind, message, page, status, admin_note, created_at, updated_at').order('created_at', { ascending: false }).limit(300)
  if (status !== 'all') q = q.eq('status', status)
  const count = (st: string) => db.from('feedback').select('id', { count: 'exact', head: true }).eq('status', st)
  const [{ data, error }, ...counts] = await Promise.all([q, ...STATUSES.map(count)])
  const err = error ?? counts.find(c => c.error)?.error
  if (err) return fail(`取得に失敗しました: ${err.message}`, 500)
  return json({
    counts: Object.fromEntries(STATUSES.map((st, i) => [st, counts[i].count ?? 0])),
    feedback: data ?? [],
  })
}
