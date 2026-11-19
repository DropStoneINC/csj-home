import 'server-only'

const LEVELS = ['info', 'warning', 'maintenance'] as const

/** お知らせの入力を検証する */
export function parseAnnouncement(raw: unknown) {
  const r = (raw ?? {}) as Record<string, unknown>
  const errors: string[] = []
  const title = typeof r.title === 'string' ? r.title.trim() : ''
  const body = typeof r.body === 'string' ? r.body.replace(/\r\n/g, '\n').trim() : ''
  const level = LEVELS.includes(r.level as (typeof LEVELS)[number]) ? (r.level as (typeof LEVELS)[number]) : 'info'
  const date = (v: unknown, label: string) => {
    if (v === null || v === undefined || v === '') return null
    const d = new Date(String(v))
    if (Number.isNaN(d.getTime())) {
      errors.push(`${label}の日時が正しくありません`)
      return null
    }
    return d.toISOString()
  }
  const starts_at = date(r.starts_at, '開始')
  const ends_at = date(r.ends_at, '終了')
  if (!title) errors.push('タイトルを入力してください')
  if (title.length > 100) errors.push('タイトルは100文字以内にしてください')
  if (body.length > 2000) errors.push('本文は2000文字以内にしてください')
  if (starts_at && ends_at && ends_at <= starts_at) errors.push('終了日時は開始日時より後にしてください')
  if (errors.length) return { ok: false as const, errors }
  return { ok: true as const, value: { title, body, level, published: r.published === true, starts_at, ends_at } }
}
