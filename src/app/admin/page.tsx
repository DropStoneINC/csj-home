'use client'
import Link from 'next/link'
import { useState } from 'react'
import clsx from 'clsx'
import { CATEGORIES, LEVELS, categoryOf, type CategoryId } from '@/data/exam'
import { useApi, rate } from '@/components/admin/api'
import { LoadState } from '@/components/admin/AdminShell'
import { ProgressBar, Stat, toneOf } from '@/components/ui'

interface Daily { day: string; users: number; answers: number; correct: number; sessions: number; ai_asks: number }
interface QRow { question_id: string; attempts: number; correct: number; users: number; ai_asks: number; question: { category: CategoryId; level: number; text: string } | null }
interface Summary {
  days: number
  minAttempts: number
  totalQuestions: number
  summary: { users_7d: number; users_30d: number; answers_7d: number; answers_total: number; ai_asks_7d: number; open_reports: number }
  daily: Daily[]
  categories: { id: CategoryId; name: string; questions: number; attempts: number; correct: number }[]
  hardest: QRow[]
  mostAsked: QRow[]
}

const TONE_TEXT = { ok: 'text-ok', warn: 'text-warn', ng: 'text-ng', accent: 'text-accent' }

const METRICS = [
  { key: 'users', label: '利用者数' },
  { key: 'answers', label: '解答数' },
  { key: 'sessions', label: '演習・模試の完了' },
  { key: 'ai_asks', label: 'AI解説の質問' },
] as const

/** 日別の単系列棒グラフ。ホバー/フォーカスで値を表示する */
function DailyChart({ data, metric }: { data: Daily[]; metric: (typeof METRICS)[number]['key'] }) {
  const [hover, setHover] = useState<number | null>(null)
  const max = Math.max(1, ...data.map(d => d[metric]))
  const total = data.reduce((a, d) => a + d[metric], 0)
  // 利用者数は日ごとの重複があるので合計ではなく日平均を出す
  const avg = metric === 'users'
  const h = hover !== null ? data[hover] : null
  const label = (day: string) => {
    const [, m, d] = day.split('-')
    return `${Number(m)}/${Number(d)}`
  }
  return (
    <div>
      <div className="mb-2 flex h-6 items-baseline justify-between gap-3 text-sm">
        <span>
          <span className="text-muted">{h ? label(h.day) : avg ? '日平均' : '期間合計'}</span>
          <span className="tabular ml-2 text-lg font-semibold">
            {(h ? h[metric] : avg ? Math.round((total / Math.max(1, data.length)) * 10) / 10 : total).toLocaleString()}
          </span>
        </span>
        <span className="tabular text-xs text-muted">最大 {max.toLocaleString()}</span>
      </div>
      <div className="relative flex h-40 items-end gap-[2px] border-b border-line" onMouseLeave={() => setHover(null)}>
        {/* 最大値の補助線 */}
        <div className="pointer-events-none absolute inset-x-0 top-0 border-t border-dashed border-line" />
        {data.map((d, i) => (
          <button
            key={d.day}
            type="button"
            className="group relative flex h-full flex-1 items-end focus:outline-none"
            onMouseEnter={() => setHover(i)}
            onFocus={() => setHover(i)}
            onBlur={() => setHover(null)}
            aria-label={`${label(d.day)}: ${d[metric]}`}
          >
            <span
              className={clsx('w-full rounded-t-[4px] transition-colors', hover === i ? 'bg-accent' : 'bg-accent/70')}
              style={{ height: d[metric] ? `${Math.max(2, (d[metric] / max) * 100)}%` : 0 }}
            />
          </button>
        ))}
      </div>
      <div className="mt-1 flex justify-between text-[11px] text-muted tabular">
        <span>{data[0] && label(data[0].day)}</span>
        <span>{data.length > 1 && label(data[data.length - 1].day)}</span>
      </div>
    </div>
  )
}

function QuestionList({ rows, empty, value }: { rows: QRow[]; empty: string; value: (r: QRow) => React.ReactNode }) {
  if (!rows.length) return <p className="px-4 py-6 text-center text-sm text-muted">{empty}</p>
  return (
    <ul className="divide-y divide-line">
      {rows.map(r => (
        <li key={r.question_id}>
          <Link href={`/admin/questions/${r.question_id}`} className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-sunken">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 text-xs text-muted">
                <span className="font-mono">{r.question_id}</span>
                {r.question && <span>· {categoryOf(r.question.category).short} · {LEVELS.find(l => l.id === r.question!.level)?.name}</span>}
              </div>
              <div className="truncate">{r.question?.text}</div>
            </div>
            <div className="tabular shrink-0 text-right">{value(r)}</div>
          </Link>
        </li>
      ))}
    </ul>
  )
}

