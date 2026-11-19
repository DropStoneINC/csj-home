'use client'
import { useState } from 'react'
import Link from 'next/link'
import clsx from 'clsx'
import { Check, X, ChevronDown, RotateCcw, Home, Minus } from 'lucide-react'
import type { QuizSetup } from '@/app/quiz/page'
import { CATEGORIES, EXAM } from '@/data/exam'
import QuestionCard, { KANA } from './QuestionCard'
import AskAI from './AskAI'
import { ProgressBar, pct, toneOf } from './ui'

const fmt = (s: number) => (s >= 3600 ? `${Math.floor(s / 3600)}時間${Math.floor((s % 3600) / 60)}分` : s >= 60 ? `${Math.floor(s / 60)}分${s % 60}秒` : `${s}秒`)

export default function ResultView({ setup, answers, seconds }: { setup: QuizSetup; answers: (number | null)[]; seconds: number }) {
  const { questions } = setup
  const [open, setOpen] = useState<number | null>(null)
  const results = questions.map((q, i) => answers[i] === q.answer)
  const correct = results.filter(Boolean).length
  const rate = correct / questions.length
  const wrongIds = questions.filter((_, i) => !results[i]).map(q => q.id)
  const isMock = setup.mode === 'mock'

  const bySubject = (['A', 'B'] as const).map(s => {
    const idx = questions.map((q, i) => (q.subject === s ? i : -1)).filter(i => i >= 0)
    return { s, total: idx.length, correct: idx.filter(i => results[i]).length }
  })
  const byCategory = CATEGORIES.map(c => {
    const idx = questions.map((q, i) => (q.category === c.id ? i : -1)).filter(i => i >= 0)
    return { c, total: idx.length, correct: idx.filter(i => results[i]).length }
  }).filter(x => x.total > 0)

  const passed = bySubject.every(x => x.total === 0 || x.correct / x.total >= EXAM.format.passRate)

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <section className="card p-6 text-center">
        <p className="label">{setup.title}</p>
        <div className="tabular mt-3 text-5xl font-bold">
          {correct}<span className="text-2xl text-muted"> / {questions.length}</span>
        </div>
        <div className="mt-1 text-muted">正答率 <span className="font-semibold text-ink">{pct(rate)}</span>・{fmt(seconds)}</div>
        {isMock && (
          <div className={clsx('mx-auto mt-4 inline-block rounded-full px-4 py-1.5 text-sm font-bold', passed ? 'bg-ok-soft text-ok' : 'bg-ng-soft text-ng')}>
            {passed ? '合格ライン到達（目安）' : '合格ラインまであと一歩'}
          </div>
        )}
        {!isMock && (
          <p className="mt-4 text-sm text-muted">
            {rate >= 0.9 ? 'すばらしい！この調子で次の分野へ進みましょう。' : rate >= 0.6 ? 'よくできました。間違えた問題を解き直して定着させましょう。' : '間違えた問題の解説とAI質問で、理解を深めましょう。'}
          </p>
        )}
      </section>

      {isMock && (
        <section className="card space-y-4 p-5">
          <div className="grid grid-cols-2 gap-3">
            {bySubject.map(x => (
              <div key={x.s} className="rounded-xl bg-sunken p-3">
                <div className="text-xs text-muted">科目{x.s}</div>
                <div className="tabular text-xl font-bold">{x.correct}/{x.total}<span className="ml-2 text-sm font-medium text-muted">{pct(x.total ? x.correct / x.total : null)}</span></div>
              </div>
            ))}
          </div>
          <p className="text-xs leading-6 text-muted">
            本試験は IRT 方式で 1,000 点満点・合格基準 600 点です。ここでは科目ごとの正答率 {EXAM.format.passRate * 100}% を目安として判定しています。
          </p>
          <div className="space-y-2">
            {byCategory.map(x => (
              <div key={x.c.id} className="flex items-center gap-3 text-sm">
                <span className="w-28 shrink-0 truncate sm:w-44">{x.c.name}</span>
                <ProgressBar value={x.correct / x.total} tone={toneOf(x.correct / x.total)} className="flex-1" />
                <span className="tabular w-12 text-right text-muted">{x.correct}/{x.total}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="flex flex-col gap-2 sm:flex-row">
        {wrongIds.length > 0 && (
          <Link href={`/quiz?mode=ids&ids=${wrongIds.join(',')}`} className="btn-primary flex-1">
            <RotateCcw className="h-4 w-4" aria-hidden />間違えた{wrongIds.length}問を解き直す
          </Link>
        )}
        <a href={setup.retryHref} className="btn-ghost flex-1">別の問題で続ける</a>
        <Link href="/" className="btn-ghost flex-1"><Home className="h-4 w-4" aria-hidden />ホーム</Link>
      </div>

      <section>
        <h2 className="mb-3 font-bold">問題ごとの振り返り</h2>
        <div className="space-y-2">
          {questions.map((q, i) => {
            const a = answers[i]
            const ok = results[i]
            const isOpen = open === i
            return (
              <div key={q.id + i} className="card overflow-hidden">
                <button onClick={() => setOpen(isOpen ? null : i)} className="flex w-full items-center gap-3 p-3 text-left hover:bg-sunken" aria-expanded={isOpen}>
                  <span className={clsx('flex h-7 w-7 shrink-0 items-center justify-center rounded-lg', ok ? 'bg-ok-soft text-ok' : a === null ? 'bg-sunken text-muted' : 'bg-ng-soft text-ng')}>
                    {ok ? <Check className="h-4 w-4" aria-label="正解" /> : a === null ? <Minus className="h-4 w-4" aria-label="未解答" /> : <X className="h-4 w-4" aria-label="不正解" />}
                  </span>
                  <span className="tabular w-8 shrink-0 text-xs text-muted">問{i + 1}</span>
                  <span className="line-clamp-1 flex-1 text-sm">{q.question.split('\n')[0]}</span>
                  <span className="tabular hidden shrink-0 text-xs text-muted sm:block">
                    {a === null ? '未解答' : `解答 ${KANA[a]}`}・正解 {KANA[q.answer]}
                  </span>
                  <ChevronDown className={clsx('h-4 w-4 shrink-0 text-muted transition-transform', isOpen && 'rotate-180')} aria-hidden />
                </button>
                {isOpen && (
                  <div className="space-y-3 border-t border-line bg-bg p-3">
                    <QuestionCard q={q} selected={a} revealed />
                    <AskAI questionId={q.id} selected={a} />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </section>
    </div>
  )
}
