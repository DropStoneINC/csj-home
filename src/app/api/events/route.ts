import { type NextRequest } from 'next/server'
import { BASE_QUESTIONS } from '@/data/exam'
import { cleanClientId, clientIp, rateLimiter } from '@/lib/server/api'
import { getQuestionMap } from '@/lib/server/bank'
import { getPublicDb } from '@/lib/server/supabase'

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
  const db = getPublicDb()
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
  // 問題として存在する ID だけを送る（時刻の丸めなどの検証は DB の log_events でも行う）
  const events = body.events.slice(0, MAX_BATCH).filter(raw => {
    const e = (raw ?? {}) as Record<string, unknown>
    if (e.type === 'answer') return typeof e.q === 'string' && !!map[e.q] && typeof e.ok === 'boolean'
    if (e.type === 'session') return typeof e.mode === 'string' && MODES.includes(e.mode) && typeof e.total === 'number' && typeof e.score === 'number'
    return false
  })
  if (events.length) {
    const { error } = await db.rpc('log_events', { p_client_id: client_id, p_events: events })
    if (error) console.error('log_events failed', error.message)
  }
  return noContent()
}
