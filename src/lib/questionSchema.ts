// 問題データの検証（scripts/validate-questions.mjs と同じ基準）。管理画面の保存時にサーバー側で使う
import { CATEGORIES, type CategoryId, type Level, type Question } from '@/data/exam'

export const ID_RE = /^[a-z]+-\d{3}$/

export type QuestionInput = Omit<Question, 'id'> & { id?: string }

/** 入力を正規化して検証する。問題があればエラーメッセージの配列を返す */
export function parseQuestion(raw: unknown): { ok: true; value: Omit<Question, 'id'> } | { ok: false; errors: string[] } {
  const errors: string[] = []
  const r = (raw ?? {}) as Record<string, unknown>
  const str = (v: unknown) => (typeof v === 'string' ? v.replace(/\r\n/g, '\n').trim() : '')

  const category = str(r.category) as CategoryId
  if (!CATEGORIES.some(c => c.id === category)) errors.push('分野が正しくありません')
  const level = Number(r.level) as Level
  if (![1, 2, 3].includes(level)) errors.push('レベルは 1〜3 で指定してください')
  const subject = r.subject === 'B' ? 'B' : r.subject === 'A' ? 'A' : null
  if (!subject) errors.push('科目は A か B で指定してください')
  const question = str(r.question)
  if (question.length < 10) errors.push('問題文は10文字以上にしてください')
  if (question.length > 4000) errors.push('問題文は4000文字以内にしてください')
  const choices = Array.isArray(r.choices) ? r.choices.map(str) : []
  if (choices.length !== 4 || choices.some(c => !c)) errors.push('選択肢は4つとも入力してください')
  else if (new Set(choices).size !== 4) errors.push('同じ内容の選択肢があります')
  if (choices.some(c => c.length > 1000)) errors.push('選択肢は1000文字以内にしてください')
  const answer = Number(r.answer)
  if (![0, 1, 2, 3].includes(answer)) errors.push('正解を選んでください')
  const explanation = str(r.explanation)
  if (explanation.length < 30) errors.push('解説は30文字以上にしてください')
  if (explanation.length > 4000) errors.push('解説は4000文字以内にしてください')
  const tags = Array.isArray(r.tags)
    ? Array.from(new Set(r.tags.map(str).filter(Boolean))).slice(0, 20)
    : typeof r.tags === 'string'
      ? Array.from(new Set(r.tags.split(/[,、\s]+/).map(t => t.trim()).filter(Boolean))).slice(0, 20)
      : []

  if (errors.length) return { ok: false, errors }
  return { ok: true, value: { category, level, subject: subject!, question, choices, answer, explanation, tags } }
}

/** 2つの問題の中身が同じか（id 以外を比較） */
export function sameQuestion(a: Omit<Question, 'id'>, b: Omit<Question, 'id'>) {
  return (
    a.category === b.category &&
    a.level === b.level &&
    a.subject === b.subject &&
    a.question === b.question &&
    a.answer === b.answer &&
    a.explanation === b.explanation &&
    a.choices.length === b.choices.length &&
    a.choices.every((c, i) => c === b.choices[i]) &&
    (a.tags ?? []).join('\u0000') === (b.tags ?? []).join('\u0000')
  )
}
