'use client'
// 学習履歴の保存（端末の localStorage）。将来サーバー同期する場合もこの形をそのまま送れるようにしておく。
import { useSyncExternalStore } from 'react'
import { QUESTIONS, type CategoryId, type Question } from '@/data/exam'

const KEY = 'csj-progress-v1'

export interface AnswerRecord {
  /** 解答回数 */
  n: number
  /** 正解回数 */
  ok: number
  /** 連続正解数（間違えると0） */
  streak: number
  /** 最後に解いた時刻 (ms) */
  at: number
  /** 最後の解答が正解か */
  last: boolean
}

export type SessionMode = 'category' | 'random' | 'smart' | 'weak' | 'bookmark' | 'mock'

export interface SessionRecord {
  id: string
  mode: SessionMode
  title: string
  at: number
  total: number
  correct: number
  seconds: number
  /** 模試のみ: 科目別 */
  subjects?: { A: [number, number]; B: [number, number] }
}

export interface Progress {
  answers: Record<string, AnswerRecord>
  bookmarks: string[]
  sessions: SessionRecord[]
  /** YYYY-MM-DD -> 解いた問題数 */
  daily: Record<string, number>
  settings: { examDate: string | null; dailyGoal: number }
}

const EMPTY: Progress = {
  answers: {},
  bookmarks: [],
  sessions: [],
  daily: {},
  settings: { examDate: null, dailyGoal: 20 },
}

let cache: Progress | null = null
const listeners = new Set<() => void>()

function load(): Progress {
  if (cache) return cache
  if (typeof window === 'undefined') return EMPTY
  try {
    const raw = window.localStorage.getItem(KEY)
    const parsed = raw ? (JSON.parse(raw) as Partial<Progress>) : {}
    cache = { ...EMPTY, ...parsed, settings: { ...EMPTY.settings, ...parsed.settings } }
  } catch {
    cache = EMPTY
  }
  return cache
}

function save(next: Progress) {
  cache = next
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next))
  } catch {
    // 容量超過・プライベートモード等。メモリ上の状態だけで続行する
  }
  listeners.forEach(l => l())
}

function subscribe(l: () => void) {
  listeners.add(l)
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) {
      cache = null
      l()
    }
  }
  window.addEventListener('storage', onStorage)
  return () => {
    listeners.delete(l)
    window.removeEventListener('storage', onStorage)
  }
}

/** 学習履歴を購読する。SSR中は空の履歴を返す */
export function useProgress(): Progress {
  return useSyncExternalStore(subscribe, load, () => EMPTY)
}

export const today = (d = new Date()) => {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function recordAnswer(questionId: string, correct: boolean) {
  const p = load()
  const prev = p.answers[questionId]
  const rec: AnswerRecord = {
    n: (prev?.n ?? 0) + 1,
    ok: (prev?.ok ?? 0) + (correct ? 1 : 0),
    streak: correct ? (prev?.streak ?? 0) + 1 : 0,
    at: Date.now(),
    last: correct,
  }
  const d = today()
  save({
    ...p,
    answers: { ...p.answers, [questionId]: rec },
    daily: { ...p.daily, [d]: (p.daily[d] ?? 0) + 1 },
  })
}

export function recordSession(s: Omit<SessionRecord, 'id' | 'at'>) {
  const p = load()
  const rec: SessionRecord = { ...s, id: `${Date.now()}`, at: Date.now() }
  save({ ...p, sessions: [rec, ...p.sessions].slice(0, 200) })
}

export function toggleBookmark(questionId: string) {
  const p = load()
  const has = p.bookmarks.includes(questionId)
  save({ ...p, bookmarks: has ? p.bookmarks.filter(b => b !== questionId) : [...p.bookmarks, questionId] })
}

export function updateSettings(patch: Partial<Progress['settings']>) {
  const p = load()
  save({ ...p, settings: { ...p.settings, ...patch } })
}

export function resetProgress() {
  save({ ...EMPTY, settings: load().settings })
}

// ---- 集計 ----

/** 苦手判定: 最後に間違えた、または正答率が低く連続正解が2未満 */
export const isWeak = (r: AnswerRecord | undefined) => !!r && (!r.last || (r.ok / r.n < 0.6 && r.streak < 2))

export function weakQuestions(p: Progress): Question[] {
  return QUESTIONS.filter(q => isWeak(p.answers[q.id])).sort((a, b) => (p.answers[a.id].at - p.answers[b.id].at))
}

export function categoryStats(p: Progress, category: CategoryId) {
  const qs = QUESTIONS.filter(q => q.category === category)
  let answered = 0, mastered = 0, n = 0, ok = 0
  for (const q of qs) {
    const r = p.answers[q.id]
    if (!r) continue
    answered++
    n += r.n
    ok += r.ok
    if (r.last && r.streak >= 2) mastered++
  }
  return { total: qs.length, answered, mastered, accuracy: n ? ok / n : null }
}

export function overallStats(p: Progress) {
  let answered = 0, n = 0, ok = 0, mastered = 0
  for (const q of QUESTIONS) {
    const r = p.answers[q.id]
    if (!r) continue
    answered++
    n += r.n
    ok += r.ok
    if (r.last && r.streak >= 2) mastered++
  }
  return { total: QUESTIONS.length, answered, mastered, accuracy: n ? ok / n : null }
}

/** 連続学習日数（今日まだ解いていなくても昨日まで続いていれば継続中とみなす） */
export function studyStreak(p: Progress) {
  const d = new Date()
  if (!p.daily[today(d)]) d.setDate(d.getDate() - 1)
  let n = 0
  while (p.daily[today(d)]) {
    n++
    d.setDate(d.getDate() - 1)
  }
  return n
}

/**
 * おすすめ出題: 復習期限が来た苦手問題 → 未解答 → 定着度の低い順に混ぜる。
 * 間隔反復の簡易版（連続正解数に応じて次回までの間隔を伸ばす）。
 */
export function smartPick(p: Progress, count: number, category?: CategoryId): Question[] {
  const now = Date.now()
  const DAY = 86_400_000
  const intervals = [0, 1, 3, 7, 16, 35]
  const pool = category ? QUESTIONS.filter(q => q.category === category) : QUESTIONS
  const scored = pool.map(q => {
    const r = p.answers[q.id]
    let score: number
    if (!r) score = 50 + Math.random() * 10
    else {
      const due = r.at + intervals[Math.min(r.streak, intervals.length - 1)] * DAY
      const overdue = (now - due) / DAY
      score = (r.last ? 0 : 70) + Math.max(-30, Math.min(30, overdue * 5)) + (1 - r.ok / r.n) * 20 + Math.random() * 5
    }
    return { q, score }
  })
  return scored.sort((a, b) => b.score - a.score).slice(0, count).map(s => s.q)
}

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}
