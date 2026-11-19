import { NextRequest, NextResponse } from 'next/server'
import { sendEmail } from '@/lib/email'

// POST /api/email/test  { "to": "you@example.com" }
// Authorization: Bearer <EMAIL_TEST_SECRET>
// 送信設定の動作確認用。EMAIL_TEST_SECRET 未設定時は無効。
export async function POST(req: NextRequest) {
  const secret = process.env.EMAIL_TEST_SECRET
  if (!secret || req.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { to } = await req.json().catch(() => ({}))
  if (typeof to !== 'string' || !to.includes('@')) {
    return NextResponse.json({ error: '"to" にメールアドレスを指定してください' }, { status: 400 })
  }

  const result = await sendEmail({
    to,
    subject: '【Cyber Shield】テスト送信',
    text: 'これは Cyber Shield (cybershield.jp) からのテストメールです。',
    html: '<p>これは <strong>Cyber Shield</strong> (cybershield.jp) からのテストメールです。</p>',
    tags: [{ name: 'category', value: 'test' }],
  })

  return NextResponse.json(result, { status: result.ok ? 200 : 502 })
}
