import { NextResponse, type NextRequest } from 'next/server'
import { createSession, googleLoginEnabled, safeEqual, sessionCookie } from '@/lib/server/adminAuth'
import { OAUTH_COOKIE, checkClaims, exchangeCode, safeNext } from '@/lib/server/googleAuth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

function toLogin(req: NextRequest, error: string, email?: string) {
  const url = new URL('/admin/login', req.nextUrl.origin)
  url.searchParams.set('error', error)
  if (email) url.searchParams.set('email', email)
  const res = NextResponse.redirect(url)
  res.cookies.set(OAUTH_COOKIE, '', { path: '/api/admin/google', maxAge: 0 })
  return res
}

const escapeHtml = (s: string) => s.replace(/[&<>"']/g, c => `&#${c.charCodeAt(0)};`)

export async function GET(req: NextRequest) {
  if (!googleLoginEnabled()) return toLogin(req, 'google_not_configured')
  const q = req.nextUrl.searchParams
  if (q.get('error')) return toLogin(req, 'google_cancelled')

  let saved: { state?: string; nonce?: string; verifier?: string; next?: string } = {}
  try {
    saved = JSON.parse(req.cookies.get(OAUTH_COOKIE)?.value ?? '{}')
  } catch {
    // 壊れた Cookie は期限切れと同じ扱い
  }
  const code = q.get('code')
  const state = q.get('state')
  if (!code || !state || !saved.state || !saved.nonce || !saved.verifier || !(await safeEqual(state, saved.state))) {
    return toLogin(req, 'google_expired')
  }

  let result
  try {
    result = checkClaims(await exchangeCode(req, code, saved.verifier), saved.nonce)
  } catch (e) {
    console.error('[admin] google login failed', e)
    return toLogin(req, 'google_failed')
  }
  if (!result.ok) return toLogin(req, result.reason === 'forbidden' ? 'google_forbidden' : 'google_failed', result.email)

  const token = await createSession(result.email)
  if (!token) return toLogin(req, 'google_failed')

  // セッション Cookie は SameSite=Strict。Google からのリダイレクトの続きで /admin に飛ぶと
  // クロスサイト扱いで Cookie が送られないため、いったん自サイトのページから遷移し直す。
  const next = escapeHtml(safeNext(saved.next))
  const res = new NextResponse(
    `<!doctype html><meta charset="utf-8"><meta http-equiv="refresh" content="0;url=${next}"><title>ログインしています…</title><p style="font-family:sans-serif">ログインしています… <a href="${next}">進まない場合はこちら</a></p>`,
    { headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'Referrer-Policy': 'no-referrer' } },
  )
  res.cookies.set(...sessionCookie(token))
  res.cookies.set(OAUTH_COOKIE, '', { path: '/api/admin/google', maxAge: 0 })
  return res
}
