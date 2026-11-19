import { type NextRequest } from 'next/server'
import { fail, json, withDb } from '@/lib/server/api'
import { getQuestionMap } from '@/lib/server/bank'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

const STATUSES = ['open', 'resolved', 'dismissed', 'all'] as const

export async function GET(req: NextRequest) {
  const { db, res } = withDb()
  if (res) return res
  const s = req.nextUrl.searchParams.get('status') ?? 'open'
  const status = STATUSES.includes(s as (typeof STATUSES)[number]) ? s : 'open'
  let q = db.from('reports').select('*').order('created_at', { ascending: false }).limit(300)
  if (status !== 'all') q = q.eq('status', status)
  const count = (st: string) => db.from('reports').select('id', { count: 'exact', head: true }).eq('status', st)
  const [{ data, error }, open, resolved, dismissed, map] = await Promise.all([
    q,
    count('open'),
    count('resolved'),
    count('dismissed'),
    getQuestionMap(),
  ])
  const err = error ?? open.error ?? resolved.error ?? dismissed.error
  if (err) return fail(`取得に失敗しました: ${err.message}`, 500)
  const tally = { open: open.count ?? 0, resolved: resolved.count ?? 0, dismissed: dismissed.count ?? 0 }
  return json({
    counts: tally,
    reports: (data ?? []).map(r => {
      const qq = map[r.question_id]
      return { ...r, question: qq ? { category: qq.category, text: qq.question.slice(0, 80) } : null }
    }),
  })
}
