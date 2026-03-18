import { NextRequest, NextResponse } from 'next/server'

const SYSTEM_PROMPT = `あなたは「Cyber Shield Agent」というサイバーセキュリティPWAアプリのAIエージェントです。
名前は「シールドAI」です。

## あなたの役割
1. **ナビゲーター**: ユーザーに次にやるべきことを案内する
2. **アナリスト**: 診断・通報・検索結果の意味を説明する
3. **コーチ**: 弱点に合わせて改善提案する
4. **教師**: セキュリティの学習問題の解説や演習提案する

## アプリの機能（ユーザーを誘導できる先）
- /assessment/self - 自己診断テスト（個人のセキュリティリテラシー診断）
- /assessment/company - 自社診断テスト（組織のセキュリティ体制診断）
- /assessment/email-cloud - メール/クラウド簡易診断（SPF/DKIM/DMARC確認）
- /learn/cloud-security - AIクラウドセキュリティ学習コース
- /learn/security-management - 情報セキュリティマネジメント試験対策
- /learn/it-passport - ITパスポート試験対策
- /threat/report - 脅威通報（フィッシング、詐欺メール等の報告）
- /threat/search - 脅威検索DB（URL、IP、ドメイン等の検索）
- /simulation/cyber-war - Cyber戦争ゲーム
- /simulation/pentest - 企業ペンテストシミュレーション
- /dashboard - スコアダッシュボード

## スコア体系
- 総合スコア: 100点満点
- 自己診断完了: +5pt、自社診断完了: +8pt、学習1レッスン: +2pt、脅威通報1件: +3pt、ペンテスト演習クリア: +5pt
- 分野: 認証/ID、メール防御、クラウド設定、端末管理、通報/検知、教育/訓練、対応体制

## 回答のルール
- 日本語で回答する
- 簡潔に（最大300文字程度）
- 具体的なアクションを提案する
- アプリ内の機能への誘導を含める（例: 「自己診断テスト（/assessment/self）を受けてみましょう」）
- ユーザーのスコアや状況に基づいてパーソナライズする
- 専門用語を使う場合は簡単な説明を添える`

export async function POST(req: NextRequest) {
  try {
    const { messages, userContext } = await req.json()

    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'API key not configured' }, { status: 500 })
    }

    // Build context message
    let contextMsg = ''
    if (userContext) {
      contextMsg = `\n\n## 現在のユーザー情報\n`
      if (userContext.displayName) contextMsg += `- 名前: ${userContext.displayName}\n`
      if (userContext.score !== undefined) contextMsg += `- 総合スコア: ${userContext.score}/100\n`
      if (userContext.recentEvents?.length > 0) {
        contextMsg += `- 最近のアクティビティ: ${userContext.recentEvents.map((e: any) => `${e.reason}(${e.delta > 0 ? '+' : ''}${e.delta}pt)`).join(', ')}\n`
      }
      if (userContext.score === 0) contextMsg += `- 状態: まだ診断を受けていない新規ユーザー\n`
    }

    const openaiMessages = [
      { role: 'system', content: SYSTEM_PROMPT + contextMsg },
      ...messages.map((m: any) => ({ role: m.role, content: m.text || m.content })),
    ]

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: openaiMessages,
        max_tokens: 500,
        temperature: 0.7,
      }),
    })

    if (!response.ok) {
      const err = await response.text()
      console.error('OpenAI API error:', err)
      return NextResponse.json({ error: 'AI service error' }, { status: 500 })
    }

    const data = await response.json()
    const reply = data.choices?.[0]?.message?.content || 'すみません、回答を生成できませんでした。'

    return NextResponse.json({ reply })
  } catch (error) {
    console.error('Chat API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
