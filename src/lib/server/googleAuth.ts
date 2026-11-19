import 'server-only'
import { createHash, randomBytes } from 'node:crypto'
import type { NextRequest } from 'next/server'
import { allowedDomains, allowedEmails } from './adminAuth'

// Google の OpenID Connect（認可コードフロー + PKCE）で運用者をログインさせる。
// id_token はサーバーから Google のトークンエンドポイントへ TLS で直接受け取るので、
// 署名検証の代わりに aud・iss・exp・nonce を確認すれば足りる（OIDC Core 3.1.3.7）。

export const OAUTH_COOKIE = 'csj_admin_oauth'
export const CALLBACK_PATH = '/api/admin/google/callback'

const rand = () => randomBytes(32).toString('base64url')

export function redirectUri(req: NextRequest) {
  const base = process.env.ADMIN_BASE_URL?.replace(/\/+$/, '') || req.nextUrl.origin
  return base + CALLBACK_PATH
}

/** 管理画面内のパスだけを戻り先として許す */
export const safeNext = (next: string | null | undefined) =>
  next && next.startsWith('/admin') && !next.startsWith('//') && !next.includes('\\') ? next : '/admin'

export function buildAuthRequest(req: NextRequest, next: string) {
  const state = rand()
  const nonce = rand()
  const verifier = rand()
  const challenge = createHash('sha256').update(verifier).digest('base64url')
  const domains = allowedDomains()
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    redirect_uri: redirectUri(req),
    response_type: 'code',
    scope: 'openid email profile',
    state,
    nonce,
    code_challenge: challenge,
    code_challenge_method: 'S256',
    prompt: 'select_account',
  })
  // ドメインが1つなら Google のアカウント選択をそのドメインに絞る（表示上のヒント。判定はコールバックで行う）
  if (domains.length === 1 && allowedEmails().length === 0) params.set('hd', domains[0])
  return {
    url: `https://accounts.google.com/o/oauth2/v2/auth?${params}`,
    cookie: JSON.stringify({ state, nonce, verifier, next }),
  }
}

type Claims = { iss?: string; aud?: string; exp?: number; nonce?: string; email?: string; email_verified?: boolean; hd?: string }

export async function exchangeCode(req: NextRequest, code: string, verifier: string): Promise<Claims> {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: redirectUri(req),
      grant_type: 'authorization_code',
      code_verifier: verifier,
    }),
    cache: 'no-store',
  })
  if (!res.ok) throw new Error(`token endpoint ${res.status}`)
  const { id_token } = (await res.json()) as { id_token?: string }
  const payload = id_token?.split('.')[1]
  if (!payload) throw new Error('no id_token')
  return JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as Claims
}

export type CheckResult = { ok: true; email: string } | { ok: false; reason: 'invalid' | 'forbidden'; email?: string }

export function checkClaims(c: Claims, nonce: string): CheckResult {
  const now = Date.now() / 1000
  if (
    (c.iss !== 'https://accounts.google.com' && c.iss !== 'accounts.google.com') ||
    c.aud !== process.env.GOOGLE_CLIENT_ID ||
    !c.exp ||
    c.exp < now ||
    c.nonce !== nonce ||
    !c.email
  ) {
    return { ok: false, reason: 'invalid' }
  }
  const email = c.email.toLowerCase()
  if (c.email_verified !== true) return { ok: false, reason: 'forbidden', email }
  if (allowedEmails().includes(email)) return { ok: true, email }
  // Workspace のアカウントは hd（ホストドメイン）が付く。個人の Gmail などには付かない
  const hd = c.hd?.toLowerCase()
  const domain = email.split('@')[1]
  if (hd && hd === domain && allowedDomains().includes(hd)) return { ok: true, email }
  return { ok: false, reason: 'forbidden', email }
}
