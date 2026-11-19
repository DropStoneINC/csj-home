import { type NextRequest } from 'next/server'
import { CATEGORIES } from '@/data/exam'
import { fail, withDb } from '@/lib/server/api'
import { listAdminQuestions } from '@/lib/server/adminQuestions'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

/**
 * 分野ごとの問題 JSON（src/data/questions/<分野>.json と同じ形式）をダウンロードする。
 * 管理画面での編集をリポジトリに取り込むときに使う。非公開にした問題は含めない。
 */
export async function GET(req: NextRequest) {
  const { res } = withDb()
  if (res) return res
  const category = req.nextUrl.searchParams.get('category')
  if (!CATEGORIES.some(c => c.id === category)) return fail('分野を指定してください。', 400)

  const list = await listAdminQuestions()
  const out = list
    .filter(q => q.category === category && q.status === 'published')
    .map(q => ({
      id: q.id,
      category: q.category,
      level: q.level,
      subject: q.subject,
      question: q.question,
      choices: q.choices,
      answer: q.answer,
      explanation: q.explanation,
      ...(q.tags?.length ? { tags: q.tags } : {}),
    }))
  return new Response(JSON.stringify(out, null, 2) + '\n', {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Disposition': `attachment; filename="${category}.json"`,
      'Cache-Control': 'no-store',
    },
  })
}
