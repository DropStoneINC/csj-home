import { ADMIN_COOKIE } from '@/lib/server/adminAuth'
import { json } from '@/lib/server/api'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

export async function POST() {
  const res = json({ ok: true })
  res.cookies.set(ADMIN_COOKIE, '', { path: '/', maxAge: 0 })
  return res
}
