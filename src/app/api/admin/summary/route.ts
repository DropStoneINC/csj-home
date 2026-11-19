import { type NextRequest } from 'next/server'
import { CATEGORIES } from '@/data/exam'
import { fail, json, withDb } from '@/lib/server/api'
import { getQuestionMap } from '@/lib/server/bank'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

export async function GET(req: NextRequest) {
  const { db, res } = withDb()
  if (res) return res
  const days = Math.min(Math.max(Number(req.nextUrl.searchParams.get('days')) || 30, 7), 180)

  const [summary, daily, qstats, map] = await Promise.all([
    db.rpc('admin_summary'),
    db.rpc('admin_daily_stats', { days }),
    db.rpc('admin_question_stats', { since_days: days }),
    getQuestionMap(),
  ])
  const err = summary.error ?? daily.error ?? qstats.error
  if (err) return fail(`集計に失敗しました: ${err.message}`, 500)

  type QS = { question_id: string; attempts: number; correct: number; users: number; ai_asks: number }
  const rows = ((qstats.data ?? []) as QS[]).map(r => ({
    ...r,
    attempts: Number(r.attempts),
    correct: Number(r.correct),
    users: Number(r.users),
    ai_asks: Number(r.ai_asks),
  }))

  // 分野別の正答率
  const byCat = new Map<string, { attempts: number; correct: number }>()
  for (const r of rows) {
    const q = map[r.question_id]
    if (!q) continue
    const c = byCat.get(q.category) ?? { attempts: 0, correct: 0 }
    c.attempts += r.attempts
    c.correct += r.correct
    byCat.set(q.category, c)
  }
  const categories = CATEGORIES.map(c => ({
    id: c.id,
    name: c.name,
    questions: Object.values(map).filter(q => q.category === c.id).length,
    ...(byCat.get(c.id) ?? { attempts: 0, correct: 0 }),
  }))

  const brief = (id: string) => {
    const q = map[id]
    return q ? { category: q.category, level: q.level, text: q.question.slice(0, 80) } : null
  }
  const MIN_ATTEMPTS = 10
  const hardest = rows
    .filter(r => r.attempts >= MIN_ATTEMPTS && map[r.question_id])
    .sort((a, b) => a.correct / a.attempts - b.correct / b.attempts)
    .slice(0, 10)
    .map(r => ({ ...r, question: brief(r.question_id) }))
  const mostAsked = rows
    .filter(r => r.ai_asks > 0 && map[r.question_id])
    .sort((a, b) => b.ai_asks - a.ai_asks)
    .slice(0, 10)
    .map(r => ({ ...r, question: brief(r.question_id) }))

  const s = (summary.data as Record<string, number>[] | null)?.[0] ?? {}
  return json({
    days,
    minAttempts: MIN_ATTEMPTS,
    totalQuestions: Object.keys(map).length,
    summary: Object.fromEntries(Object.entries(s).map(([k, v]) => [k, Number(v)])),
    daily: ((daily.data ?? []) as Record<string, string | number>[]).map(d => ({
      day: String(d.day).slice(0, 10),
      users: Number(d.users),
      answers: Number(d.answers),
      correct: Number(d.correct),
      sessions: Number(d.sessions),
      ai_asks: Number(d.ai_asks),
    })),
    categories,
    hardest,
    mostAsked,
  })
}
