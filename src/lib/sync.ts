'use client'
// ログイン中は学習記録を Supabase の study_progress テーブルと同期する
import { useEffect, useSyncExternalStore } from 'react'
import type { Session } from '@supabase/supabase-js'
import { getSupabase } from './supabase'
import { getProgress, mergeProgress, onProgressSaved, replaceProgress, type Progress } from './progress'

export type SyncStatus = 'off' | 'syncing' | 'synced' | 'error'

interface SyncState {
  session: Session | null
  status: SyncStatus
  lastSyncedAt: number | null
  ready: boolean
}

let state: SyncState = { session: null, status: 'off', lastSyncedAt: null, ready: false }
const listeners = new Set<() => void>()
const set = (patch: Partial<SyncState>) => {
  state = { ...state, ...patch }
  listeners.forEach(l => l())
}

export function useSync(): SyncState {
  return useSyncExternalStore(
    l => {
      listeners.add(l)
      return () => listeners.delete(l)
    },
    () => state,
    () => state,
  )
}

let pushTimer: ReturnType<typeof setTimeout> | null = null
let pending: Progress | null = null

async function push(p: Progress) {
  const sb = getSupabase()
  const user = state.session?.user
  if (!sb || !user) return
  set({ status: 'syncing' })
  const { error } = await sb
    .from('study_progress')
    .upsert({ user_id: user.id, exam: 'sg', data: p, updated_at: new Date().toISOString() })
  if (error) {
    console.error('sync push failed', error)
    set({ status: 'error' })
  } else {
    set({ status: 'synced', lastSyncedAt: Date.now() })
  }
}

function flush() {
  if (pushTimer) clearTimeout(pushTimer)
  pushTimer = null
  if (pending) {
    const p = pending
    pending = null
    void push(p)
  }
}

/** サーバーの記録を取り込み、端末の記録と統合して両方を更新する */
async function pullAndMerge() {
  const sb = getSupabase()
  const user = state.session?.user
  if (!sb || !user) return
  set({ status: 'syncing' })
  const { data, error } = await sb.from('study_progress').select('data').eq('user_id', user.id).maybeSingle()
  if (error) {
    console.error('sync pull failed', error)
    set({ status: 'error' })
    return
  }
  const merged = data?.data ? mergeProgress(getProgress(), data.data as Partial<Progress>) : getProgress()
  replaceProgress(merged)
  await push(merged)
}

let started = false

/** アプリ起動時に1回だけ呼ぶ */
export function useSyncEngine() {
  useEffect(() => {
    const sb = getSupabase()
    if (!sb || started) {
      set({ ready: true })
      return
    }
    started = true

    const { data: sub } = sb.auth.onAuthStateChange((event, session) => {
      const prevUser = state.session?.user.id
      set({ session, ready: true, status: session ? state.status : 'off' })
      if (session && (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && prevUser !== session.user.id) {
        // コールバック内で await しない（supabase-js のデッドロック回避）
        setTimeout(() => void pullAndMerge(), 0)
      }
    })

    const off = onProgressSaved(p => {
      if (!state.session) return
      pending = p
      if (pushTimer) clearTimeout(pushTimer)
      pushTimer = setTimeout(flush, 1500)
    })

    const onHide = () => document.visibilityState === 'hidden' && flush()
    const onFocus = () => state.session && void pullAndMerge()
    document.addEventListener('visibilitychange', onHide)
    window.addEventListener('pagehide', flush)
    window.addEventListener('focus', onFocus)

    return () => {
      sub.subscription.unsubscribe()
      off()
      document.removeEventListener('visibilitychange', onHide)
      window.removeEventListener('pagehide', flush)
      window.removeEventListener('focus', onFocus)
      started = false
    }
  }, [])
}

export async function signInWithEmail(email: string) {
  const sb = getSupabase()
  if (!sb) throw new Error('同期機能が設定されていません。')
  const { error } = await sb.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: `${window.location.origin}/account`, shouldCreateUser: true },
  })
  if (error) throw error
}

export async function signOut() {
  flush()
  const sb = getSupabase()
  await sb?.auth.signOut()
  set({ session: null, status: 'off', lastSyncedAt: null })
}

export async function syncNow() {
  await pullAndMerge()
}
