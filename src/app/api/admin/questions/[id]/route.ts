import { type NextRequest } from 'next/server'
import { fail, json, readJson, withDb } from '@/lib/server/api'
import { QUESTION_COLUMNS, rowToQuestion, type QuestionRow } from '@/lib/server/bank'
import { BASE_MAP, revalidateBank } from '@/lib/server/adminQuestions'
import { ID_RE, parseQuestion, sameQuestion } from '@/lib/questionSchema'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

type Ctx = { params: { id: string } }

export async function GET(_req: NextRequest, { params }: Ctx) {
  const { db, res } = withDb()
  if (res) return res
  const id = params.id
  if (!ID_RE.test(id)) return fail('ID が正しくありません。', 400)

  const [row, stats, reports] = await Promise.all([
    db.from('questions').select(QUESTION_COLUMNS).eq('id', id).maybeSingle(),
    db.rpc('admin_question_stats', { since_days: 3650 }),
    db.from('reports').select('*').eq('question_id', id).order('created_at', { ascending: false }).limit(50),
  ])
  const err = row.error ?? stats.error ?? reports.error
  if (err) return fail(`取得に失敗しました: ${err.message}`, 500)

  const base = BASE_MAP[id] ?? null
  const r = row.data as QuestionRow | null
  if (!base && !r) return fail('問題が見つかりません。', 404)
  const s = ((stats.data ?? []) as { question_id: string; attempts: number; correct: number; users: number; ai_asks: number }[]).find(
    x => x.question_id === id,
  )
  return json({
    id,
    base,
    current: r ? rowToQuestion(r) : base,
    source: r ? (base ? 'edited' : 'added') : 'base',
    status: r?.status ?? 'published',
    note: r?.note ?? null,
    updated_at: r?.updated_at ?? null,
    stats: {
      attempts: Number(s?.attempts ?? 0),
      correct: Number(s?.correct ?? 0),
      users: Number(s?.users ?? 0),
      ai_asks: Number(s?.ai_asks ?? 0),
    },
    reports: reports.data ?? [],
  })
}

/** 保存（元データの問題は上書き、追加した問題は更新） */
export async function PUT(req: NextRequest, { params }: Ctx) {
  const { db, res } = withDb()
  if (res) return res
  const id = params.id
  if (!ID_RE.test(id)) return fail('ID が正しくありません。', 400)
  const body = await readJson(req)
  const parsed = parseQuestion(body)
  if (!parsed.ok) return fail(parsed.errors.join('\n'), 422, { errors: parsed.errors })
  const status = body?.status === 'hidden' ? 'hidden' : 'published'
  const note = typeof body?.note === 'string' ? body.note.trim().slice(0, 2000) || null : null

  const base = BASE_MAP[id]
  if (base && parsed.value.category !== base.category) return fail('元データの問題は分野を変更できません。', 422)

  if (!base) {
    const { data: exists } = await db.from('questions').select('id').eq('id', id).maybeSingle()
    if (!exists) return fail('問題が見つかりません。', 404)
  }

  // 元データと同じ内容に戻した場合は上書きを消す（DB を元データとの差分だけに保つ）
  if (base && status === 'published' && !note && sameQuestion(parsed.value, { ...base, tags: base.tags ?? [] })) {
    const { error } = await db.from('questions').delete().eq('id', id)
    if (error) return fail(`保存に失敗しました: ${error.message}`, 500)
    revalidateBank()
    return json({ ok: true, source: 'base' })
  }

  const { error } = await db.from('questions').upsert({ id, ...parsed.value, status, note })
  if (error) return fail(`保存に失敗しました: ${error.message}`, 500)
  revalidateBank()
  return json({ ok: true, source: base ? 'edited' : 'added' })
}

/** 元データの問題は上書きを取り消して元に戻す。追加した問題は削除する */
export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const { db, res } = withDb()
  if (res) return res
  const id = params.id
  if (!ID_RE.test(id)) return fail('ID が正しくありません。', 400)
  const { error } = await db.from('questions').delete().eq('id', id)
  if (error) return fail(`削除に失敗しました: ${error.message}`, 500)
  revalidateBank()
  return json({ ok: true, source: BASE_MAP[id] ? 'base' : null })
}
