import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'
import { QUESTION_MAP, categoryOf, EXAM } from '@/data/exam'

export const runtime = 'nodejs'
export const maxDuration = 60

const KANA = ['ア', 'イ', 'ウ', 'エ']
const MAX_TURNS = 12
const MAX_CHARS = 500

const SYSTEM = `あなたは「${EXAM.name}」（IPA 実施の国家試験）の合格を目指す学習者を支える、親切で正確な講師です。
学習アプリの中で、学習者がいま解いている1問について質問に答えます。

方針:
- 日本語で、要点から先に、短い段落で答える。長くても400字程度を目安にし、学習者が深掘りを求めたときだけ長くする。
- 画面はプレーンテキストで表示される。Markdown の見出し・太字・表・コードブロックは使わない。箇条書きは「・」を使う。
- 用語は JIS Q 27000 シリーズや IPA の用語・シラバスに沿って正確に説明する。法令は現行の内容で説明し、確信が持てない細部は断定しない。
- 問題のデータに付いている正解と解説を前提に説明する。もし正解や解説に誤りがあると考えられる場合は、その理由を添えて率直に伝える。
- 試験対策として役立つ観点（紛らわしい用語との違い、ひっかけのパターン、覚え方）を積極的に添える。
- この問題や情報セキュリティマネジメント試験の学習と関係のない依頼には応じず、学習の話題に戻るよう丁寧に伝える。`

// ベストエフォートの簡易レート制限（サーバーレスのインスタンスごと）
const hits = new Map<string, number[]>()
function limited(ip: string) {
  const now = Date.now()
  const windowMs = 10 * 60_000
  const recent = (hits.get(ip) ?? []).filter(t => now - t < windowMs)
  recent.push(now)
  hits.set(ip, recent)
  if (hits.size > 5000) hits.clear()
  return recent.length > 30
}

type Msg = { role: 'user' | 'assistant'; content: string }

export async function POST(req: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: 'AI解説は現在準備中です（APIキーが未設定です）。' }, { status: 503 })
  }
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  if (limited(ip)) {
    return NextResponse.json({ error: '短時間に質問が集中しています。少し時間をおいてからお試しください。' }, { status: 429 })
  }

  let body: { questionId?: unknown; selected?: unknown; messages?: unknown }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'リクエストの形式が正しくありません。' }, { status: 400 })
  }

  // 問題文はクライアントから受け取らず、サーバー側の問題データから組み立てる
  const q = typeof body.questionId === 'string' ? QUESTION_MAP[body.questionId] : undefined
  if (!q) return NextResponse.json({ error: '問題が見つかりません。' }, { status: 400 })

  const raw = Array.isArray(body.messages) ? body.messages : []
  const messages: Msg[] = raw
    .filter((m): m is Msg => !!m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
    .map(m => ({ role: m.role, content: m.content.slice(0, m.role === 'user' ? MAX_CHARS : 4000) }))
    .filter(m => m.content.trim())
  if (!messages.length || messages[0].role !== 'user' || messages[messages.length - 1].role !== 'user') {
    return NextResponse.json({ error: '質問を入力してください。' }, { status: 400 })
  }
  if (messages.length > MAX_TURNS * 2) {
    return NextResponse.json({ error: 'この問題での質問回数の上限に達しました。' }, { status: 400 })
  }

  const selected = typeof body.selected === 'number' && body.selected >= 0 && body.selected < 4 ? body.selected : null
  const context = [
    `分野: ${categoryOf(q.category).name}（${q.subject === 'B' ? '科目B形式' : '科目A形式'}）`,
    `問題:\n${q.question}`,
    `選択肢:\n${q.choices.map((c, i) => `${KANA[i]}. ${c}`).join('\n')}`,
    `正解: ${KANA[q.answer]}`,
    `学習者の解答: ${selected === null ? '未解答' : `${KANA[selected]}（${selected === q.answer ? '正解' : '不正解'}）`}`,
    `アプリの解説:\n${q.explanation}`,
  ].join('\n\n')

  const client = new Anthropic()
  const stream = client.beta.messages.stream({
    model: 'claude-opus-5-5',
    max_tokens: 4000,
    betas: ['server-side-fallback-2026-07-01'],
    fallbacks: 'default',
    output_config: { effort: 'medium' },
    system: [
      { type: 'text', text: SYSTEM, cache_control: { type: 'ephemeral' } },
      { type: 'text', text: `学習者が解いている問題:\n\n${context}` },
    ],
    messages,
  })

  const encoder = new TextEncoder()
  const body$ = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const event of stream) {
          if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
            controller.enqueue(encoder.encode(event.delta.text))
          }
        }
        const final = await stream.finalMessage()
        if (final.stop_reason === 'refusal') {
          controller.enqueue(encoder.encode('\n\n（この質問にはお答えできませんでした。質問の仕方を変えてお試しください。）'))
        }
      } catch (e) {
        console.error('ask error', e)
        const msg =
          e instanceof Anthropic.RateLimitError
            ? 'AIが混み合っています。少し時間をおいてお試しください。'
            : e instanceof Anthropic.APIError
              ? `AIの呼び出しに失敗しました（${e.status ?? 'network'}）。`
              : 'AIの呼び出しに失敗しました。'
        controller.enqueue(encoder.encode(`\n\n（${msg}）`))
      } finally {
        controller.close()
      }
    },
    cancel() {
      stream.abort()
    },
  })

  return new Response(body$, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store', 'X-Accel-Buffering': 'no' },
  })
}
