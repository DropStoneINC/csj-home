// 運用者のログインセッション。Edge（middleware）と Node の両方で動くよう Web Crypto だけを使う。
export const ADMIN_COOKIE = 'csj_admin'
export const SESSION_HOURS = 12

const enc = new TextEncoder()

function secret() {
  // ADMIN_SESSION_SECRET が無ければ ADMIN_PASSWORD → GOOGLE_CLIENT_SECRET から導出する
  // （導出元を変えると既存セッションは無効になる）
  const s = process.env.ADMIN_SESSION_SECRET || process.env.ADMIN_PASSWORD || process.env.GOOGLE_CLIENT_SECRET
  return s ? `csj-admin:${s}` : null
}

export const passwordLoginEnabled = () => !!process.env.ADMIN_PASSWORD
export const googleLoginEnabled = () => !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET)
export const adminConfigured = () => passwordLoginEnabled() || googleLoginEnabled()

/** Google ログインを許可する Workspace ドメイン（既定: dropstone.co.jp） */
export const allowedDomains = () =>
  (process.env.ADMIN_ALLOWED_DOMAINS ?? 'dropstone.co.jp')
    .split(',')
    .map(s => s.trim().toLowerCase())
    .filter(Boolean)

/** ドメイン外でも個別に許可するメールアドレス（任意） */
export const allowedEmails = () =>
  (process.env.ADMIN_ALLOWED_EMAILS ?? '')
    .split(',')
    .map(s => s.trim().toLowerCase())
    .filter(Boolean)

async function hmac(data: string, key: string) {
  const k = await crypto.subtle.importKey('raw', enc.encode(key), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const sig = await crypto.subtle.sign('HMAC', k, enc.encode(data))
  return Array.from(new Uint8Array(sig), b => b.toString(16).padStart(2, '0')).join('')
}

/** 長さに依存しない比較（どちらも同じ鍵で HMAC してから比べる） */
export async function safeEqual(a: string, b: string) {
  const key = crypto.getRandomValues(new Uint8Array(16)).join(',')
  const [x, y] = await Promise.all([hmac(a, key), hmac(b, key)])
  let diff = 0
  for (let i = 0; i < x.length; i++) diff |= x.charCodeAt(i) ^ y.charCodeAt(i)
  return diff === 0
}

const b64url = (s: string) => btoa(String.fromCharCode(...Array.from(enc.encode(s)))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
const unb64url = (s: string) => {
  const bin = atob(s.replace(/-/g, '+').replace(/_/g, '/'))
  return new TextDecoder().decode(Uint8Array.from(bin, c => c.charCodeAt(0)))
}

/** @param subject ログインした人（Google ならメールアドレス、パスワードなら "password"） */
export async function createSession(subject: string): Promise<string | null> {
  const key = secret()
  if (!key) return null
  const exp = Date.now() + SESSION_HOURS * 3_600_000
  const body = `v2.${exp}.${b64url(subject)}`
  return `${body}.${await hmac(body, key)}`
}

/** 有効なら subject を返す。無効なら null */
export async function verifySession(token: string | undefined | null): Promise<string | null> {
  const key = secret()
  if (!key || !token) return null
  const [v, exp, sub, sig] = token.split('.')
  if (v !== 'v2' || !exp || !sub || !sig || !/^\d+$/.test(exp) || Number(exp) < Date.now()) return null
  if (!(await safeEqual(sig, await hmac(`v2.${exp}.${sub}`, key)))) return null
  try {
    return unb64url(sub)
  } catch {
    return null
  }
}

export const sessionCookie = (token: string) =>
  [
    ADMIN_COOKIE,
    token,
    {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict' as const,
      path: '/',
      maxAge: SESSION_HOURS * 3600,
    },
  ] as const
