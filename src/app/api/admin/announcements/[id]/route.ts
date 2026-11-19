import { revalidateTag } from 'next/cache'
import { type NextRequest } from 'next/server'
import { fail, json, readJson, withDb } from '@/lib/server/api'
import { ANNOUNCEMENTS_TAG } from '@/lib/server/bank'
import { parseAnnouncement } from '@/lib/server/announcementInput'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

type Ctx = { params: { id: string } }
const UUID = /^[0-9a-f-]{36}$/i

export async function PUT(req: NextRequest, { params }: Ctx) {
  const { db, res } = withDb()
  if (res) return res
  if (!UUID.test(params.id)) return fail('ID が正しくありません。', 400)
  const parsed = parseAnnouncement(await readJson(req))
  if (!parsed.ok) return fail(parsed.errors.join('\n'), 422, { errors: parsed.errors })
  const { data, error } = await db.from('announcements').update(parsed.value).eq('id', params.id).select('id')
  if (error) return fail(`保存に失敗しました: ${error.message}`, 500)
  if (!data?.length) return fail('お知らせが見つかりません。', 404)
  revalidateTag(ANNOUNCEMENTS_TAG)
  return json({ ok: true })
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const { db, res } = withDb()
  if (res) return res
  if (!UUID.test(params.id)) return fail('ID が正しくありません。', 400)
  const { error } = await db.from('announcements').delete().eq('id', params.id)
  if (error) return fail(`削除に失敗しました: ${error.message}`, 500)
  revalidateTag(ANNOUNCEMENTS_TAG)
  return json({ ok: true })
}
