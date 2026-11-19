import 'server-only'
import { unstable_cache } from 'next/cache'
import { BASE_QUESTIONS, mergeQuestions, type Question, type QuestionOverrides } from '@/data/exam'
import type { SupabaseClient } from '@supabase/supabase-js'
import { getPublicDb } from './supabase'

export const BANK_TAG = 'question-bank'
export const ANNOUNCEMENTS_TAG = 'announcements'

export interface QuestionRow extends Question {
  status: 'published' | 'hidden'
  note: string | null
  created_at: string
  updated_at: string
}

export interface Announcement {
  id: string
  title: string
  body: string
  level: 'info' | 'warning' | 'maintenance'
  published: boolean
  starts_at: string | null
  ends_at: string | null
  created_at: string
  updated_at: string
}

export const QUESTION_COLUMNS = 'id, category, level, subject, question, choices, answer, explanation, tags, status, note, created_at, updated_at'

export function rowToQuestion(r: QuestionRow): Question {
  return {
    id: r.id,
    category: r.category,
    level: r.level,
    subject: r.subject,
    question: r.question,
    choices: r.choices,
    answer: r.answer,
    explanation: r.explanation,
    ...(r.tags?.length ? { tags: r.tags } : {}),
  }
}

/** DB の上書きをそのまま全件取得する（キャッシュなし。管理画面用。運用者の接続を渡す） */
export async function fetchQuestionRows(db: SupabaseClient): Promise<QuestionRow[]> {
  const { data, error } = await db.from('questions').select(QUESTION_COLUMNS).order('id')
  if (error) throw new Error(`questions: ${error.message}`)
  return (data ?? []) as QuestionRow[]
}

/** 学習者向けの上書き情報。DB 障害時は元データだけで動くよう null を返す */
export const getOverrides = unstable_cache(
  async (): Promise<QuestionOverrides | null> => {
    const db = getPublicDb()
    if (!db) return null
    try {
      const { data, error } = await db.rpc('public_question_overrides')
      if (error) throw new Error(error.message)
      const rows = (data ?? []) as QuestionRow[]
      if (!rows.length) return null
      const version = rows.reduce((v, r) => (r.updated_at > v ? r.updated_at : v), '') + `#${rows.length}`
      return {
        version,
        upserts: rows.filter(r => r.status === 'published').map(rowToQuestion),
        hidden: rows.filter(r => r.status === 'hidden').map(r => r.id),
      }
    } catch (e) {
      console.error('getOverrides failed', e)
      return null
    }
  },
  ['question-overrides-v1'],
  { tags: [BANK_TAG], revalidate: 300 },
)

/** サーバー側で使う、上書き適用済みの問題 */
export async function getQuestionMap(): Promise<Record<string, Question>> {
  const o = await getOverrides()
  const list = o ? mergeQuestions(BASE_QUESTIONS, o) : BASE_QUESTIONS
  return Object.fromEntries(list.map(q => [q.id, q]))
}

/** 公開中（または開始前）のお知らせ。表示期間の判定は端末側でも行う */
export type PublicAnnouncementRow = Pick<Announcement, 'id' | 'title' | 'body' | 'level' | 'starts_at' | 'ends_at' | 'updated_at'>

export const getActiveAnnouncements = unstable_cache(
  async (): Promise<PublicAnnouncementRow[]> => {
    const db = getPublicDb()
    if (!db) return []
    try {
      const { data, error } = await db.rpc('public_announcements')
      if (error) throw error
      return (data ?? []) as PublicAnnouncementRow[]
    } catch (e) {
      console.error('getActiveAnnouncements failed', e)
      return []
    }
  },
  ['announcements-v1'],
  { tags: [ANNOUNCEMENTS_TAG], revalidate: 300 },
)
