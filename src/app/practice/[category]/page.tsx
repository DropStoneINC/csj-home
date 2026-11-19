'use client'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import clsx from 'clsx'
import { ArrowLeft, Check, X, Sparkles, Play } from 'lucide-react'
import { CATEGORIES, LEVELS, questionsIn, type CategoryId } from '@/data/exam'
import { useProgress, categoryStats } from '@/lib/progress'
import { ProgressBar, pct, toneOf } from '@/components/ui'

export default function CategoryPage({ params }: { params: { category: string } }) {
  const p = useProgress()
  const cat = CATEGORIES.find(c => c.id === params.category)
  if (!cat) notFound()
  const id = cat.id as CategoryId
  const s = categoryStats(p, id)

  return (
    <div>
      <Link href="/practice" className="inline-flex items-center gap-1 text-sm text-muted hover:text-ink">
        <ArrowLeft className="h-4 w-4" aria-hidden />分野一覧
      </Link>
      <div className="mb-6 mt-3">
        <h1 className="text-2xl font-bold">{cat.name}</h1>
        <p className="mt-1 text-sm text-muted">{cat.description}</p>
        <div className="mt-3 flex flex-wrap gap-2 text-xs">
          <span className="chip">解答済み {s.answered}/{s.total}</span>
          <span className="chip">定着 {s.mastered}</span>
          <span className="chip">正答率 {pct(s.accuracy)}</span>
        </div>
      </div>

      <Link href={`/quiz?mode=smart&cat=${id}&n=10`} className="btn-primary mb-6 w-full sm:w-auto">
        <Sparkles className="h-4 w-4" aria-hidden />この分野のおすすめ10問
      </Link>

      <div className="space-y-4">
        {LEVELS.map(l => {
          const qs = questionsIn(id, l.id)
          if (!qs.length) return null
          const answered = qs.filter(q => p.answers[q.id])
          const n = answered.reduce((a, q) => a + p.answers[q.id].n, 0)
          const ok = answered.reduce((a, q) => a + p.answers[q.id].ok, 0)
          const acc = n ? ok / n : null
          return (
            <section key={l.id} className="card p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="font-semibold">レベル{l.id}：{l.name}</h2>
                  <p className="text-xs text-muted">{l.description}・{qs.length}問</p>
                </div>
                <Link href={`/quiz?mode=category&cat=${id}&level=${l.id}`} className="btn-ghost shrink-0">
                  <Play className="h-4 w-4" aria-hidden />解く
                </Link>
              </div>
              <div className="mt-3 flex items-center gap-3">
                <ProgressBar value={answered.length / qs.length} tone={toneOf(acc)} className="flex-1" />
                <span className="tabular w-10 text-right text-xs text-muted">{pct(acc)}</span>
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5" aria-label="問題ごとの状況">
                {qs.map((q, i) => {
                  const r = p.answers[q.id]
                  return (
                    <span
                      key={q.id}
                      title={`問${i + 1}: ${r ? (r.last ? '前回正解' : '前回不正解') : '未解答'}`}
                      className={clsx(
                        'flex h-7 w-7 items-center justify-center rounded-md text-[11px] font-semibold tabular',
                        !r && 'bg-sunken text-muted',
                        r?.last && 'bg-ok-soft text-ok',
                        r && !r.last && 'bg-ng-soft text-ng',
                      )}
                    >
                      {r ? (r.last ? <Check className="h-3.5 w-3.5" aria-hidden /> : <X className="h-3.5 w-3.5" aria-hidden />) : i + 1}
                    </span>
                  )
                })}
              </div>
            </section>
          )
        })}
      </div>
    </div>
  )
}
