'use client'
import Link from 'next/link'
import { RotateCcw, Bookmark, Trash2 } from 'lucide-react'
import { CATEGORIES, QUESTION_MAP, categoryOf } from '@/data/exam'
import { useProgress, weakQuestions, overallStats, resetProgress, updateSettings } from '@/lib/progress'
import { PageTitle, Stat, pct } from '@/components/ui'

const MODE_LABEL: Record<string, string> = { category: '分野別', random: 'ランダム', smart: 'おすすめ', weak: '復習', bookmark: 'ブックマーク', mock: '模試' }

export default function ReviewPage() {
  const p = useProgress()
  const weak = weakQuestions(p)
  const bookmarks = p.bookmarks.map(id => QUESTION_MAP[id]).filter(Boolean)
  const all = overallStats(p)
  const totalAnswers = Object.values(p.answers).reduce((a, r) => a + r.n, 0)

  // 直近14日の解答数
  const days = Array.from({ length: 14 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (13 - i))
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    return { key, label: `${d.getMonth() + 1}/${d.getDate()}`, n: p.daily[key] ?? 0 }
  })
  const maxDay = Math.max(p.settings.dailyGoal, ...days.map(d => d.n))

  return (
    <div className="space-y-8">
      <PageTitle title="復習・学習記録" />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="解いた問題" value={all.answered} sub={`全${all.total}問中`} />
        <Stat label="定着した問題" value={all.mastered} sub="2回連続正解" />
        <Stat label="のべ解答数" value={totalAnswers} />
        <Stat label="正答率" value={pct(all.accuracy)} />
      </div>

      <section className="grid gap-3 sm:grid-cols-2">
        <div className="card p-5">
          <div className="flex items-center gap-2 font-bold"><RotateCcw className="h-4 w-4 text-ng" aria-hidden />苦手な問題 <span className="tabular text-muted">{weak.length}</span></div>
          <p className="mt-1 text-sm text-muted">前回間違えた問題と、正答率の低い問題です。2回続けて正解すると外れます。</p>
          <Link href="/quiz?mode=weak" aria-disabled={!weak.length} className={`btn-primary mt-4 w-full ${!weak.length ? 'pointer-events-none opacity-50' : ''}`}>復習する（最大20問）</Link>
        </div>
        <div className="card p-5">
          <div className="flex items-center gap-2 font-bold"><Bookmark className="h-4 w-4 text-warn" aria-hidden />ブックマーク <span className="tabular text-muted">{bookmarks.length}</span></div>
          <p className="mt-1 text-sm text-muted">問題画面右上のしおりボタンで追加できます。</p>
          <Link href="/quiz?mode=bookmark" aria-disabled={!bookmarks.length} className={`btn-ghost mt-4 w-full ${!bookmarks.length ? 'pointer-events-none opacity-50' : ''}`}>まとめて解く</Link>
        </div>
      </section>

      {weak.length > 0 && (
        <section>
          <h2 className="mb-3 font-bold">苦手な問題の内訳</h2>
          <div className="card divide-y divide-line">
            {CATEGORIES.map(c => ({ c, n: weak.filter(q => q.category === c.id).length }))
              .filter(x => x.n)
              .sort((a, b) => b.n - a.n)
              .map(x => (
                <Link key={x.c.id} href={`/practice/${x.c.id}`} className="flex items-center justify-between px-4 py-2.5 text-sm hover:bg-sunken">
                  <span>{x.c.name}</span>
                  <span className="tabular text-ng">{x.n}問</span>
                </Link>
              ))}
          </div>
        </section>
      )}

      <section>
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="font-bold">直近14日の学習量</h2>
          <label className="flex items-center gap-2 text-sm text-muted">
            1日の目標
            <select
              value={p.settings.dailyGoal}
              onChange={e => updateSettings({ dailyGoal: Number(e.target.value) })}
              className="rounded-lg border border-line bg-surface px-2 py-1 text-ink"
            >
              {[10, 20, 30, 50, 80].map(n => <option key={n} value={n}>{n}問</option>)}
            </select>
          </label>
        </div>
        <div className="card p-4">
          <div className="relative flex h-32 items-end gap-1">
            <div className="pointer-events-none absolute inset-x-0 border-t border-dashed border-accent/40" style={{ bottom: `${(p.settings.dailyGoal / maxDay) * 100}%` }} />
            {days.map(d => (
              <div key={d.key} className="group relative flex h-full flex-1 flex-col justify-end" title={`${d.label}: ${d.n}問`}>
                <div className={`rounded-t ${d.n >= p.settings.dailyGoal ? 'bg-ok' : 'bg-accent/70'}`} style={{ height: `${(d.n / maxDay) * 100}%`, minHeight: d.n ? 3 : 0 }} />
              </div>
            ))}
          </div>
          <div className="mt-1 flex gap-1 text-[10px] text-muted">
            {days.map((d, i) => <span key={d.key} className="flex-1 text-center">{i % 2 === 1 || i === 13 ? d.label : ''}</span>)}
          </div>
        </div>
      </section>

      <section>
        <h2 className="mb-3 font-bold">学習履歴</h2>
        {p.sessions.length === 0 ? (
          <p className="card p-5 text-sm text-muted">まだ履歴がありません。</p>
        ) : (
          <div className="card divide-y divide-line">
            {p.sessions.slice(0, 30).map(s => (
              <div key={s.id} className="flex items-center gap-3 px-4 py-2.5 text-sm">
                <span className="tabular w-28 shrink-0 text-xs text-muted">{new Date(s.at).toLocaleString('ja-JP', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                <span className="chip shrink-0">{MODE_LABEL[s.mode]}</span>
                <span className="flex-1 truncate">{s.title}</span>
                <span className="tabular font-semibold">{s.correct}/{s.total}</span>
              </div>
            ))}
          </div>
        )}
      </section>

      {bookmarks.length > 0 && (
        <section>
          <h2 className="mb-3 font-bold">ブックマークした問題</h2>
          <div className="card divide-y divide-line">
            {bookmarks.map(q => (
              <div key={q.id} className="px-4 py-2.5 text-sm">
                <span className="chip mr-2">{categoryOf(q.category).short}</span>
                <span className="line-clamp-1 inline">{q.question.split('\n')[0]}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="border-t border-line pt-6">
        <p className="text-xs text-muted">
          学習記録はこの端末のブラウザに保存されています。<Link href="/account" className="text-accent hover:underline">ログイン</Link>すると、クラウドに保存して複数の端末で共有できます。
        </p>
        <button
          onClick={() => confirm('学習記録（解答履歴・ブックマーク・模試結果）をすべて消去します。よろしいですか？') && resetProgress()}
          className="mt-3 inline-flex items-center gap-1.5 text-sm text-ng hover:underline"
        >
          <Trash2 className="h-4 w-4" aria-hidden />学習記録をリセット
        </button>
      </section>
    </div>
  )
}
