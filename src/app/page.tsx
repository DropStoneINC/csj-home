'use client'
import Link from 'next/link'
import { useState } from 'react'
import { Sparkles, Flame, Target, CalendarDays, ChevronRight, RotateCcw, Shuffle, Timer } from 'lucide-react'
import { CATEGORIES, EXAM } from '@/data/exam'
import {
  useProgress, overallStats, categoryStats, studyStreak, weakQuestions, today, updateSettings,
} from '@/lib/progress'
import { ProgressBar, pct, toneOf } from '@/components/ui'

function daysUntil(date: string) {
  const [y, m, d] = date.split('-').map(Number)
  const target = new Date(y, m - 1, d)
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  return Math.round((target.getTime() - now.getTime()) / 86_400_000)
}

export default function HomePage() {
  const p = useProgress()
  const all = overallStats(p)
  const streak = studyStreak(p)
  const todayCount = p.daily[today()] ?? 0
  const goal = p.settings.dailyGoal
  const weak = weakQuestions(p).length
  const [editingDate, setEditingDate] = useState(false)
  const left = p.settings.examDate ? daysUntil(p.settings.examDate) : null

  return (
    <div className="space-y-6">
      <section className="card overflow-hidden">
        <div className="bg-gradient-to-br from-accent/10 via-transparent to-transparent p-5 sm:p-6">
          <p className="label">{EXAM.name}</p>
          <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
            <div>
              {left !== null && !editingDate ? (
                <button onClick={() => setEditingDate(true)} className="text-left" title="試験日を変更">
                  <div className="text-sm text-muted">試験日まで</div>
                  <div className="tabular text-4xl font-bold">
                    {left > 0 ? <>あと {left}<span className="ml-1 text-lg">日</span></> : left === 0 ? '本日です' : '試験日を過ぎました'}
                  </div>
                </button>
              ) : (
                <div>
                  <label htmlFor="exam-date" className="flex items-center gap-1.5 text-sm text-muted">
                    <CalendarDays className="h-4 w-4" aria-hidden />受験予定日を設定すると、残り日数を表示します
                  </label>
                  <input
                    id="exam-date"
                    type="date"
                    className="mt-2 rounded-lg border border-line bg-surface px-3 py-2 text-sm"
                    defaultValue={p.settings.examDate ?? ''}
                    onChange={e => {
                      updateSettings({ examDate: e.target.value || null })
                      if (e.target.value) setEditingDate(false)
                    }}
                  />
                </div>
              )}
            </div>
            <div className="flex gap-6 text-sm">
              <div>
                <div className="flex items-center gap-1 text-muted"><Flame className="h-4 w-4 text-warn" aria-hidden />連続学習</div>
                <div className="tabular text-2xl font-bold">{streak}<span className="ml-0.5 text-sm font-medium">日</span></div>
              </div>
              <div>
                <div className="flex items-center gap-1 text-muted"><Target className="h-4 w-4 text-accent" aria-hidden />今日</div>
                <div className="tabular text-2xl font-bold">{todayCount}<span className="ml-0.5 text-sm font-medium text-muted">/ {goal}問</span></div>
              </div>
            </div>
          </div>
          <ProgressBar value={todayCount / goal} tone={todayCount >= goal ? 'ok' : 'accent'} className="mt-4" />
        </div>
      </section>

      <section className="grid grid-cols-3 gap-3">
        <Link href="/quiz?mode=smart&n=10" className="card group flex items-center gap-3 border-accent/40 bg-accent p-4 text-accent-ink col-span-3">
          <Sparkles className="h-6 w-6 shrink-0" aria-hidden />
          <div className="flex-1">
            <div className="font-bold">おすすめの10問を解く</div>
            <div className="text-sm opacity-90">未解答と、そろそろ忘れそうな問題を自動で選びます</div>
          </div>
          <ChevronRight className="h-5 w-5 transition-transform group-hover:translate-x-0.5" aria-hidden />
        </Link>
        <Link href={weak ? '/quiz?mode=weak' : '/review'} className="card flex flex-col gap-2 p-3 hover:bg-sunken sm:flex-row sm:items-center sm:gap-3 sm:p-4">
          <RotateCcw className="h-5 w-5 text-ng" aria-hidden />
          <div>
            <div className="text-sm font-semibold sm:text-base">苦手を復習</div>
            <div className="text-xs text-muted">{weak ? `${weak}問` : 'まだありません'}</div>
          </div>
        </Link>
        <Link href="/quiz?mode=random&n=10" className="card flex flex-col gap-2 p-3 hover:bg-sunken sm:flex-row sm:items-center sm:gap-3 sm:p-4">
          <Shuffle className="h-5 w-5 text-accent" aria-hidden />
          <div>
            <div className="text-sm font-semibold sm:text-base">ランダム10問</div>
            <div className="text-xs text-muted">全分野から出題</div>
          </div>
        </Link>
        <Link href="/mock" className="card flex flex-col gap-2 p-3 hover:bg-sunken sm:flex-row sm:items-center sm:gap-3 sm:p-4">
          <Timer className="h-5 w-5 text-warn" aria-hidden />
          <div>
            <div className="text-sm font-semibold sm:text-base">模擬試験</div>
            <div className="text-xs text-muted">本番形式 {EXAM.format.subjectA + EXAM.format.subjectB}問・{EXAM.format.minutes}分</div>
          </div>
        </Link>
      </section>

      <section className="card p-5">
        <div className="flex items-baseline justify-between">
          <h2 className="font-bold">全体の進み具合</h2>
          <span className="text-sm text-muted">正答率 <span className="tabular font-semibold text-ink">{pct(all.accuracy)}</span></span>
        </div>
        <div className="mt-3 flex items-center gap-3">
          <div className="relative h-3 flex-1 overflow-hidden rounded-full bg-sunken">
            <div className="absolute inset-y-0 left-0 bg-accent/35" style={{ width: `${(all.answered / all.total) * 100}%` }} />
            <div className="absolute inset-y-0 left-0 bg-ok" style={{ width: `${(all.mastered / all.total) * 100}%` }} />
          </div>
        </div>
        <div className="mt-2 flex gap-4 text-xs text-muted">
          <span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-ok" />定着 {all.mastered}</span>
          <span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-accent/35" />解答済み {all.answered}</span>
          <span>全 {all.total}問</span>
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="font-bold">分野別の習熟度</h2>
          <Link href="/practice" className="text-sm font-medium text-accent">すべて見る</Link>
        </div>
        <div className="card divide-y divide-line">
          {CATEGORIES.map(c => {
            const s = categoryStats(p, c.id)
            return (
              <Link key={c.id} href={`/practice/${c.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-sunken">
                <div className="w-28 shrink-0 text-sm font-medium sm:w-48">{c.name}</div>
                <ProgressBar value={s.total ? s.answered / s.total : 0} tone={toneOf(s.accuracy)} className="flex-1" />
                <div className="tabular w-12 text-right text-sm text-muted">{pct(s.accuracy)}</div>
              </Link>
            )
          })}
        </div>
        <p className="mt-2 text-xs text-muted">バーは解答済みの割合、色は正答率（緑 75%以上・黄 60%以上・赤 60%未満）です。</p>
      </section>
    </div>
  )
}
