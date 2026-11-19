'use client'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import clsx from 'clsx'
import { Clock, Flag, ChevronLeft, ChevronRight, LayoutGrid, X } from 'lucide-react'
import type { QuizSetup } from '@/app/quiz/page'
import { recordAnswer, recordSession } from '@/lib/progress'
import { saveMock, clearMock, loadMock } from '@/lib/mockState'
import QuestionCard from './QuestionCard'
import ResultView from './ResultView'

const clock = (s: number) => {
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  return `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
}

/** 模擬試験モード: 解説は最後にまとめて表示。制限時間つき・途中再開可 */
export default function MockRunner({ setup }: { setup: QuizSetup }) {
  const { questions } = setup
  const router = useRouter()
  const total = (setup.minutes ?? 120) * 60
  const [state, setState] = useState(() => {
    const saved = loadMock()
    if (saved && saved.ids.join() === questions.map(q => q.id).join()) return saved
    return { ids: questions.map(q => q.id), answers: questions.map(() => null as number | null), flags: [] as number[], endsAt: Date.now() + total * 1000, minutes: setup.minutes ?? 120, title: setup.title, idx: 0 }
  })
  const [now, setNow] = useState(() => Date.now())
  const [showGrid, setShowGrid] = useState(false)
  const [result, setResult] = useState<{ answers: (number | null)[]; seconds: number } | null>(null)
  const submitted = useRef(false)

  const { answers, flags, idx, endsAt } = state
  const left = Math.max(0, Math.round((endsAt - now) / 1000))
  const answeredCount = answers.filter(a => a !== null).length

  useEffect(() => {
    if (!result) saveMock(state)
  }, [state, result])

  const submit = useCallback(() => {
    if (submitted.current) return
    submitted.current = true
    questions.forEach((q, i) => {
      if (answers[i] !== null) recordAnswer(q.id, answers[i] === q.answer)
    })
    const subj = (s: 'A' | 'B'): [number, number] => {
      const idxs = questions.map((q, i) => (q.subject === s ? i : -1)).filter(i => i >= 0)
      return [idxs.filter(i => answers[i] === questions[i].answer).length, idxs.length]
    }
    const seconds = Math.min(total, total - left)
    recordSession({
      mode: 'mock',
      title: setup.title,
      total: questions.length,
      correct: answers.filter((a, i) => a === questions[i].answer).length,
      seconds,
      subjects: { A: subj('A'), B: subj('B') },
    })
    clearMock()
    setResult({ answers, seconds })
    window.scrollTo({ top: 0 })
  }, [answers, questions, left, total, setup.title])

  useEffect(() => {
    if (result) return
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [result])

  useEffect(() => {
    if (!result && left === 0) submit()
  }, [left, result, submit])

  if (result) return <ResultView setup={setup} answers={result.answers} seconds={result.seconds} />

  const go = (i: number) => {
    setState(s => ({ ...s, idx: i }))
    setShowGrid(false)
    window.scrollTo({ top: 0 })
  }
  const choose = (i: number) => setState(s => ({ ...s, answers: s.answers.map((a, k) => (k === s.idx ? (a === i ? null : i) : a)) }))
  const toggleFlag = () => setState(s => ({ ...s, flags: s.flags.includes(s.idx) ? s.flags.filter(f => f !== s.idx) : [...s.flags, s.idx] }))
  const q = questions[idx]
  const firstB = questions.findIndex(x => x.subject === 'B')

  return (
    <div className="mx-auto max-w-2xl">
      <div className="sticky top-0 z-10 -mx-4 mb-4 border-b border-line bg-bg/95 px-4 py-2 backdrop-blur">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              if (confirm('模擬試験を中断しますか？\n途中経過は保存され、「模擬試験」ページから再開できます。')) router.push('/mock')
            }}
            className="rounded-lg p-1.5 text-muted hover:bg-sunken hover:text-ink"
            aria-label="中断する"
          >
            <X className="h-5 w-5" aria-hidden />
          </button>
          <div className={clsx('tabular flex items-center gap-1.5 font-semibold', left < 300 ? 'text-ng' : 'text-ink')} aria-live="off">
            <Clock className="h-4 w-4" aria-hidden />{clock(left)}
          </div>
          <div className="tabular flex-1 text-center text-sm text-muted">解答 {answeredCount}/{questions.length}</div>
          <button onClick={() => setShowGrid(v => !v)} className="btn-ghost px-3 py-1.5" aria-expanded={showGrid}>
            <LayoutGrid className="h-4 w-4" aria-hidden />一覧
          </button>
          <button
            onClick={() => {
              const rest = questions.length - answeredCount
              if (confirm(rest ? `未解答が ${rest} 問あります。提出しますか？` : '解答を提出して採点しますか？')) submit()
            }}
            className="btn-primary px-3 py-1.5"
          >
            提出
          </button>
        </div>
        {showGrid && (
          <div className="mt-3 max-h-[50vh] overflow-y-auto pb-2">
            {(['A', 'B'] as const).map(s => (
              <div key={s} className="mb-2">
                <div className="mb-1 text-xs font-semibold text-muted">科目{s}</div>
                <div className="grid grid-cols-8 gap-1.5 sm:grid-cols-12">
                  {questions.map((x, i) =>
                    x.subject !== s ? null : (
                      <button
                        key={i}
                        onClick={() => go(i)}
                        className={clsx(
                          'tabular relative h-8 rounded-md text-xs font-semibold',
                          i === idx && 'ring-2 ring-accent',
                          answers[i] !== null ? 'bg-accent-soft text-accent' : 'bg-sunken text-muted',
                        )}
                      >
                        {i + 1}
                        {flags.includes(i) && <span className="absolute right-0.5 top-0.5 h-1.5 w-1.5 rounded-full bg-warn" />}
                      </button>
                    ),
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {idx === firstB && <p className="mb-3 rounded-xl bg-accent-soft px-4 py-2 text-sm text-accent">ここから科目B（事例問題）です。</p>}
      <div className="mb-2 flex items-center justify-between text-sm">
        <span className="tabular font-semibold">問{idx + 1}</span>
        <button onClick={toggleFlag} className={clsx('flex items-center gap-1 rounded-lg px-2 py-1 text-xs', flags.includes(idx) ? 'bg-warn-soft text-warn' : 'text-muted hover:bg-sunken')} aria-pressed={flags.includes(idx)}>
          <Flag className="h-3.5 w-3.5" aria-hidden />見直す
        </button>
      </div>
      <QuestionCard q={q} selected={answers[idx]} revealed={false} onSelect={choose} />

      <div className="mt-4 flex gap-2">
        <button onClick={() => go(idx - 1)} disabled={idx === 0} className="btn-ghost flex-1">
          <ChevronLeft className="h-4 w-4" aria-hidden />前へ
        </button>
        {idx < questions.length - 1 ? (
          <button onClick={() => go(idx + 1)} className="btn-primary flex-1">
            次へ<ChevronRight className="h-4 w-4" aria-hidden />
          </button>
        ) : (
          <button onClick={() => setShowGrid(true)} className="btn-primary flex-1">見直して提出</button>
        )}
      </div>
    </div>
  )
}
