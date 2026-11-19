import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { SUPABASE_ANON_KEY, SUPABASE_URL, supabaseConfigured } from '@/lib/supabaseEnv'

// /admin と /api/admin を運用者のログイン必須にする（ログイン画面を除く）。
// 運用者 = Supabase Auth でログインし、admin_users に登録されたメールアドレスのユーザー
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  const isApi = pathname.startsWith('/api/admin')

  // 状態を変える API はクロスサイトからの送信を拒否する（CSRF 対策）
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

  let res = NextResponse.next({ request: req })
  if (pathname === '/admin/login') return res

  const deny = () => {
    if (isApi) return NextResponse.json({ error: 'ログインが必要です。' }, { status: 401 })
    const url = req.nextUrl.clone()
    url.pathname = '/admin/login'
    url.search = pathname === '/admin' ? '' : `?next=${encodeURIComponent(pathname + req.nextUrl.search)}`
    return NextResponse.redirect(url)
  }
  if (!supabaseConfigured()) return deny()

  const supabase = createServerClient(SUPABASE_URL!, SUPABASE_ANON_KEY!, {
    cookies: {
      getAll: () => req.cookies.getAll(),
      setAll: list => {
        list.forEach(({ name, value }) => req.cookies.set(name, value))
        res = NextResponse.next({ request: req })
        list.forEach(({ name, value, options }) => res.cookies.set(name, value, options))
      },
    },
  })

  // getUser() は Supabase Auth に問い合わせてトークンを検証する（期限切れなら更新して Cookie に書き戻す）
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return deny()
  const { data: isAdmin } = await supabase.rpc('is_admin')
  if (isAdmin !== true) return deny()

  res.headers.set('X-Robots-Tag', 'noindex, nofollow')
  res.headers.set('Cache-Control', 'no-store')
  return res
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
}
