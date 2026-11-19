'use client'
import Link from 'next/link'
import { useState } from 'react'
import clsx from 'clsx'
import { Check } from 'lucide-react'
import { categoryOf, type CategoryId } from '@/data/exam'
import { api, useApi, fmtDateTime, ApiError } from '@/components/admin/api'
import { LoadState } from '@/components/admin/AdminShell'
import { REPORT_KIND, REPORT_STATUS } from '@/components/admin/labels'

const KANA = ['ア', 'イ', 'ウ', 'エ']

interface Report {
  id: string
  question_id: string
  kind: keyof typeof REPORT_KIND
  message: string
  selected: number | null
  status: keyof typeof REPORT_STATUS
  admin_note: string | null
  created_at: string
  resolved_at: string | null
  question: { category: CategoryId; text: string } | null
}

function NoteEditor({ r, onSaved }: { r: Report; onSaved: () => void }) {
  const [note, setNote] = useState(r.admin_note ?? '')
  const [busy, setBusy] = useState(false)
  const dirty = note !== (r.admin_note ?? '')
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
              await api(`/api/admin/reports/${r.id}`, { method: 'PATCH', json: { admin_note: note } })
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

export default function ReportsPage() {
  const [status, setStatus] = useState<'open' | 'resolved' | 'dismissed' | 'all'>('open')
  const { data, error, loading, reload } = useApi<{ counts: Record<string, number>; reports: Report[] }>(`/api/admin/reports?status=${status}`)

  async function update(id: string, s: Report['status']) {
    try {
      await api(`/api/admin/reports/${id}`, { method: 'PATCH', json: { status: s } })
      await reload()
    } catch (e) {
      alert((e as ApiError).message)
    }
  }

  const tabs = [
    { id: 'open', label: '未対応' },
    { id: 'resolved', label: '対応済み' },
    { id: 'dismissed', label: '対応不要' },
    { id: 'all', label: 'すべて' },
  ] as const

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">誤り報告</h1>
        <p className="mt-1 text-sm text-muted">学習者が解説画面の「問題の誤りを報告」から送った内容です。問題を修正したら「対応済み」にしてください。</p>
      </div>

      <div className="flex gap-1 border-b border-line" role="tablist">
        {tabs.map(t => (
          <button
            key={t.id}
            role="tab"
            aria-selected={status === t.id}
            onClick={() => setStatus(t.id)}
            className={clsx('-mb-px border-b-2 px-3 py-2 text-sm font-medium', status === t.id ? 'border-accent text-accent' : 'border-transparent text-muted hover:text-ink')}
          >
            {t.label}
            {data && t.id !== 'all' && <span className="tabular ml-1.5 text-xs">{data.counts[t.id] ?? 0}</span>}
          </button>
        ))}
      </div>

      {!data && <LoadState loading={loading} error={error} />}
      {data && !data.reports.length && <p className="card px-4 py-10 text-center text-sm text-muted">該当する報告はありません</p>}
      {data && data.reports.length > 0 && (
        <ul className="space-y-3">
          {data.reports.map(r => (
            <li key={r.id} className="card p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    <span className={clsx('rounded-md px-1.5 py-0.5 text-xs font-medium', REPORT_STATUS[r.status].cls)}>{REPORT_STATUS[r.status].label}</span>
                    <span className="font-semibold">{REPORT_KIND[r.kind]}</span>
                    <span className="text-xs text-muted">{fmtDateTime(r.created_at)}</span>
                  </div>
                  <Link href={`/admin/questions/${r.question_id}`} className="mt-2 block rounded-lg bg-sunken px-3 py-2 text-sm hover:bg-line/50">
                    <span className="font-mono text-xs text-muted">{r.question_id}</span>
                    {r.question && <span className="text-xs text-muted"> · {categoryOf(r.question.category).short}</span>}
                    <span className="block truncate">{r.question?.text ?? '（この問題は現在出題されていません）'}</span>
                  </Link>
                  {r.message && <p className="mt-2 whitespace-pre-wrap text-sm">{r.message}</p>}
                  {r.selected !== null && <p className="mt-1 text-xs text-muted">報告者が選んだ答え: {KANA[r.selected]}</p>}
                </div>
                <div className="flex shrink-0 gap-2">
                  {r.status === 'open' ? (
                    <>
                      <button onClick={() => update(r.id, 'resolved')} className="btn-primary px-3 py-1.5"><Check className="h-4 w-4" aria-hidden />対応済み</button>
                      <button onClick={() => update(r.id, 'dismissed')} className="btn-ghost px-3 py-1.5">対応不要</button>
                    </>
                  ) : (
                    <button onClick={() => update(r.id, 'open')} className="btn-ghost px-3 py-1.5">未対応に戻す</button>
                  )}
                </div>
              </div>
              <NoteEditor r={r} onSaved={reload} />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
