'use client'
// 匿名の利用ログ。端末ごとのランダムIDと解答結果だけを送り、個人を特定する情報は送らない。
// サーバー側（Supabase）が未設定のときは何も送らない。

const CID_KEY = 'csj-cid'

export const features = { telemetry: false, reports: false }

/** サーバーから渡された設定を反映する（描画中に呼ばれる） */
export function setFeatures(f: Partial<typeof features>) {
  Object.assign(features, f)
}

let cid: string | null = null
export function clientId(): string {
  if (cid) return cid
  try {
    cid = localStorage.getItem(CID_KEY)
    if (!cid || !/^[A-Za-z0-9-]{8,64}$/.test(cid)) {
      cid = crypto.randomUUID()
      localStorage.setItem(CID_KEY, cid)
    }
  } catch {
    cid ??= `tmp-${Math.random().toString(36).slice(2, 12)}`
  }
  return cid
}

type EventInput =
  | { type: 'answer'; q: string; ok: boolean }
  | { type: 'session'; mode: string; total: number; score: number }
type Event = EventInput & { at: number }

let queue: Event[] = []
let timer: ReturnType<typeof setTimeout> | null = null
let listening = false

function flush() {
  if (timer) clearTimeout(timer)
  timer = null
  if (!queue.length) return
  const payload = JSON.stringify({ clientId: clientId(), events: queue.splice(0, 100) })
  try {
    const sent = navigator.sendBeacon?.('/api/events', new Blob([payload], { type: 'application/json' }))
    if (!sent) void fetch('/api/events', { method: 'POST', body: payload, keepalive: true, headers: { 'Content-Type': 'application/json' } }).catch(() => {})
  } catch {
    // 送れなくても学習には影響させない
  }
  if (queue.length) flush()
}

export function track(e: EventInput) {
  if (!features.telemetry || typeof window === 'undefined') return
  queue.push({ ...e, at: Date.now() })
  if (!listening) {
    listening = true
    // タブを閉じる・裏に回すときにまとめて送る
    window.addEventListener('pagehide', flush)
    document.addEventListener('visibilitychange', () => document.visibilityState === 'hidden' && flush())
  }
  if (queue.length >= 20) flush()
  else if (!timer) timer = setTimeout(flush, 10_000)
}
