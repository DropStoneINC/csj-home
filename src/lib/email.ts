// Resend によるメール送信（サーバー側専用）
// 必要な環境変数:
//   RESEND_API_KEY  - Resend の API キー（re_...）
//   EMAIL_FROM      - 送信元（例: "Cyber Shield <noreply@cybershield.jp>"）
//   EMAIL_REPLY_TO  - 返信先（任意）

const RESEND_ENDPOINT = 'https://api.resend.com/emails'
const DEFAULT_FROM = 'Cyber Shield <noreply@cybershield.jp>'

export type SendEmailInput = {
  to: string | string[]
  subject: string
  html?: string
  text?: string
  from?: string
  replyTo?: string | string[]
  cc?: string | string[]
  bcc?: string | string[]
  tags?: { name: string; value: string }[]
}

export type SendEmailResult =
  | { ok: true; id: string }
  | { ok: false; error: string; status?: number }

export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  if (typeof window !== 'undefined') {
    throw new Error('sendEmail はサーバー側でのみ使用できます')
  }

  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) return { ok: false, error: 'RESEND_API_KEY が設定されていません' }
  if (!input.html && !input.text) return { ok: false, error: 'html か text のどちらかが必要です' }

  const replyTo = input.replyTo ?? process.env.EMAIL_REPLY_TO
  const body = {
    from: input.from ?? process.env.EMAIL_FROM ?? DEFAULT_FROM,
    to: input.to,
    subject: input.subject,
    html: input.html,
    text: input.text,
    cc: input.cc,
    bcc: input.bcc,
    reply_to: replyTo || undefined,
    tags: input.tags,
  }

  try {
    const res = await fetch(RESEND_ENDPOINT, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      return { ok: false, status: res.status, error: data?.message ?? `Resend error (${res.status})` }
    }
    return { ok: true, id: data.id }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) }
  }
}
