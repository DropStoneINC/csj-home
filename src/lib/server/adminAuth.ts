// 運用者のログインセッション。Edge（middleware）と Node の両方で動くよう Web Crypto だけを使う。
export const ADMIN_COOKIE = 'csj_admin'
export const SESSION_HOURS = 12

const enc = new TextEncoder()

function secret() {
  // ADMIN_SESSION_SECRET が無ければパスワードから導出する（パスワードを変えると既存セッションは無効になる）
  const s = process.env.ADMIN_SESSION_SECRET || process.env.ADMIN_PASSWORD
  return s ? `csj-admin:${s}` : null
}

export const adminConfigured = () => !!process.env.ADMIN_PASSWORD

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

export async function createSession(): Promise<string | null> {
  const key = secret()
  if (!key) return null
  const exp = Date.now() + SESSION_HOURS * 3_600_000
  return `v1.${exp}.${await hmac(`v1.${exp}`, key)}`
}

export async function verifySession(token: string | undefined | null): Promise<boolean> {
  const key = secret()
  if (!key || !token) return false
  const [v, exp, sig] = token.split('.')
  if (v !== 'v1' || !exp || !sig || !/^\d+$/.test(exp) || Number(exp) < Date.now()) return false
  return safeEqual(sig, await hmac(`v1.${exp}`, key))
}
