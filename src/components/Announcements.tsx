'use client'
import { useEffect, useState } from 'react'
import clsx from 'clsx'
import { Info, AlertTriangle, Wrench, X } from 'lucide-react'

export interface PublicAnnouncement {
  id: string
  title: string
  body: string
  level: 'info' | 'warning' | 'maintenance'
  starts_at: string | null
  ends_at: string | null
  updated_at: string
}

const KEY = 'csj-dismissed-announcements'
const STYLE = {
  info: { icon: Info, cls: 'border-accent/30 bg-accent-soft text-ink', iconCls: 'text-accent' },
  warning: { icon: AlertTriangle, cls: 'border-warn/30 bg-warn-soft text-ink', iconCls: 'text-warn' },
  maintenance: { icon: Wrench, cls: 'border-ng/30 bg-ng-soft text-ink', iconCls: 'text-ng' },
}

/** 運用者が管理画面から出すお知らせ。閉じたものは（内容が更新されるまで）表示しない */
export default function Announcements({ items }: { items: PublicAnnouncement[] }) {
  const [ready, setReady] = useState(false)
  const [dismissed, setDismissed] = useState<string[]>([])

  useEffect(() => {
    try {
      setDismissed(JSON.parse(localStorage.getItem(KEY) ?? '[]'))
    } catch {
      // 読めなければすべて表示する
    }
    setReady(true)
  }, [])

  // 表示期間の判定は描画後に端末の時刻で行う（キャッシュされたページでも正しく出し入れするため）
  if (!ready) return null
  const now = Date.now()
  const keyOf = (a: PublicAnnouncement) => `${a.id}@${a.updated_at}`
  const visible = items.filter(
    a =>
      (!a.starts_at || new Date(a.starts_at).getTime() <= now) &&
      (!a.ends_at || new Date(a.ends_at).getTime() > now) &&
      !dismissed.includes(keyOf(a)),
  )
  if (!visible.length) return null

  const dismiss = (a: PublicAnnouncement) => {
    const next = [...dismissed, keyOf(a)].slice(-50)
    setDismissed(next)
    try {
      localStorage.setItem(KEY, JSON.stringify(next))
    } catch {
      // 保存できなくても今回は閉じる
    }
  }

  return (
    <div className="mb-5 space-y-2" role="region" aria-label="お知らせ">
      {visible.map(a => {
        const s = STYLE[a.level] ?? STYLE.info
        return (
          <div key={a.id} className={clsx('flex items-start gap-3 rounded-xl border px-4 py-3', s.cls)}>
            <s.icon className={clsx('mt-0.5 h-5 w-5 shrink-0', s.iconCls)} aria-hidden />
            <div className="min-w-0 flex-1">
              <p className="font-semibold">{a.title}</p>
              {a.body && <p className="mt-0.5 whitespace-pre-wrap text-sm leading-6 text-muted">{a.body}</p>}
            </div>
            <button onClick={() => dismiss(a)} className="-mr-1 rounded-lg p-1 text-muted hover:bg-surface/60 hover:text-ink" aria-label="このお知らせを閉じる">
              <X className="h-4 w-4" aria-hidden />
            </button>
          </div>
        )
      })}
    </div>
  )
}
