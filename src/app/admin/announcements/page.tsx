'use client'
import { useState } from 'react'
import clsx from 'clsx'
import { Plus, Loader2, Pencil, Trash2 } from 'lucide-react'
import { api, useApi, fmtDateTime, ApiError } from '@/components/admin/api'
import { LoadState } from '@/components/admin/AdminShell'
import { ANNOUNCEMENT_LEVEL } from '@/components/admin/labels'

interface Announcement {
  id: string
  title: string
  body: string
  level: keyof typeof ANNOUNCEMENT_LEVEL
  published: boolean
  starts_at: string | null
  ends_at: string | null
  created_at: string
  updated_at: string
}

type Draft = Omit<Announcement, 'id' | 'created_at' | 'updated_at'> & { id?: string }
const EMPTY: Draft = { title: '', body: '', level: 'info', published: false, starts_at: null, ends_at: null }

/** ISO ⇔ datetime-local（日本時間で入力する） */
const toLocal = (iso: string | null) => {
  if (!iso) return ''
  const d = new Date(new Date(iso).getTime() + 9 * 3_600_000)
  return d.toISOString().slice(0, 16)
}
const fromLocal = (v: string) => (v ? new Date(`${v}:00+09:00`).toISOString() : null)

function stateOf(a: Announcement) {
  const now = Date.now()
  if (!a.published) return { label: '下書き', cls: 'bg-sunken text-muted' }
  if (a.starts_at && new Date(a.starts_at).getTime() > now) return { label: '公開予定', cls: 'bg-warn-soft text-warn' }
  if (a.ends_at && new Date(a.ends_at).getTime() <= now) return { label: '終了', cls: 'bg-sunken text-muted' }
  return { label: '表示中', cls: 'bg-ok-soft text-ok' }
}

