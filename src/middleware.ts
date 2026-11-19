import { NextResponse, type NextRequest } from 'next/server'
import { ADMIN_COOKIE, verifySession } from '@/lib/server/adminAuth'

// /admin と /api/admin をログイン必須にする（ログイン画面・ログインAPIを除く）
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  const isApi = pathname.startsWith('/api/admin')
  const isPublic = pathname === '/admin/login' || pathname === '/api/admin/login'

  // 状態を変える API はクロスサイトからの送信を拒否する（CSRF 対策。Cookie の SameSite=Strict と併用）
  if (isApi && req.method !== 'GET' && req.method !== 'HEAD') {
    let originHost: string | null = null
    try {
      originHost = new URL(req.headers.get('origin') ?? '').host
    } catch {
      // Origin なし・"null" など
    }
    if (!originHost || originHost !== req.headers.get('host')) {
      return NextResponse.json({ error: '不正なリクエストです。' }, { status: 403 })
    }
  }

  if (isPublic) return NextResponse.next()

  const ok = await verifySession(req.cookies.get(ADMIN_COOKIE)?.value)
  if (ok) {
    const res = NextResponse.next()
    res.headers.set('X-Robots-Tag', 'noindex, nofollow')
    res.headers.set('Cache-Control', 'no-store')
    return res
  }
  if (isApi) return NextResponse.json({ error: 'ログインが必要です。' }, { status: 401 })
  const url = req.nextUrl.clone()
  url.pathname = '/admin/login'
  url.search = pathname === '/admin' ? '' : `?next=${encodeURIComponent(pathname + req.nextUrl.search)}`
  return NextResponse.redirect(url)
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
}
