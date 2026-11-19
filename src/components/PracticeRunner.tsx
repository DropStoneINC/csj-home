'use client'
import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { X, ArrowRight } from 'lucide-react'
import type { QuizSetup } from '@/app/quiz/page'
import { recordAnswer, recordSession } from '@/lib/progress'
import QuestionCard from './QuestionCard'
import AskAI from './AskAI'
import ResultView from './ResultView'
import { ProgressBar } from './ui'

/** 演習モード: 1問ごとに正誤と解説を表示する */
export default function PracticeRunner({ setup }: { setup: QuizSetup }) {
  const { questions } = setup
  const router = useRouter()
  const [idx, setIdx] = useState(0)
  const [answers, setAnswers] = useState<(number | null)[]>(() => questions.map(() => null))
  const [done, setDone] = useState(false)
  const started = useRef(Date.now())
  const topRef = useRef<HTMLDivElement>(null)

  const q = questions[idx]
  const selected = answers[idx]
  const revealed = selected !== null
  const correctSoFar = answers.filter((a, i) => a === questions[i].answer).length

  const select = useCallback(
    (i: number) => {
      if (answers[idx] !== null) return
      setAnswers(prev => prev.map((a, k) => (k === idx ? i : a)))
      recordAnswer(q.id, i === q.answer)
    },
    [answers, idx, q],
  )

  const next = useCallback(() => {
    if (idx < questions.length - 1) {
      setIdx(idx + 1)
      topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    } else {
      const correct = answers.filter((a, i) => a === questions[i].answer).length
      recordSession({ mode: setup.mode, title: setup.title, total: questions.length, correct, seconds: Math.round((Date.now() - started.current) / 1000) })
      setDone(true)
      window.scrollTo({ top: 0 })
    }
  }, [idx, questions, answers, setup])

  // キーボード操作: 1-4 / A-D で選択、Enter で次へ
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (done || e.target instanceof HTMLInputElement || e.metaKey || e.ctrlKey) return
      const k = e.key.toLowerCase()
      const map: Record<string, number> = { '1': 0, '2': 1, '3': 2, '4': 3, a: 0, b: 1, c: 2, d: 3 }
      if (k in map && !revealed) select(map[k])
      else if (k === 'enter' && revealed) next()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [done, revealed, select, next])

  if (done) {
    return <ResultView setup={setup} answers={answers} seconds={Math.round((Date.now() - started.current) / 1000)} />
  }

  return (
    <div ref={topRef} className="mx-auto max-w-2xl scroll-mt-4">
      <div className="mb-4 flex items-center gap-3">
        <button
          onClick={() => {
            if (answers.every(a => a === null) || confirm('演習を中断しますか？（解いた問題の結果は保存されています）')) router.back()
          }}
          className="rounded-lg p-1.5 text-muted hover:bg-sunken hover:text-ink"
          aria-label="中断する"
        >
          <X className="h-5 w-5" aria-hidden />
        </button>
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-2 text-sm">
            <span className="truncate font-semibold">{setup.title}</span>
            <span className="tabular shrink-0 text-muted">{idx + 1} / {questions.length}</span>
          </div>
          <ProgressBar value={(idx + (revealed ? 1 : 0)) / questions.length} className="mt-1.5" />
        </div>
        <span className="tabular hidden shrink-0 text-sm text-ok sm:block">正解 {correctSoFar}</span>
      </div>

      <QuestionCard q={q} selected={selected} revealed={revealed} onSelect={revealed ? undefined : select} />

      {revealed && (
        <div className="mt-4 space-y-3">
          <button onClick={next} className="btn-primary w-full py-3 text-base" autoFocus>
            {idx < questions.length - 1 ? <>次の問題へ<ArrowRight className="h-4 w-4" aria-hidden /></> : '結果を見る'}
          </button>
          <AskAI questionId={q.id} selected={selected} />
        </div>
      )}
      {!revealed && <p className="mt-3 hidden text-center text-xs text-muted sm:block">キーボードの 1〜4 で選択、Enter で次へ進めます</p>}
      <div className="mt-6 text-center">
        <Link href="/" className="text-xs text-muted hover:text-ink">ホームに戻る</Link>
      </div>
    </div>
  )
}
