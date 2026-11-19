import { type NextRequest } from 'next/server'
import { BASE_QUESTIONS } from '@/data/exam'
import { cleanClientId, clientIp, rateLimiter } from '@/lib/server/api'
import { getQuestionMap } from '@/lib/server/bank'
import { getSupabase } from '@/lib/server/supabase'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

const MAX_BATCH = 100
const MODES = ['category', 'random', 'smart', 'weak', 'bookmark', 'mock']
const limited = rateLimiter(60, 10 * 60_000)
const noContent = () => new Response(null, { status: 204 })

/**
 * 匿名の利用ログを受け取る（navigator.sendBeacon から送られる）。
 * 失敗しても学習には影響させないため、エラーでも 204 を返す。
 */
export async function POST(req: NextRequest) {
  const db = getSupabase()
  if (!db || limited(clientIp(req))) return noContent()

  let body: { clientId?: unknown; events?: unknown }
  try {
    body = JSON.parse(await req.text())
  } catch {
    return noContent()
  }
  const client_id = cleanClientId(body.clientId)
  if (!client_id || !Array.isArray(body.events)) return noContent()

  const map = await getQuestionMap().catch(() => Object.fromEntries(BASE_QUESTIONS.map(q => [q.id, q])))
  const now = Date.now()
  type Row = { type: string; client_id: string; created_at: string; question_id?: string; correct?: boolean; mode?: string; total?: number; score?: number }
  const rows = body.events.slice(0, MAX_BATCH).flatMap((raw): Row[] => {
    const e = (raw ?? {}) as Record<string, unknown>
    // 端末の時計を信用しすぎない（過去1日〜未来5分の範囲だけ採用）
    const at = typeof e.at === 'number' && e.at > now - 86_400_000 && e.at < now + 300_000 ? new Date(e.at).toISOString() : new Date(now).toISOString()
    if (e.type === 'answer' && typeof e.q === 'string' && map[e.q] && typeof e.ok === 'boolean') {
      return [{ type: 'answer', client_id, question_id: e.q, correct: e.ok, created_at: at }]
    }
    if (e.type === 'session' && typeof e.mode === 'string' && MODES.includes(e.mode)) {
      const total = Math.min(Math.max(Math.round(Number(e.total) || 0), 0), 200)
      const score = Math.min(Math.max(Math.round(Number(e.score) || 0), 0), total)
      return [{ type: 'session', client_id, mode: e.mode, total, score, created_at: at }]
    }
    return []
  })
  if (rows.length) {
    const { error } = await db.from('events').insert(rows)
    if (error) console.error('events insert failed', error.message)
  }
  return noContent()
}
