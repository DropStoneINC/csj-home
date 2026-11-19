'use client'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

let client: SupabaseClient | null = null

/** Supabase のクライアント。環境変数が未設定なら null（同期なしで動作する） */
export function getSupabase(): SupabaseClient | null {
  if (!url || !key || typeof window === 'undefined') return null
  if (!client) {
    client = createClient(url, key, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, storageKey: 'csj-auth' },
    })
  }
  return client
}

export const supabaseEnabled = !!url && !!key
