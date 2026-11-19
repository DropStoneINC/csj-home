'use client'
import clsx from 'clsx'
import { Check, X, Bookmark } from 'lucide-react'
import { categoryOf, LEVELS, type Question } from '@/data/exam'
import { toggleBookmark, useProgress } from '@/lib/progress'

export const KANA = ['ア', 'イ', 'ウ', 'エ']

interface Props {
  q: Question
  selected: number | null
  /** true なら正誤と解説を表示する */
  revealed: boolean
  onSelect?: (i: number) => void
}

export default function QuestionCard({ q, selected, revealed, onSelect }: Props) {
  const p = useProgress()
  const bookmarked = p.bookmarks.includes(q.id)
  const cat = categoryOf(q.category)

  return (
    <article className="card p-5 sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          <span className="chip">{q.subject === 'B' ? '科目B' : '科目A'}</span>
          <span className="chip">{cat.short}</span>
          <span className="chip">{LEVELS.find(l => l.id === q.level)?.name}</span>
        </div>
        <button
          onClick={() => toggleBookmark(q.id)}
          className={clsx('rounded-lg p-1.5 transition-colors hover:bg-sunken', bookmarked ? 'text-warn' : 'text-muted')}
          aria-pressed={bookmarked}
          aria-label={bookmarked ? 'ブックマークを外す' : 'ブックマークする'}
          title={bookmarked ? 'ブックマークを外す' : 'あとで見直す'}
        >
          <Bookmark className="h-5 w-5" fill={bookmarked ? 'currentColor' : 'none'} aria-hidden />
        </button>
      </div>

      <p className={clsx('mt-4 whitespace-pre-wrap', q.subject === 'B' ? 'text-[15px] leading-8' : 'text-base font-medium leading-8')}>{q.question}</p>

      <ol className="mt-5 space-y-2.5">
        {q.choices.map((c, i) => {
          const isAnswer = i === q.answer
          const isSelected = i === selected
          return (
            <li key={i}>
              <button
                onClick={() => onSelect?.(i)}
                disabled={!onSelect}
                className={clsx(
                  'flex w-full items-start gap-3 rounded-xl border px-4 py-3 text-left text-[15px] leading-7 transition-colors',
                  !revealed && !isSelected && 'border-line hover:border-accent/50 hover:bg-accent-soft/40',
                  !revealed && isSelected && 'border-accent bg-accent-soft',
                  revealed && isAnswer && 'border-ok bg-ok-soft',
                  revealed && !isAnswer && isSelected && 'border-ng bg-ng-soft',
                  revealed && !isAnswer && !isSelected && 'border-line opacity-70',
                  !onSelect && 'cursor-default',
                )}
              >
                <span
                  className={clsx(
                    'mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-xs font-bold',
                    revealed && isAnswer ? 'bg-ok text-white' : revealed && isSelected ? 'bg-ng text-white' : isSelected ? 'bg-accent text-accent-ink' : 'bg-sunken text-muted',
                  )}
                >
                  {revealed && isAnswer ? <Check className="h-4 w-4" aria-hidden /> : revealed && isSelected ? <X className="h-4 w-4" aria-hidden /> : KANA[i]}
                </span>
                <span className="flex-1">{c}</span>
              </button>
            </li>
          )
        })}
      </ol>

      {revealed && (
        <div className="mt-5 rounded-xl bg-sunken p-4">
          <div className={clsx('mb-1 font-bold', selected === q.answer ? 'text-ok' : selected === null ? 'text-muted' : 'text-ng')}>
            {selected === q.answer ? '正解！' : selected === null ? `未解答 — 正解は ${KANA[q.answer]}` : `不正解 — 正解は ${KANA[q.answer]}`}
          </div>
          <p className="whitespace-pre-wrap text-sm leading-7">{q.explanation}</p>
        </div>
      )}
    </article>
  )
}
