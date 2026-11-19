import 'server-only'
import { NextResponse, type NextRequest } from 'next/server'
import type { SupabaseClient } from '@supabase/supabase-js'
import { getAdminDb } from './supabase'

export const json = (data: unknown, status = 200) => NextResponse.json(data, { status, headers: { 'Cache-Control': 'no-store' } })
export const fail = (error: string, status = 400, extra?: Record<string, unknown>) => json({ error, ...extra }, status)

/** ログイン中の運用者として DB に接続する。未設定なら 503 を返す */
export function withDb(): { db: SupabaseClient; res?: never } | { db?: never; res: NextResponse } {
  const db = getAdminDb()
  if (!db) return { res: fail('Supabase が未設定です。環境変数 NEXT_PUBLIC_SUPABASE_URL と NEXT_PUBLIC_SUPABASE_ANON_KEY を設定してください。', 503, { code: 'not_configured' }) }
  return { db }
}

export async function readJson<T = Record<string, unknown>>(req: NextRequest): Promise<T | null> {
  try {
    return (await req.json()) as T
  } catch {
    return null
  }
}

export const clientIp = (req: NextRequest) => req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'

/** ベストエフォートの簡易レート制限（サーバーレスのインスタンスごと） */
export function rateLimiter(max: number, windowMs: number) {
  const hits = new Map<string, number[]>()
  return (key: string) => {
    const now = Date.now()
    const recent = (hits.get(key) ?? []).filter(t => now - t < windowMs)
    recent.push(now)
    hits.set(key, recent)
    if (hits.size > 5000) hits.clear()
    return recent.length > max
  }
}

/** 端末の匿名ID（英数とハイフンのみ、64文字まで） */
export const cleanClientId = (v: unknown) => (typeof v === 'string' && /^[A-Za-z0-9-]{8,64}$/.test(v) ? v : null)
