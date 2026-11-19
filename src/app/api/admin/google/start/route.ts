import { NextResponse, type NextRequest } from 'next/server'
import { googleLoginEnabled } from '@/lib/server/adminAuth'
import { OAUTH_COOKIE, buildAuthRequest, safeNext } from '@/lib/server/googleAuth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  if (!googleLoginEnabled()) {
    return NextResponse.redirect(new URL('/admin/login?error=google_not_configured', req.nextUrl.origin))
  }
  const { url, cookie } = buildAuthRequest(req, safeNext(req.nextUrl.searchParams.get('next')))
  const res = NextResponse.redirect(url)
  res.headers.set('Cache-Control', 'no-store')
  // Google から戻ってくるのはクロスサイトのトップレベル遷移なので SameSite=Lax にする
  res.cookies.set(OAUTH_COOKIE, cookie, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/api/admin/google',
    maxAge: 10 * 60,
  })
  return res
}
