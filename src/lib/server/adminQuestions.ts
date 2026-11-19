import 'server-only'
import { revalidateTag } from 'next/cache'
import type { SupabaseClient } from '@supabase/supabase-js'
import { BASE_QUESTIONS, type Question } from '@/data/exam'
import { BANK_TAG, fetchQuestionRows, rowToQuestion, type QuestionRow } from './bank'

export const BASE_MAP: Record<string, Question> = Object.fromEntries(BASE_QUESTIONS.map(q => [q.id, q]))

export type Source = 'base' | 'edited' | 'added'

export interface AdminQuestion extends Question {
  source: Source
  status: 'published' | 'hidden'
  note: string | null
  updated_at: string | null
}

/** 元データと DB を合わせた管理用の一覧（非公開の問題も含む） */
export async function listAdminQuestions(db: SupabaseClient): Promise<AdminQuestion[]> {
  const rows = await fetchQuestionRows(db)
  const byId = new Map(rows.map(r => [r.id, r]))
  const toAdmin = (q: Question, r: QuestionRow | undefined, source: Source): AdminQuestion => ({
    ...(r ? rowToQuestion(r) : q),
    source,
    status: r?.status ?? 'published',
    note: r?.note ?? null,
    updated_at: r?.updated_at ?? null,
  })
  const list = BASE_QUESTIONS.map(q => {
    const r = byId.get(q.id)
    return toAdmin(q, r, r ? 'edited' : 'base')
  })
  const added = rows.filter(r => !BASE_MAP[r.id]).map(r => toAdmin(rowToQuestion(r), r, 'added'))
  return [...list, ...added]
}

/** 分野内で次に使える ID（例: basics-031） */
export function nextId(category: string, existing: string[]) {
  let max = 0
  for (const id of existing) {
    const m = id.match(/^([a-z]+)-(\d{3})$/)
    if (m && m[1] === category) max = Math.max(max, Number(m[2]))
  }
  if (max >= 999) return null
  return `${category}-${String(max + 1).padStart(3, '0')}`
}

export const revalidateBank = () => revalidateTag(BANK_TAG)
