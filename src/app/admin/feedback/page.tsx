'use client'
import { useState } from 'react'
import clsx from 'clsx'
import { api, useApi, fmtDateTime, ApiError } from '@/components/admin/api'
import { LoadState } from '@/components/admin/AdminShell'
import { FEEDBACK_KIND, FEEDBACK_STATUS } from '@/components/admin/labels'

type Status = keyof typeof FEEDBACK_STATUS

interface Feedback {
  id: string
  kind: keyof typeof FEEDBACK_KIND
  message: string
  page: string | null
  status: Status
  admin_note: string | null
  created_at: string
  updated_at: string
}

function NoteEditor({ f, onSaved }: { f: Feedback; onSaved: () => void }) {
  const [note, setNote] = useState(f.admin_note ?? '')
  const [busy, setBusy] = useState(false)
  const dirty = note !== (f.admin_note ?? '')
  return (
    <div className="mt-2 flex gap-2">
      <input
        value={note}
        onChange={e => setNote(e.target.value)}
        placeholder="対応メモ（任意）"
        className="min-w-0 flex-1 rounded-lg border border-line bg-surface px-2.5 py-1 text-sm focus:border-accent focus:outline-none"
      />
      {dirty && (
        <button
          disabled={busy}
          onClick={async () => {
            setBusy(true)
            try {
              await api(`/api/admin/feedback/${f.id}`, { method: 'PATCH', json: { admin_note: note } })
              onSaved()
            } catch (e) {
              alert((e as ApiError).message)
            } finally {
              setBusy(false)
            }
          }}
          className="btn-ghost px-3 py-1"
        >
          保存
        </button>
      )}
    </div>
  )
}

export default function FeedbackPage() {
  const [status, setStatus] = useState<Status | 'all'>('open')
  const [kind, setKind] = useState<keyof typeof FEEDBACK_KIND | ''>('')
  const { data, error, loading, reload } = useApi<{ counts: Record<Status, number>; feedback: Feedback[] }>(`/api/admin/feedback?status=${status}`)
  const list = (data?.feedback ?? []).filter(f => !kind || f.kind === kind)

  async function update(id: string, s: Status) {
    try {
      await api(`/api/admin/feedback/${id}`, { method: 'PATCH', json: { status: s } })
      await reload()
    } catch (e) {
      alert((e as ApiError).message)
    }
  }

  const tabs = [
    { id: 'open', label: '未対応' },
    { id: 'planned', label: '対応予定' },
    { id: 'done', label: '対応済み' },
    { id: 'dismissed', label: '見送り' },
    { id: 'all', label: 'すべて' },
  ] as const

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">ご意見・改善要望</h1>
        <p className="mt-1 text-sm text-muted">学習者がアプリ下部の「ご意見・改善要望を送る」から送った内容です（匿名）。</p>
      </div>

      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-line">
        <div className="-mb-px flex gap-1 overflow-x-auto" role="tablist">
          {tabs.map(t => (
            <button
              key={t.id}
              role="tab"
              aria-selected={status === t.id}
              onClick={() => setStatus(t.id)}
              className={clsx('shrink-0 border-b-2 px-3 py-2 text-sm font-medium', status === t.id ? 'border-accent text-accent' : 'border-transparent text-muted hover:text-ink')}
            >
              {t.label}
              {data && t.id !== 'all' && <span className="tabular ml-1.5 text-xs">{data.counts[t.id] ?? 0}</span>}
            </button>
          ))}
        </div>
        <label className="mb-2 flex items-center gap-2 text-sm text-muted">
          種類
          <select value={kind} onChange={e => setKind(e.target.value as typeof kind)} className="rounded-lg border border-line bg-surface px-2 py-1 text-sm text-ink">
            <option value="">すべて</option>
            {Object.entries(FEEDBACK_KIND).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </label>
      </div>

      {!data && <LoadState loading={loading} error={error} />}
      {data && !list.length && <p className="card px-4 py-10 text-center text-sm text-muted">該当するご意見はありません</p>}
      {data && list.length > 0 && (
        <ul className="space-y-3">
          {list.map(f => (
            <li key={f.id} className="card p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    <span className={clsx('rounded-md px-1.5 py-0.5 text-xs font-medium', FEEDBACK_STATUS[f.status].cls)}>{FEEDBACK_STATUS[f.status].label}</span>
                    <span className="font-semibold">{FEEDBACK_KIND[f.kind]}</span>
                    <span className="text-xs text-muted">{fmtDateTime(f.created_at)}</span>
                    {f.page && <span className="font-mono text-xs text-muted">{f.page}</span>}
                  </div>
                  <p className="mt-2 whitespace-pre-wrap break-words text-sm">{f.message}</p>
                </div>
                <label className="shrink-0 text-sm">
                  <span className="sr-only">対応状況</span>
                  <select
                    value={f.status}
                    onChange={e => update(f.id, e.target.value as Status)}
                    className="rounded-lg border border-line bg-surface px-2 py-1.5 text-sm"
                  >
                    {Object.entries(FEEDBACK_STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                </label>
              </div>
              <NoteEditor f={f} onSaved={reload} />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