function Editor({ initial, onDone }: { initial: Draft; onDone: (saved: boolean) => void }) {
  const [d, setD] = useState<Draft>(initial)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setD(x => ({ ...x, [k]: v }))
  const input = 'w-full rounded-xl border border-line bg-surface px-3 py-2 text-sm focus:border-accent focus:outline-none'

  async function save() {
    setBusy(true)
    setError(null)
    try {
      const { id, ...body } = d
      if (id) await api(`/api/admin/announcements/${id}`, { method: 'PUT', json: body })
      else await api('/api/admin/announcements', { method: 'POST', json: body })
      onDone(true)
    } catch (e) {
      setError((e as ApiError).message)
      setBusy(false)
    }
  }

  return (
    <div className="card space-y-4 border-accent/40 p-5">
      <h2 className="font-bold">{d.id ? 'お知らせを編集' : '新しいお知らせ'}</h2>
      <div className="grid gap-3 sm:grid-cols-[1fr_12rem]">
        <label className="block text-sm">
          <span className="font-medium">タイトル</span>
          <input value={d.title} onChange={e => set('title', e.target.value)} maxLength={100} className={clsx(input, 'mt-1.5')} placeholder="例: 12/1 2:00〜4:00 メンテナンスのお知らせ" />
        </label>
        <label className="block text-sm">
          <span className="font-medium">種類</span>
          <select value={d.level} onChange={e => set('level', e.target.value as Draft['level'])} className={clsx(input, 'mt-1.5')}>
            {Object.entries(ANNOUNCEMENT_LEVEL).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
        </label>
      </div>
      <label className="block text-sm">
        <span className="font-medium">本文</span><span className="ml-2 text-xs text-muted">任意・2000文字まで</span>
        <textarea value={d.body} onChange={e => set('body', e.target.value)} rows={4} maxLength={2000} className={clsx(input, 'mt-1.5')} />
      </label>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="font-medium">表示開始</span><span className="ml-2 text-xs text-muted">空欄ならすぐ（日本時間）</span>
          <input type="datetime-local" value={toLocal(d.starts_at)} onChange={e => set('starts_at', fromLocal(e.target.value))} className={clsx(input, 'mt-1.5')} />
        </label>
        <label className="block text-sm">
          <span className="font-medium">表示終了</span><span className="ml-2 text-xs text-muted">空欄なら無期限（日本時間）</span>
          <input type="datetime-local" value={toLocal(d.ends_at)} onChange={e => set('ends_at', fromLocal(e.target.value))} className={clsx(input, 'mt-1.5')} />
        </label>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={d.published} onChange={e => set('published', e.target.checked)} />
        公開する（オフなら下書きとして保存）
      </label>
      {error && <p className="whitespace-pre-wrap text-sm text-ng" role="alert">{error}</p>}
      <div className="flex justify-end gap-2">
        <button onClick={() => onDone(false)} className="btn-ghost">キャンセル</button>
        <button onClick={save} disabled={busy} className="btn-primary">{busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}保存</button>
      </div>
    </div>
  )
}

export default function AnnouncementsPage() {
  const { data, error, loading, reload } = useApi<{ announcements: Announcement[] }>('/api/admin/announcements')
  const [editing, setEditing] = useState<Draft | null>(null)

  async function remove(a: Announcement) {
    if (!confirm(`「${a.title}」を削除しますか？`)) return
    try {
      await api(`/api/admin/announcements/${a.id}`, { method: 'DELETE' })
      await reload()
    } catch (e) {
      alert((e as ApiError).message)
    }
  }

  async function togglePublish(a: Announcement) {
    try {
      const { id, created_at: _c, updated_at: _u, ...body } = a
      await api(`/api/admin/announcements/${id}`, { method: 'PUT', json: { ...body, published: !a.published } })
      await reload()
    } catch (e) {
      alert((e as ApiError).message)
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">お知らせ</h1>
          <p className="mt-1 text-sm text-muted">公開中のお知らせは、アプリの各画面の上部に表示されます（学習者が閉じると、内容を更新するまで再表示されません）。</p>
        </div>
        {!editing && <button onClick={() => setEditing(EMPTY)} className="btn-primary"><Plus className="h-4 w-4" aria-hidden />お知らせを作成</button>}
      </div>

      {editing && (
        <Editor
          key={editing.id ?? 'new'}
          initial={editing}
          onDone={saved => {
            setEditing(null)
            if (saved) void reload()
          }}
        />
      )}

      {!data && <LoadState loading={loading} error={error} />}
      {data && !data.announcements.length && !editing && <p className="card px-4 py-10 text-center text-sm text-muted">お知らせはまだありません</p>}
      {data && data.announcements.length > 0 && (
        <ul className="space-y-3">
          {data.announcements.map(a => {
            const st = stateOf(a)
            return (
              <li key={a.id} className="card p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={clsx('rounded-md px-1.5 py-0.5 text-xs font-medium', st.cls)}>{st.label}</span>
                      <span className={clsx('rounded-md px-1.5 py-0.5 text-xs font-medium', ANNOUNCEMENT_LEVEL[a.level].cls)}>{ANNOUNCEMENT_LEVEL[a.level].label}</span>
                      <span className="font-semibold">{a.title}</span>
                    </div>
                    {a.body && <p className="mt-1.5 line-clamp-3 whitespace-pre-wrap text-sm text-muted">{a.body}</p>}
                    <p className="mt-1.5 text-xs text-muted">
                      表示期間: {a.starts_at ? fmtDateTime(a.starts_at) : 'すぐ'} 〜 {a.ends_at ? fmtDateTime(a.ends_at) : '無期限'} · 更新 {fmtDateTime(a.updated_at)}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <button onClick={() => togglePublish(a)} className="btn-ghost px-3 py-1.5">{a.published ? '非公開にする' : '公開する'}</button>
                    <button onClick={() => setEditing({ ...a })} className="rounded-lg p-2 text-muted hover:bg-sunken hover:text-ink" aria-label="編集"><Pencil className="h-4 w-4" aria-hidden /></button>
                    <button onClick={() => remove(a)} className="rounded-lg p-2 text-muted hover:bg-ng-soft hover:text-ng" aria-label="削除"><Trash2 className="h-4 w-4" aria-hidden /></button>
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