export default function AdminDashboard() {
  const [days, setDays] = useState(30)
  const [metric, setMetric] = useState<(typeof METRICS)[number]['key']>('users')
  const { data, error, loading } = useApi<Summary>(`/api/admin/summary?days=${days}`)

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">ダッシュボード</h1>
          <p className="mt-1 text-sm text-muted">利用者は端末ごとの匿名IDで数えています（日付は日本時間）。</p>
        </div>
        <label className="flex items-center gap-2 text-sm text-muted">
          期間
          <select value={days} onChange={e => setDays(Number(e.target.value))} className="rounded-lg border border-line bg-surface px-2 py-1 text-ink">
            {[7, 30, 90, 180].map(d => <option key={d} value={d}>直近{d}日</option>)}
          </select>
        </label>
      </div>

      {!data && <LoadState loading={loading} error={error} />}
      {data && (
        <>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
            <Stat label="利用者（7日）" value={data.summary.users_7d.toLocaleString()} />
            <Stat label="利用者（30日）" value={data.summary.users_30d.toLocaleString()} />
            <Stat label="解答数（7日）" value={data.summary.answers_7d.toLocaleString()} />
            <Stat label="解答数（累計）" value={data.summary.answers_total.toLocaleString()} />
            <Stat label="AI質問（7日）" value={data.summary.ai_asks_7d.toLocaleString()} />
            <Link href="/admin/reports" className="block">
              <Stat
                label="未対応の誤り報告"
                value={<span className={data.summary.open_reports ? 'text-ng' : ''}>{data.summary.open_reports}</span>}
                sub="クリックで確認"
              />
            </Link>
          </div>

          <section className="card p-5">
            <div className="mb-4 flex flex-wrap gap-1" role="tablist" aria-label="指標">
              {METRICS.map(m => (
                <button
                  key={m.key}
                  role="tab"
                  aria-selected={metric === m.key}
                  onClick={() => setMetric(m.key)}
                  className={clsx('rounded-lg px-3 py-1.5 text-sm font-medium', metric === m.key ? 'bg-accent-soft text-accent' : 'text-muted hover:text-ink')}
                >
                  {m.label}
                </button>
              ))}
            </div>
            <DailyChart data={data.daily} metric={metric} />
          </section>

          <div className="grid gap-6 lg:grid-cols-2">
            <section className="card">
              <div className="border-b border-line px-4 py-3">
                <h2 className="font-bold">正答率の低い問題</h2>
                <p className="text-xs text-muted">直近{data.days}日で{data.minAttempts}回以上解かれた問題。正解や問題文の見直し候補です</p>
              </div>
              <QuestionList
                rows={data.hardest}
                empty="まだ十分な解答データがありません"
                value={r => (
                  <>
                    <div className={clsx('font-semibold', TONE_TEXT[toneOf(r.correct / r.attempts)])}>{rate(r.correct, r.attempts)}</div>
                    <div className="text-xs text-muted">{r.attempts}回</div>
                  </>
                )}
              />
            </section>
            <section className="card">
              <div className="border-b border-line px-4 py-3">
                <h2 className="font-bold">AI解説への質問が多い問題</h2>
                <p className="text-xs text-muted">解説が足りていない可能性があります</p>
              </div>
              <QuestionList
                rows={data.mostAsked}
                empty="まだAI解説の利用がありません"
                value={r => (
                  <>
                    <div className="font-semibold">{r.ai_asks}件</div>
                    <div className="text-xs text-muted">正答率 {rate(r.correct, r.attempts)}</div>
                  </>
                )}
              />
            </section>
          </div>

          <section className="card">
            <div className="border-b border-line px-4 py-3">
              <h2 className="font-bold">分野別の状況</h2>
            </div>
            <table className="w-full text-sm">
              <thead className="text-left text-xs text-muted">
                <tr>
                  <th className="px-4 py-2 font-medium">分野</th>
                  <th className="px-2 py-2 text-right font-medium">問題数</th>
                  <th className="px-2 py-2 text-right font-medium">解答数</th>
                  <th className="w-1/3 px-4 py-2 font-medium">正答率</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {data.categories.map(c => {
                  const acc = c.attempts ? c.correct / c.attempts : null
                  return (
                    <tr key={c.id}>
                      <td className="px-4 py-2">
                        <Link href={`/admin/questions?category=${c.id}`} className="hover:underline">{c.name}</Link>
                      </td>
                      <td className="tabular px-2 py-2 text-right">{c.questions}</td>
                      <td className="tabular px-2 py-2 text-right">{c.attempts.toLocaleString()}</td>
                      <td className="px-4 py-2">
                        <div className="flex items-center gap-2">
                          <ProgressBar value={acc ?? 0} tone={toneOf(acc)} className="flex-1" />
                          <span className="tabular w-10 text-right">{rate(c.correct, c.attempts)}</span>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            <p className="border-t border-line px-4 py-2 text-xs text-muted">出題中の問題 {data.totalQuestions}問（全{CATEGORIES.length}分野）</p>
          </section>
        </>
      )}
    </div>
  )
}
