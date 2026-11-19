import 'server-only'
import { cookies } from 'next/headers'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { SUPABASE_ANON_KEY, SUPABASE_URL, supabaseConfigured } from '@/lib/supabaseEnv'

export { supabaseConfigured }

let publicClient: SupabaseClient | null | undefined

/**
 * 公開キー（anon）で接続するクライアント。ログイン情報を持たず、学習者向けの関数
 * （public_* / log_* / submit_*）だけを呼ぶ。未設定なら null。
 * API ルートでは fetchCache = 'force-no-store' を指定して Next.js のデータキャッシュに載せないこと
 * （unstable_cache の中では Next.js が自動で no-store にする）。
 */
export function getPublicDb(): SupabaseClient | null {
  if (publicClient !== undefined) return publicClient
  publicClient = supabaseConfigured()
    ? createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!, { auth: { persistSession: false, autoRefreshToken: false } })
    : null
  return publicClient
}

/**
 * ログイン中の運用者として接続するクライアント（Route Handler 用）。
 * 権限は DB の RLS（is_admin()）で判定される。未設定なら null。
 */
export function getAdminDb(): SupabaseClient | null {
  if (!supabaseConfigured()) return null
  const store = cookies()
  return createServerClient(SUPABASE_URL!, SUPABASE_ANON_KEY!, {
    cookies: {
      getAll: () => store.getAll(),
      setAll: list => {
        try {
          list.forEach(({ name, value, options }) => store.set(name, value, options))
        } catch {
          // 書き込めない文脈では middleware が更新する
        }
      },
    },
  })
}
