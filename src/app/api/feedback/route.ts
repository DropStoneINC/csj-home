import { type NextRequest } from 'next/server'
import { cleanClientId, clientIp, fail, json, rateLimiter, readJson } from '@/lib/server/api'
import { getPublicDb } from '@/lib/server/supabase'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

const KINDS = ['feature', 'usability', 'bug', 'content', 'other']
const limited = rateLimiter(10, 60 * 60_000)

/** 学習者からのアプリへのご意見・改善要望 */
export async function POST(req: NextRequest) {
  const db = getPublicDb()
  if (!db) return fail('現在、ご意見を受け付けていません。', 503)
  if (limited(clientIp(req))) return fail('送信が集中しています。時間をおいてからお試しください。', 429)

  const body = await readJson(req)
  const kind = typeof body?.kind === 'string' && KINDS.includes(body.kind) ? body.kind : null
  if (!kind) return fail('種類を選んでください。', 400)
  const message = typeof body?.message === 'string' ? body.message.trim().slice(0, 2000) : ''
  if (!message) return fail('内容を入力してください。', 400)
  const page = typeof body?.page === 'string' && /^\/[A-Za-z0-9/_-]{0,199}$/.test(body.page) ? body.page : null

  const { error } = await db.rpc('submit_feedback', {
    p_kind: kind,
    p_message: message,
    p_page: page,
    p_client_id: cleanClientId(body?.clientId),
  })
  if (error?.code === 'P0429') return fail('送信が集中しています。時間をおいてからお試しください。', 429)
  if (error) {
    console.error('feedback insert failed', error.message)
    return fail('送信に失敗しました。時間をおいてからお試しください。', 500)
  }
  return json({ ok: true }, 201)
}
