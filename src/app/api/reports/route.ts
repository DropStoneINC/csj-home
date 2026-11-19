import { type NextRequest } from 'next/server'
import { cleanClientId, clientIp, fail, json, rateLimiter, readJson } from '@/lib/server/api'
import { getQuestionMap } from '@/lib/server/bank'
import { getPublicDb } from '@/lib/server/supabase'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

const KINDS = ['wrong_answer', 'explanation', 'typo', 'outdated', 'other']
const limited = rateLimiter(10, 60 * 60_000)

/** 学習者からの問題の誤り報告 */
export async function POST(req: NextRequest) {
  const db = getPublicDb()
  if (!db) return fail('現在、報告を受け付けていません。', 503)
  if (limited(clientIp(req))) return fail('報告が集中しています。時間をおいてからお試しください。', 429)

  const body = await readJson(req)
  const map = await getQuestionMap()
  const question_id = typeof body?.questionId === 'string' && map[body.questionId] ? body.questionId : null
  if (!question_id) return fail('問題が見つかりません。', 400)
  const kind = typeof body?.kind === 'string' && KINDS.includes(body.kind) ? body.kind : null
  if (!kind) return fail('報告の種類を選んでください。', 400)
  const message = typeof body?.message === 'string' ? body.message.trim().slice(0, 1000) : ''
  if (kind === 'other' && !message) return fail('内容を入力してください。', 400)
  const selected = typeof body?.selected === 'number' && [0, 1, 2, 3].includes(body.selected) ? body.selected : null

  const { error } = await db.rpc('submit_report', {
    p_question_id: question_id,
    p_kind: kind,
    p_message: message,
    p_selected: selected,
    p_client_id: cleanClientId(body?.clientId),
  })
  if (error?.code === 'P0429') return fail('報告が集中しています。時間をおいてからお試しください。', 429)
  if (error) {
    console.error('report insert failed', error.message)
    return fail('送信に失敗しました。時間をおいてからお試しください。', 500)
  }
  return json({ ok: true }, 201)
}
