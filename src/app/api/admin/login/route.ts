import { type NextRequest } from 'next/server'
import { ADMIN_COOKIE, SESSION_HOURS, adminConfigured, createSession, safeEqual } from '@/lib/server/adminAuth'
import { clientIp, fail, json, rateLimiter, readJson } from '@/lib/server/api'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

const limited = rateLimiter(10, 15 * 60_000)

export async function POST(req: NextRequest) {
  if (!adminConfigured()) return fail('管理画面は無効です（環境変数 ADMIN_PASSWORD が未設定です）。', 503, { code: 'not_configured' })
  if (limited(clientIp(req))) return fail('ログインの試行回数が多すぎます。15分ほどおいてからお試しください。', 429)

  const body = await readJson<{ password?: unknown }>(req)
  const password = typeof body?.password === 'string' ? body.password : ''
  if (!password || !(await safeEqual(password, process.env.ADMIN_PASSWORD!))) {
    return fail('パスワードが正しくありません。', 401)
  }
  const token = await createSession()
  const res = json({ ok: true })
  res.cookies.set(ADMIN_COOKIE, token!, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: SESSION_HOURS * 3600,
  })
  return res
}
