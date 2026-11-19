'use client'
import Link from 'next/link'
import { Suspense, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import clsx from 'clsx'
import { Plus, Download, Search, Flag, EyeOff } from 'lucide-react'
import { CATEGORIES, LEVELS, categoryOf, type Question } from '@/data/exam'
import { useApi, rate } from '@/components/admin/api'
import { LoadState } from '@/components/admin/AdminShell'

const KANA = ['ア', 'イ', 'ウ', 'エ']

type Item = Omit<Question, 'explanation'> & {
  source: 'base' | 'edited' | 'added'
  status: 'published' | 'hidden'
  note: string | null
  updated_at: string | null
  stats: { attempts: number; correct: number; ai_asks: number }
  openReports: number
}

const SOURCE_LABEL = { base: '元データ', edited: '編集済み', added: '追加' } as const
const SOURCE_CLS = { base: 'bg-sunken text-muted', edited: 'bg-warn-soft text-warn', added: 'bg-accent-soft text-accent' }

const SORTS = {
  id: { label: '既定の順', fn: () => 0 },
  accuracy: {
    label: '正答率が低い順',
    fn: (a: Item, b: Item) => (a.stats.attempts ? a.stats.correct / a.stats.attempts : 2) - (b.stats.attempts ? b.stats.correct / b.stats.attempts : 2),
  },
  attempts: { label: '解答数が多い順', fn: (a: Item, b: Item) => b.stats.attempts - a.stats.attempts },
  reports: { label: '報告が多い順', fn: (a: Item, b: Item) => b.openReports - a.openReports },
  updated: { label: '更新が新しい順', fn: (a: Item, b: Item) => (b.updated_at ?? '').localeCompare(a.updated_at ?? '') },
}

function QuestionsInner() {
  const router = useRouter()
  const params = useSearchParams()
  const { data, error, loading } = useApi<{ questions: Item[] }>('/api/admin/questions')
  const [q, setQ] = useState('')
  const category = params.get('category') ?? ''
  const [level, setLevel] = useState('')
  const [source, setSource] = useState('')
  const [status, setStatus] = useState('')
  const [onlyReported, setOnlyReported] = useState(false)
  const [sort, setSort] = useState<keyof typeof SORTS>('id')
  const [exportCat, setExportCat] = useState(category || CATEGORIES[0].id)

  const setCategory = (c: string) => {
    const sp = new URLSearchParams(params.toString())
    if (c) sp.set('category', c)
    else sp.delete('category')
    router.replace(`/admin/questions${sp.size ? `?${sp}` : ''}`)
    if (c) setExportCat(c as typeof exportCat)
  }

  const filtered = useMemo(() => {
    if (!data) return []
    const words = q.trim().toLowerCase().split(/\s+/).filter(Boolean)
    return data.questions
      .filter(
        x =>
          (!category || x.category === category) &&
          (!level || String(x.level) === level) &&
          (!source || x.source === source) &&
          (!status || x.status === status) &&
          (!onlyReported || x.openReports > 0) &&
          words.every(w => [x.id, x.question, ...x.choices, ...(x.tags ?? [])].join('\n').toLowerCase().includes(w)),
      )
      .sort(SORTS[sort].fn)
  }, [data, q, category, level, source, status, onlyReported, sort])

  // 選択中の分野の正解位置の偏り（validate-questions と同じ基準: 40%超で警告）
  const dist = useMemo(() => {
    if (!data || !category) return null
    const qs = data.questions.filter(x => x.category === category && x.status === 'published')
    const d = [0, 0, 0, 0]
    qs.forEach(x => d[x.answer]++)
    return { d, n: qs.length, skew: qs.length >= 8 && d.some(v => v / qs.length > 0.4) }
  }, [data, category])

  const counts = useMemo(() => {
    const c = { edited: 0, added: 0, hidden: 0, reported: 0 }
    data?.questions.forEach(x => {
      if (x.source === 'edited') c.edited++
      if (x.source === 'added') c.added++
      if (x.status === 'hidden') c.hidden++
      if (x.openReports) c.reported++
    })
    return c
  }, [data])

  const select = 'rounded-lg border border-line bg-surface px-2 py-1.5 text-sm'

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">問題管理</h1>
          {data && (
            <p className="mt-1 text-sm text-muted">
              全{data.questions.length}問 · 編集済み {counts.edited} · 追加 {counts.added} · 非公開 {counts.hidden} · 報告あり {counts.reported}
            </p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center overflow-hidden rounded-xl border border-line bg-surface">
            <select value={exportCat} onChange={e => setExportCat(e.target.value as typeof exportCat)} className="bg-transparent px-2 py-2 text-sm" aria-label="書き出す分野">
              {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.short}</option>)}
            </select>
            <a
              href={`/api/admin/questions/export?category=${exportCat}`}
              className="flex items-center gap-1.5 border-l border-line px-3 py-2 text-sm font-semibold hover:bg-sunken"
              title="src/data/questions/ に置く JSON をダウンロード（非公開の問題は含みません）"
            >
              <Download className="h-4 w-4" aria-hidden />JSON
            </a>
          </div>
          <Link href="/admin/questions/new" className="btn-primary"><Plus className="h-4 w-4" aria-hidden />問題を追加</Link>
        </div>
      </div>

      <div className="card flex flex-wrap items-center gap-2 p-3">
        <label className="relative min-w-[12rem] flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden />
          <input
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="ID・問題文・選択肢・タグで検索"
            className="w-full rounded-lg border border-line bg-surface py-1.5 pl-8 pr-2 text-sm focus:border-accent focus:outline-none"
          />
        </label>
        <select value={category} onChange={e => setCategory(e.target.value)} className={select} aria-label="分野">
          <option value="">すべての分野</option>
          {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select value={level} onChange={e => setLevel(e.target.value)} className={select} aria-label="レベル">
          <option value="">全レベル</option>
          {LEVELS.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
        </select>
        <select value={source} onChange={e => setSource(e.target.value)} className={select} aria-label="種別">
          <option value="">すべての種別</option>
          {Object.entries(SOURCE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select value={status} onChange={e => setStatus(e.target.value)} className={select} aria-label="公開状態">
          <option value="">公開・非公開</option>
          <option value="published">公開中</option>
          <option value="hidden">非公開</option>
        </select>
        <label className="flex items-center gap-1.5 px-1 text-sm">
          <input type="checkbox" checked={onlyReported} onChange={e => setOnlyReported(e.target.checked)} />
          報告あり
        </label>
        <select value={sort} onChange={e => setSort(e.target.value as keyof typeof SORTS)} className={select} aria-label="並び順">
          {Object.entries(SORTS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
      </div>

      {dist && (
        <p className={clsx('text-sm', dist.skew ? 'text-warn' : 'text-muted')}>
          {categoryOf(category as Question['category']).name}の正解位置（公開中 {dist.n}問）: {dist.d.map((v, i) => `${KANA[i]} ${v}`).join(' / ')}
          {dist.skew && ' — 偏りがあります（1つの位置が40%超）'}
        </p>
      )}

      {!data && <LoadState loading={loading} error={error} />}
      {data && (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[720px] table-fixed text-sm">
            <colgroup>
              <col className="w-36" />
              <col />
              <col className="w-40" />
              <col className="w-20" />
              <col className="w-20" />
              <col className="w-20" />
            </colgroup>
            <thead className="border-b border-line text-left text-xs text-muted">
              <tr>
                <th className="px-4 py-2 font-medium">ID</th>
                <th className="px-2 py-2 font-medium">問題</th>
                <th className="px-2 py-2 font-medium">種別</th>
                <th className="px-2 py-2 text-right font-medium">解答数</th>
                <th className="px-2 py-2 text-right font-medium">正答率</th>
                <th className="px-4 py-2 text-right font-medium">報告</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {filtered.slice(0, 500).map(x => (
                <tr key={x.id} className={clsx('cursor-pointer hover:bg-sunken', x.status === 'hidden' && 'opacity-60')} onClick={() => router.push(`/admin/questions/${x.id}`)}>
                  <td className="whitespace-nowrap px-4 py-2.5 align-top">
                    <Link href={`/admin/questions/${x.id}`} className="font-mono text-xs hover:underline" onClick={e => e.stopPropagation()}>{x.id}</Link>
                    <div className="mt-0.5 text-xs text-muted">{x.subject}・{LEVELS.find(l => l.id === x.level)?.name}</div>
                  </td>
                  <td className="px-2 py-2.5 align-top">
                    <div className="line-clamp-2">{x.question}</div>
                  </td>
                  <td className="whitespace-nowrap px-2 py-2.5 align-top">
                    <span className={clsx('rounded-md px-1.5 py-0.5 text-xs font-medium', SOURCE_CLS[x.source])}>{SOURCE_LABEL[x.source]}</span>
                    {x.status === 'hidden' && (
                      <span className="ml-1 inline-flex items-center gap-0.5 rounded-md bg-sunken px-1.5 py-0.5 text-xs text-muted"><EyeOff className="h-3 w-3" aria-hidden />非公開</span>
                    )}
                  </td>
                  <td className="tabular px-2 py-2.5 text-right align-top">{x.stats.attempts || '—'}</td>
                  <td className="tabular px-2 py-2.5 text-right align-top">{rate(x.stats.correct, x.stats.attempts)}</td>
                  <td className="px-4 py-2.5 text-right align-top">
                    {x.openReports > 0 && <span className="inline-flex items-center gap-0.5 text-ng"><Flag className="h-3.5 w-3.5" aria-hidden />{x.openReports}</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!filtered.length && <p className="px-4 py-8 text-center text-sm text-muted">該当する問題がありません</p>}
          {filtered.length > 500 && <p className="border-t border-line px-4 py-2 text-xs text-muted">先頭500件を表示しています。条件を絞り込んでください。</p>}
          <p className="border-t border-line px-4 py-2 text-xs text-muted">解答数・正答率は直近90日の集計です。</p>
        </div>
      )}
    </div>
  )
}

export default function QuestionsPage() {
  return (
    <Suspense>
      <QuestionsInner />
    </Suspense>
  )
}
