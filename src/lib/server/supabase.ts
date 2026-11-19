import 'server-only'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

let client: SupabaseClient | null | undefined

/**
 * service_role キーで接続する Supabase クライアント。サーバー側専用（RLS をバイパスする）。
 * 環境変数が未設定なら null を返し、呼び出し側は機能を無効として扱う。
 * API ルートでは fetchCache = 'force-no-store' を指定して Next.js のデータキャッシュに載せないこと
 * （unstable_cache の中では Next.js が自動で no-store にする）。
 */
export function getSupabase(): SupabaseClient | null {
  if (client !== undefined) return client
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  client =
    url && key
      ? createClient(url, key, {
          auth: { persistSession: false, autoRefreshToken: false },
        })
      : null
  return client
}

export const supabaseConfigured = () => !!(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY)
