import { type NextRequest } from 'next/server'
import { fail, json, readJson, withDb } from '@/lib/server/api'
import { listAdminQuestions, nextId, revalidateBank } from '@/lib/server/adminQuestions'
import { parseQuestion } from '@/lib/questionSchema'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

/** 問題一覧（統計・未対応の報告数つき） */
export async function GET() {
  const { db, res } = withDb()
  if (res) return res
  try {
    const [list, stats, reports] = await Promise.all([
      listAdminQuestions(),
      db.rpc('admin_question_stats', { since_days: 90 }),
      db.from('reports').select('question_id').eq('status', 'open').limit(5000),
    ])
    if (stats.error) throw new Error(stats.error.message)
    if (reports.error) throw new Error(reports.error.message)
    const s = new Map(
      ((stats.data ?? []) as { question_id: string; attempts: number; correct: number; ai_asks: number }[]).map(r => [
        r.question_id,
        { attempts: Number(r.attempts), correct: Number(r.correct), ai_asks: Number(r.ai_asks) },
      ]),
    )
    const open = new Map<string, number>()
    for (const r of reports.data ?? []) open.set(r.question_id, (open.get(r.question_id) ?? 0) + 1)
    return json({
      questions: list.map(({ explanation: _e, ...q }) => ({
        ...q,
        stats: s.get(q.id) ?? { attempts: 0, correct: 0, ai_asks: 0 },
        openReports: open.get(q.id) ?? 0,
      })),
    })
  } catch (e) {
    return fail(`一覧の取得に失敗しました: ${(e as Error).message}`, 500)
  }
}

/** 問題の追加 */
export async function POST(req: NextRequest) {
  const { db, res } = withDb()
  if (res) return res
  const body = await readJson(req)
  const parsed = parseQuestion(body)
  if (!parsed.ok) return fail(parsed.errors.join('\n'), 422, { errors: parsed.errors })
  const status = body?.status === 'hidden' ? 'hidden' : 'published'
  const note = typeof body?.note === 'string' ? body.note.slice(0, 2000) || null : null

  // ID の競合時は採番し直す
  for (let attempt = 0; attempt < 3; attempt++) {
    const list = await listAdminQuestions()
    const id = nextId(parsed.value.category, list.map(q => q.id))
    if (!id) return fail('この分野の問題 ID が上限（999）に達しました。', 409)
    const { error } = await db.from('questions').insert({ id, ...parsed.value, status, note })
    if (!error) {
      revalidateBank()
      return json({ id }, 201)
    }
    if (error.code !== '23505') return fail(`保存に失敗しました: ${error.message}`, 500)
  }
  return fail('ID の採番に失敗しました。もう一度お試しください。', 409)
}
