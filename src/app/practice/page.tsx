'use client'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { CATEGORIES } from '@/data/exam'
import { useProgress, categoryStats } from '@/lib/progress'
import { PageTitle, ProgressBar, pct, toneOf } from '@/components/ui'

export default function PracticePage() {
  const p = useProgress()
  const a = CATEGORIES.filter(c => c.id !== 'case')
  const b = CATEGORIES.filter(c => c.id === 'case')

  const Row = ({ c }: { c: (typeof CATEGORIES)[number] }) => {
    const s = categoryStats(p, c.id)
    return (
      <Link href={`/practice/${c.id}`} className="card group flex items-center gap-4 p-4 hover:bg-sunken">
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-2">
            <h2 className="font-semibold">{c.name}</h2>
            <span className="tabular shrink-0 text-sm text-muted">{s.answered}/{s.total}問</span>
          </div>
          <p className="mt-0.5 truncate text-xs text-muted">{c.description}</p>
          <div className="mt-2 flex items-center gap-3">
            <ProgressBar value={s.total ? s.answered / s.total : 0} tone={toneOf(s.accuracy)} className="flex-1" />
            <span className="tabular w-10 text-right text-xs text-muted">{pct(s.accuracy)}</span>
          </div>
        </div>
        <ChevronRight className="h-5 w-5 shrink-0 text-muted transition-transform group-hover:translate-x-0.5" aria-hidden />
      </Link>
    )
  }

  return (
    <div>
      <PageTitle title="分野別演習" description="分野とレベルを選んで、1問ずつ解説を確認しながら進めます。" />
      <h2 className="label mb-2">科目A（知識）</h2>
      <div className="grid gap-3 sm:grid-cols-2">{a.map(c => <Row key={c.id} c={c} />)}</div>
      <h2 className="label mb-2 mt-8">科目B（事例）</h2>
      <div className="grid gap-3 sm:grid-cols-2">{b.map(c => <Row key={c.id} c={c} />)}</div>
    </div>
  )
}
