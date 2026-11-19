import { revalidateTag } from 'next/cache'
import { type NextRequest } from 'next/server'
import { fail, json, readJson, withDb } from '@/lib/server/api'
import { ANNOUNCEMENTS_TAG } from '@/lib/server/bank'
import { parseAnnouncement } from '@/lib/server/announcementInput'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

export async function GET() {
  const { db, res } = withDb()
  if (res) return res
  const { data, error } = await db.from('announcements').select('*').order('created_at', { ascending: false }).limit(200)
  if (error) return fail(`取得に失敗しました: ${error.message}`, 500)
  return json({ announcements: data ?? [] })
}

export async function POST(req: NextRequest) {
  const { db, res } = withDb()
  if (res) return res
  const parsed = parseAnnouncement(await readJson(req))
  if (!parsed.ok) return fail(parsed.errors.join('\n'), 422, { errors: parsed.errors })
  const { data, error } = await db.from('announcements').insert(parsed.value).select('id').single()
  if (error) return fail(`保存に失敗しました: ${error.message}`, 500)
  revalidateTag(ANNOUNCEMENTS_TAG)
  return json({ id: data.id }, 201)
}
