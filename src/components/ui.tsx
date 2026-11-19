import clsx from 'clsx'

export function ProgressBar({ value, className, tone = 'accent' }: { value: number; className?: string; tone?: 'accent' | 'ok' | 'ng' | 'warn' }) {
  const color = { accent: 'bg-accent', ok: 'bg-ok', ng: 'bg-ng', warn: 'bg-warn' }[tone]
  return (
    <div className={clsx('h-2 overflow-hidden rounded-full bg-sunken', className)}>
      <div className={clsx('h-full rounded-full transition-[width] duration-500', color)} style={{ width: `${Math.max(0, Math.min(1, value)) * 100}%` }} />
    </div>
  )
}

export function Stat({ label, value, sub }: { label: string; value: React.ReactNode; sub?: React.ReactNode }) {
  return (
    <div className="card p-4">
      <div className="text-xs text-muted">{label}</div>
      <div className="tabular mt-1 text-2xl font-bold">{value}</div>
      {sub && <div className="mt-0.5 text-xs text-muted">{sub}</div>}
    </div>
  )
}

export const pct = (v: number | null | undefined) => (v === null || v === undefined ? '—' : `${Math.round(v * 100)}%`)

/** 正答率に応じたトーン */
export const toneOf = (v: number | null): 'ok' | 'warn' | 'ng' | 'accent' =>
  v === null ? 'accent' : v >= 0.75 ? 'ok' : v >= 0.6 ? 'warn' : 'ng'

export function PageTitle({ title, description }: { title: string; description?: string }) {
  return (
    <div className="mb-6">
      <h1 className="text-2xl font-bold">{title}</h1>
      {description && <p className="mt-1 text-sm text-muted">{description}</p>}
    </div>
  )
}
