'use client'
import { Suspense, useEffect, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { QUESTIONS, QUESTION_MAP, categoryOf, LEVELS, type CategoryId, type Level, type Question } from '@/data/exam'
import { useProgress, smartPick, weakQuestions, shuffle, type Progress, type SessionMode } from '@/lib/progress'
import PracticeRunner from '@/components/PracticeRunner'
import MockRunner from '@/components/MockRunner'
import { loadMock, clearMock } from '@/lib/mockState'

export interface QuizSetup {
  mode: SessionMode
  title: string
  questions: Question[]
  minutes?: number
  /** 終了画面の「もう一度」用の URL */
  retryHref: string
}

const isCategory = (v: string | null): v is CategoryId => !!v && QUESTIONS.some(q => q.category === v)

function build(params: URLSearchParams, p: Progress): QuizSetup | null {
  const mode = (params.get('mode') ?? 'smart') as SessionMode | 'ids'
  const n = Math.min(Math.max(Number(params.get('n')) || 10, 1), 60)
  const cat = params.get('cat')
  const href = `/quiz?${params.toString()}`

  switch (mode) {
    case 'category': {
      if (!isCategory(cat)) return null
      const level = Number(params.get('level')) as Level
      const qs = QUESTIONS.filter(q => q.category === cat && (!level || q.level === level))
      const lv = LEVELS.find(l => l.id === level)
      return { mode, title: `${categoryOf(cat).name}${lv ? `・${lv.name}` : ''}`, questions: shuffle(qs), retryHref: href }
    }
    case 'smart': {
      const c = isCategory(cat) ? cat : undefined
      return { mode, title: c ? `${categoryOf(c).name}・おすすめ` : 'おすすめ問題', questions: smartPick(p, n, c), retryHref: href }
    }
    case 'random':
      return { mode, title: 'ランダム出題', questions: shuffle(QUESTIONS).slice(0, n), retryHref: href }
    case 'weak':
      return { mode, title: '苦手問題の復習', questions: shuffle(weakQuestions(p).slice(0, 20)), retryHref: href }
    case 'bookmark':
      return { mode, title: 'ブックマーク', questions: shuffle(p.bookmarks.map(id => QUESTION_MAP[id]).filter(Boolean)), retryHref: href }
    case 'ids': {
      const qs = (params.get('ids') ?? '').split(',').map(id => QUESTION_MAP[id]).filter(Boolean)
      return { mode: 'weak', title: '間違えた問題の解き直し', questions: qs, retryHref: href }
    }
    case 'mock': {
      const saved = params.get('resume') ? loadMock() : null
      if (saved) {
        const qs = saved.ids.map(id => QUESTION_MAP[id]).filter(Boolean)
        if (qs.length === saved.ids.length) return { mode, title: saved.title, questions: qs, minutes: saved.minutes, retryHref: '/mock' }
      }
      clearMock()
      const mini = params.get('size') === 'mini'
      const a = shuffle(QUESTIONS.filter(q => q.subject === 'A')).slice(0, mini ? 16 : 48)
      const b = shuffle(QUESTIONS.filter(q => q.subject === 'B')).slice(0, mini ? 4 : 12)
      return { mode, title: mini ? 'ミニ模試' : '本番形式の模擬試験', questions: [...a, ...b], minutes: mini ? 40 : 120, retryHref: '/mock' }
    }
    default:
      return null
  }
}

function QuizInner() {
  const params = useSearchParams()
  const p = useProgress()
  const [setup, setSetup] = useState<QuizSetup | null | undefined>(undefined)

  // 出題はランダムを含むのでクライアントでマウント後に一度だけ決める
  useEffect(() => {
    setSetup(build(new URLSearchParams(params.toString()), p))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params])

  if (setup === undefined) return <div className="py-20 text-center text-muted">問題を準備しています…</div>
  if (!setup || setup.questions.length === 0) {
    return (
      <div className="card mx-auto max-w-md p-8 text-center">
        <p className="font-semibold">出題できる問題がありません</p>
        <p className="mt-1 text-sm text-muted">
          {params.get('mode') === 'weak' ? '苦手な問題はまだありません。まずは演習を進めましょう。' : params.get('mode') === 'bookmark' ? 'ブックマークした問題はまだありません。' : '条件に合う問題が見つかりませんでした。'}
        </p>
        <Link href="/" className="btn-primary mt-6">ホームへ戻る</Link>
      </div>
    )
  }
  return setup.mode === 'mock' ? <MockRunner setup={setup} /> : <PracticeRunner setup={setup} />
}

export default function QuizPage() {
  return (
    <Suspense fallback={<div className="py-20 text-center text-muted">読み込み中…</div>}>
      <QuizInner />
    </Suspense>
  )
}
