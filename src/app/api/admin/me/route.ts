import { type NextRequest } from 'next/server'
import { ADMIN_COOKIE, verifySession } from '@/lib/server/adminAuth'
import { json } from '@/lib/server/api'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

export async function GET(req: NextRequest) {
  const subject = await verifySession(req.cookies.get(ADMIN_COOKIE)?.value)
  return json({ email: subject && subject !== 'password' ? subject : null })
}
