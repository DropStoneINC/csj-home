'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Timer, Play, History } from 'lucide-react'
import { EXAM } from '@/data/exam'
import { useProgress } from '@/lib/progress'
import { loadMock, type MockState } from '@/lib/mockState'
import { PageTitle, pct } from '@/components/ui'

export default function MockPage() {
  const p = useProgress()
  const [saved, setSaved] = useState<MockState | null>(null)
  useEffect(() => setSaved(loadMock()), [])
  const history = p.sessions.filter(s => s.mode === 'mock')
  const f = EXAM.format

  return (
    <div>
      <PageTitle title="模擬試験" description="本番と同じく、解説は最後にまとめて表示されます。途中で中断しても再開できます。" />

      {saved && (
        <div className="card mb-6 flex flex-wrap items-center gap-3 border-warn/50 bg-warn-soft p-4">
          <div className="flex-1">
            <div className="font-semibold">中断した模擬試験があります</div>
            <div className="text-sm text-muted">
              {saved.title}・解答済み {saved.answers.filter(a => a !== null).length}/{saved.ids.length}問
              {saved.endsAt > Date.now() ? `・残り約${Math.ceil((saved.endsAt - Date.now()) / 60000)}分` : '・制限時間終了'}
            </div>
          </div>
          <Link href="/quiz?mode=mock&resume=1" className="btn-primary">再開する</Link>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <section className="card flex flex-col p-5">
          <Timer className="h-6 w-6 text-accent" aria-hidden />
          <h2 className="mt-3 text-lg font-bold">本番形式</h2>
          <p className="mt-1 flex-1 text-sm text-muted">
            科目A {f.subjectA}問 + 科目B {f.subjectB}問、{f.minutes}分。本試験（CBT方式）と同じ問題数・時間です。
          </p>
          <Link href="/quiz?mode=mock&size=full" className="btn-primary mt-4"><Play className="h-4 w-4" aria-hidden />開始する</Link>
        </section>
        <section className="card flex flex-col p-5">
          <Timer className="h-6 w-6 text-warn" aria-hidden />
          <h2 className="mt-3 text-lg font-bold">ミニ模試</h2>
          <p className="mt-1 flex-1 text-sm text-muted">科目A 16問 + 科目B 4問、40分。すきま時間で実力チェック。</p>
          <Link href="/quiz?mode=mock&size=mini" className="btn-ghost mt-4"><Play className="h-4 w-4" aria-hidden />開始する</Link>
        </section>
      </div>

      <section className="mt-8">
        <h2 className="mb-3 flex items-center gap-2 font-bold"><History className="h-4 w-4" aria-hidden />これまでの結果</h2>
        {history.length === 0 ? (
          <p className="card p-5 text-sm text-muted">まだ受験していません。</p>
        ) : (
          <div className="card divide-y divide-line">
            {history.slice(0, 20).map(s => (
              <div key={s.id} className="flex items-center gap-3 px-4 py-3 text-sm">
                <span className="tabular w-24 shrink-0 text-muted">{new Date(s.at).toLocaleDateString('ja-JP')}</span>
                <span className="flex-1 truncate">{s.title}</span>
                {s.subjects && (
                  <span className="tabular hidden text-xs text-muted sm:inline">
                    A {pct(s.subjects.A[1] ? s.subjects.A[0] / s.subjects.A[1] : null)}・B {pct(s.subjects.B[1] ? s.subjects.B[0] / s.subjects.B[1] : null)}
                  </span>
                )}
                <span className="tabular w-20 text-right font-semibold">{s.correct}/{s.total}</span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
