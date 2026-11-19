import basics from './questions/basics.json'
import threats from './questions/threats.json'
import crypto from './questions/crypto.json'
import isms from './questions/isms.json'
import risk from './questions/risk.json'
import measures from './questions/measures.json'
import network from './questions/network.json'
import incident from './questions/incident.json'
import law from './questions/law.json'
import management from './questions/management.json'
import kase from './questions/case.json'

export type CategoryId =
  | 'basics' | 'threats' | 'crypto' | 'isms' | 'risk'
  | 'measures' | 'network' | 'incident' | 'law' | 'management' | 'case'

export type Level = 1 | 2 | 3

export interface Question {
  id: string
  category: CategoryId
  level: Level
  subject: 'A' | 'B'
  question: string
  choices: string[]
  answer: number
  explanation: string
  tags?: string[]
}

export interface Category {
  id: CategoryId
  name: string
  short: string
  description: string
  /** Tailwind の色名。カテゴリのアクセント */
  color: string
}

export const EXAM = {
  id: 'sg',
  name: '情報セキュリティマネジメント試験',
  short: 'SG',
  /** 本試験の形式（2023年度以降のCBT方式） */
  format: { minutes: 120, subjectA: 48, subjectB: 12, passRate: 0.6 },
}

export const CATEGORIES: Category[] = [
  { id: 'basics', name: '情報セキュリティの基本', short: '基本', description: 'CIA・脅威と脆弱性・セキュリティ原則', color: 'sky' },
  { id: 'threats', name: '脅威と攻撃手法', short: '攻撃手法', description: 'マルウェア・標的型攻撃・Web攻撃', color: 'rose' },
  { id: 'crypto', name: '暗号と認証', short: '暗号・認証', description: '公開鍵暗号・デジタル署名・PKI・多要素認証', color: 'violet' },
  { id: 'network', name: 'ネットワークとシステム', short: 'ネットワーク', description: 'FW・IDS/IPS・VPN・メール認証', color: 'cyan' },
  { id: 'isms', name: '情報セキュリティ管理', short: 'ISMS', description: 'JIS Q 27001・方針・内部監査', color: 'emerald' },
  { id: 'risk', name: 'リスクマネジメント', short: 'リスク', description: 'リスクアセスメント・リスク対応', color: 'amber' },
  { id: 'measures', name: 'セキュリティ対策', short: '対策', description: 'アクセス制御・バックアップ・人的/物理的対策', color: 'teal' },
  { id: 'incident', name: 'インシデント対応と事業継続', short: 'インシデント', description: 'CSIRT・フォレンジック・BCP', color: 'orange' },
  { id: 'law', name: '法務・コンプライアンス', short: '法務', description: '個人情報保護法・不正アクセス禁止法 ほか', color: 'indigo' },
  { id: 'management', name: 'マネジメント・ストラテジ', short: 'マネジメント', description: 'システム監査・内部統制・ITサービス', color: 'slate' },
  { id: 'case', name: '科目B 事例演習', short: '科目B', description: '事例を読んで判断する科目B形式', color: 'fuchsia' },
]

export const LEVELS: { id: Level; name: string; description: string }[] = [
  { id: 1, name: '基礎', description: '用語と基本概念' },
  { id: 2, name: '標準', description: '本試験レベル' },
  { id: 3, name: '応用', description: '比較・状況判断' },
]

/** リポジトリに同梱している元の問題データ */
export const BASE_QUESTIONS: Question[] = [
  basics, threats, crypto, network, isms, risk, measures, incident, law, management, kase,
].flat() as Question[]

/**
 * 管理画面での編集内容（DB）。upserts は元データを置き換える／追加する問題、hidden は出題しない問題の ID。
 */
export interface QuestionOverrides {
  version: string
  upserts: Question[]
  hidden: string[]
}

/** 元データに上書きを適用した問題一覧を作る（元データの並び順を保ち、追加分は ID 順で末尾に置く） */
export function mergeQuestions(base: Question[], o: Pick<QuestionOverrides, 'upserts' | 'hidden'>): Question[] {
  const hidden = new Set(o.hidden)
  const up = new Map(o.upserts.map(q => [q.id, q]))
  const merged: Question[] = []
  const seen = new Set<string>()
  for (const q of base) {
    seen.add(q.id)
    if (hidden.has(q.id)) continue
    merged.push(up.get(q.id) ?? q)
  }
  const added = o.upserts.filter(q => !seen.has(q.id) && !hidden.has(q.id)).sort((a, b) => a.id.localeCompare(b.id))
  return [...merged, ...added]
}

/** 現在出題する問題（管理画面の上書きを適用済み）。applyOverrides で中身が入れ替わる */
export const QUESTIONS: Question[] = [...BASE_QUESTIONS]

export const QUESTION_MAP: Record<string, Question> = Object.fromEntries(QUESTIONS.map(q => [q.id, q]))

let appliedVersion = ''

/** 上書きを適用する。同じ version なら何もしない（描画中に呼んでも安全） */
export function applyOverrides(o: QuestionOverrides | null) {
  const version = o?.version ?? ''
  if (version === appliedVersion) return
  appliedVersion = version
  const next = o ? mergeQuestions(BASE_QUESTIONS, o) : BASE_QUESTIONS
  QUESTIONS.splice(0, QUESTIONS.length, ...next)
  for (const k of Object.keys(QUESTION_MAP)) delete QUESTION_MAP[k]
  for (const q of next) QUESTION_MAP[q.id] = q
}

export const categoryOf = (id: CategoryId) => CATEGORIES.find(c => c.id === id)!
export const questionsIn = (category: CategoryId, level?: Level) =>
  QUESTIONS.filter(q => q.category === category && (level === undefined || q.level === level))
