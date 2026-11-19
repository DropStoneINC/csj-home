import 'server-only'
import { unstable_cache } from 'next/cache'
import { BASE_QUESTIONS, mergeQuestions, type Question, type QuestionOverrides } from '@/data/exam'
import { getSupabase } from './supabase'

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

/** DB の上書きをそのまま全件取得する（キャッシュなし。管理画面用） */
export async function fetchQuestionRows(): Promise<QuestionRow[]> {
  const db = getSupabase()
  if (!db) return []
  const { data, error } = await db.from('questions').select(QUESTION_COLUMNS).order('id')
  if (error) throw new Error(`questions: ${error.message}`)
  return (data ?? []) as QuestionRow[]
}

/** 学習者向けの上書き情報。DB 障害時は元データだけで動くよう null を返す */
export const getOverrides = unstable_cache(
  async (): Promise<QuestionOverrides | null> => {
    if (!getSupabase()) return null
    try {
      const rows = await fetchQuestionRows()
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
export const getActiveAnnouncements = unstable_cache(
  async (): Promise<Announcement[]> => {
    const db = getSupabase()
    if (!db) return []
    try {
      const now = new Date().toISOString()
      const { data, error } = await db
        .from('announcements')
        .select('*')
        .eq('published', true)
        .or(`ends_at.is.null,ends_at.gt.${now}`)
        .order('created_at', { ascending: false })
        .limit(10)
      if (error) throw error
      return (data ?? []) as Announcement[]
    } catch (e) {
      console.error('getActiveAnnouncements failed', e)
      return []
    }
  },
  ['announcements-v1'],
  { tags: [ANNOUNCEMENTS_TAG], revalidate: 300 },
)
