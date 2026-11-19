import { type NextRequest } from 'next/server'
import { fail, json, readJson, withDb } from '@/lib/server/api'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

type Ctx = { params: { id: string } }
const UUID = /^[0-9a-f-]{36}$/i

/** ご意見の対応状況・メモを更新する */
export async function PATCH(req: NextRequest, { params }: Ctx) {
  const { db, res } = withDb()
  if (res) return res
  if (!UUID.test(params.id)) return fail('ID が正しくありません。', 400)
  const body = await readJson<{ status?: unknown; admin_note?: unknown }>(req)
  const patch: Record<string, unknown> = {}
  if (body?.status !== undefined) {
    if (!['open', 'planned', 'done', 'dismissed'].includes(body.status as string)) return fail('状態が正しくありません。', 422)
    patch.status = body.status
  }
  if (body?.admin_note !== undefined) {
    patch.admin_note = typeof body.admin_note === 'string' ? body.admin_note.trim().slice(0, 2000) || null : null
  }
  if (!Object.keys(patch).length) return fail('変更内容がありません。', 422)
  const { data, error } = await db.from('feedback').update(patch).eq('id', params.id).select('id')
  if (error) return fail(`保存に失敗しました: ${error.message}`, 500)
  if (!data?.length) return fail('見つかりません。', 404)
  return json({ ok: true })
}
