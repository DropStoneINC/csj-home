'use client'
import { createBrowserClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'
import { SUPABASE_ANON_KEY, SUPABASE_URL, supabaseConfigured } from './supabaseEnv'

let client: SupabaseClient | null = null

/** 管理画面のログイン用（セッションは Cookie に保存され、サーバー側と共有される） */
export function getBrowserSupabase(): SupabaseClient | null {
  if (!supabaseConfigured()) return null
  client ??= createBrowserClient(SUPABASE_URL!, SUPABASE_ANON_KEY!)
  return client
}
