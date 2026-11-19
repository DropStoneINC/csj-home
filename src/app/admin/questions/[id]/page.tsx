'use client'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import clsx from 'clsx'
import { ArrowLeft, Loader2, RotateCcw, Trash2, Check } from 'lucide-react'
import { CATEGORIES, LEVELS, categoryOf, type Question } from '@/data/exam'
import { api, useApi, fmtDateTime, rate, ApiError } from '@/components/admin/api'
import { LoadState } from '@/components/admin/AdminShell'
import { REPORT_KIND, REPORT_STATUS } from '@/components/admin/labels'

const KANA = ['ア', 'イ', 'ウ', 'エ']

interface Report {
  id: string
  kind: keyof typeof REPORT_KIND
  message: string
  selected: number | null
  status: keyof typeof REPORT_STATUS
  admin_note: string | null
  created_at: string
}
interface Detail {
  id: string
  base: Question | null
  current: Question
  source: 'base' | 'edited' | 'added'
  status: 'published' | 'hidden'
  note: string | null
  updated_at: string | null
  stats: { attempts: number; correct: number; users: number; ai_asks: number }
  reports: Report[]
}

interface Form {
  category: Question['category']
  level: number
  subject: 'A' | 'B'
  question: string
  choices: string[]
  answer: number
  explanation: string
  tags: string
  status: 'published' | 'hidden'
  note: string
}

const EMPTY: Form = { category: 'basics', level: 2, subject: 'A', question: '', choices: ['', '', '', ''], answer: -1, explanation: '', tags: '', status: 'published', note: '' }

const toForm = (q: Question, status: Form['status'], note: string | null): Form => ({
  category: q.category,
  level: q.level,
  subject: q.subject,
  question: q.question,
  choices: [...q.choices],
  answer: q.answer,
  explanation: q.explanation,
  tags: (q.tags ?? []).join(', '),
  status,
  note: note ?? '',
})

const input = 'w-full rounded-xl border border-line bg-surface px-3 py-2 text-sm focus:border-accent focus:outline-none'

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-sm font-medium">{label}</span>
      {hint && <span className="ml-2 text-xs text-muted">{hint}</span>}
      <div className="mt-1.5">{children}</div>
    </label>
  )
}

/** 元データから変わった箇所を示す */
function Changed({ base, value }: { base: string | undefined; value: string }) {
  if (base === undefined || base === value) return null
  return (
    <details className="mt-1 text-xs text-warn">
      <summary className="cursor-pointer">元データから変更あり</summary>
      <p className="mt-1 whitespace-pre-wrap rounded-lg bg-sunken p-2 text-muted">{base || '（空）'}</p>
    </details>
  )
}

export default function QuestionEditor({ params }: { params: { id: string } }) {
  const isNew = params.id === 'new'
  const router = useRouter()
  const { data, error, loading, reload } = useApi<Detail>(isNew ? null : `/api/admin/questions/${params.id}`)
  const [form, setForm] = useState<Form>(EMPTY)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)

  useEffect(() => {
    if (data) setForm(toForm(data.current, data.status, data.note))
  }, [data])

  const set = <K extends keyof Form>(k: K, v: Form[K]) => setForm(f => ({ ...f, [k]: v }))
  const base = data?.base ?? null

  async function save() {
    setSaving(true)
    setMsg(null)
    const payload = { ...form, tags: form.tags }
    try {
      if (isNew) {
        const r = await api<{ id: string }>('/api/admin/questions', { method: 'POST', json: payload })
        router.replace(`/admin/questions/${r.id}`)
        return
      }
      const r = await api<{ source: string }>(`/api/admin/questions/${params.id}`, { method: 'PUT', json: payload })
      setMsg({ ok: true, text: r.source === 'base' ? '元データと同じ内容になったため、上書きを解除しました。' : '保存しました。アプリには数秒〜数十秒で反映されます。' })
      await reload()
    } catch (e) {
      setMsg({ ok: false, text: (e as ApiError).message })
    } finally {
      setSaving(false)
    }
  }

  async function remove() {
    const added = data?.source === 'added'
    if (!confirm(added ? 'この問題を削除しますか？（元に戻せません）' : '編集内容を破棄して元データに戻しますか？')) return
    setSaving(true)
    try {
      await api(`/api/admin/questions/${params.id}`, { method: 'DELETE' })
      if (added) router.replace('/admin/questions')
      else {
        setMsg({ ok: true, text: '元データに戻しました。' })
        await reload()
      }
    } catch (e) {
      setMsg({ ok: false, text: (e as ApiError).message })
    } finally {
      setSaving(false)
    }
  }

  async function setReport(id: string, status: Report['status']) {
    try {
      await api(`/api/admin/reports/${id}`, { method: 'PATCH', json: { status } })
      await reload()
    } catch (e) {
      alert((e as ApiError).message)
    }
  }

  if (!isNew && !data) return <LoadState loading={loading} error={error} />

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <Link href="/admin/questions" className="rounded-lg p-1.5 text-muted hover:bg-sunken hover:text-ink" aria-label="問題一覧へ戻る">
          <ArrowLeft className="h-5 w-5" aria-hidden />
        </Link>
        <div className="min-w-0 flex-1">
          <h1 className="text-xl font-bold">{isNew ? '問題を追加' : <span className="font-mono">{params.id}</span>}</h1>
          {data && (
            <p className="text-xs text-muted">
              {data.source === 'base' ? '元データ（未編集）' : data.source === 'edited' ? `元データを編集済み · 更新 ${fmtDateTime(data.updated_at)}` : `管理画面で追加 · 更新 ${fmtDateTime(data.updated_at)}`}
            </p>
          )}
        </div>
        {data && data.source !== 'base' && (
          <button onClick={remove} disabled={saving} className="btn-ghost">
            {data.source === 'added' ? <><Trash2 className="h-4 w-4" aria-hidden />削除</> : <><RotateCcw className="h-4 w-4" aria-hidden />元データに戻す</>}
          </button>
        )}
        <button onClick={save} disabled={saving} className="btn-primary">
          {saving && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
          {isNew ? '追加する' : '保存'}
        </button>
      </div>

      {msg && (
        <p className={clsx('whitespace-pre-wrap rounded-xl px-4 py-2.5 text-sm', msg.ok ? 'bg-ok-soft text-ok' : 'bg-ng-soft text-ng')} role="status">{msg.text}</p>
      )}

      <div className="grid gap-5 lg:grid-cols-[1fr_20rem]">
        <div className="card space-y-4 p-5">
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="分野" hint={base ? '変更不可' : undefined}>
              <select value={form.category} onChange={e => set('category', e.target.value as Form['category'])} disabled={!isNew && !!base} className={input}>
                {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              {isNew && <p className="mt-1 text-xs text-muted">ID は保存時に自動で採番します</p>}
            </Field>
            <Field label="レベル">
              <select value={form.level} onChange={e => set('level', Number(e.target.value))} className={input}>
                {LEVELS.map(l => <option key={l.id} value={l.id}>{l.id}: {l.name}</option>)}
              </select>
              <Changed base={base ? String(base.level) : undefined} value={String(form.level)} />
            </Field>
            <Field label="科目">
              <select value={form.subject} onChange={e => set('subject', e.target.value as Form['subject'])} className={input}>
                <option value="A">A（知識）</option>
                <option value="B">B（事例）</option>
              </select>
              <Changed base={base?.subject} value={form.subject} />
            </Field>
          </div>

          <Field label="問題文" hint={`${form.question.length}文字`}>
            <textarea value={form.question} onChange={e => set('question', e.target.value)} rows={form.subject === 'B' ? 10 : 4} className={input} />
            <Changed base={base?.question} value={form.question.trim()} />
          </Field>

          <fieldset>
            <legend className="text-sm font-medium">選択肢 <span className="ml-2 text-xs font-normal text-muted">左の丸で正解を選びます</span></legend>
            <div className="mt-1.5 space-y-2">
              {form.choices.map((c, i) => (
                <div key={i}>
                  <div className={clsx('flex items-start gap-2 rounded-xl border p-2', form.answer === i ? 'border-ok bg-ok-soft/50' : 'border-line')}>
                    <label className="flex shrink-0 cursor-pointer items-center gap-1.5 pt-1.5 text-sm font-bold">
                      <input type="radio" name="answer" checked={form.answer === i} onChange={() => set('answer', i)} aria-label={`${KANA[i]}を正解にする`} />
                      {KANA[i]}
                    </label>
                    <textarea
                      value={c}
                      onChange={e => set('choices', form.choices.map((x, k) => (k === i ? e.target.value : x)))}
                      rows={c.length > 60 ? 3 : 1}
                      className="w-full resize-y rounded-lg border border-line bg-surface px-2.5 py-1.5 text-sm focus:border-accent focus:outline-none"
                      aria-label={`選択肢${KANA[i]}`}
                    />
                  </div>
                  <Changed base={base?.choices[i]} value={c.trim()} />
                </div>
              ))}
            </div>
            {base && base.answer !== form.answer && form.answer >= 0 && (
              <p className="mt-1 text-xs text-warn">正解を {KANA[base.answer]} → {KANA[form.answer]} に変更しています</p>
            )}
          </fieldset>

          <Field label="解説" hint={`${form.explanation.length}文字（30文字以上）`}>
            <textarea value={form.explanation} onChange={e => set('explanation', e.target.value)} rows={5} className={input} />
            <Changed base={base?.explanation} value={form.explanation.trim()} />
          </Field>

          <Field label="タグ" hint="カンマ区切り">
            <input value={form.tags} onChange={e => set('tags', e.target.value)} className={input} />
          </Field>
        </div>

        <aside className="space-y-5">
          <div className="card space-y-4 p-5">
            <Field label="公開状態">
              <div className="grid grid-cols-2 gap-1 rounded-xl bg-sunken p-1">
                {(['published', 'hidden'] as const).map(s => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => set('status', s)}
                    className={clsx('rounded-lg py-1.5 text-sm font-medium', form.status === s ? 'bg-surface shadow-sm' : 'text-muted')}
                  >
                    {s === 'published' ? '出題する' : '非公開'}
                  </button>
                ))}
              </div>
            </Field>
            <Field label="運用メモ" hint="学習者には表示されません">
              <textarea value={form.note} onChange={e => set('note', e.target.value)} rows={3} className={input} placeholder="修正の根拠・出典など" />
            </Field>
          </div>

          {data && (
            <div className="card p-5">
              <h2 className="text-sm font-bold">利用状況（累計）</h2>
              <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
                <div><dt className="text-xs text-muted">解答数</dt><dd className="tabular text-lg font-bold">{data.stats.attempts}</dd></div>
                <div><dt className="text-xs text-muted">正答率</dt><dd className="tabular text-lg font-bold">{rate(data.stats.correct, data.stats.attempts)}</dd></div>
                <div><dt className="text-xs text-muted">解いた人</dt><dd className="tabular text-lg font-bold">{data.stats.users}</dd></div>
                <div><dt className="text-xs text-muted">AI質問</dt><dd className="tabular text-lg font-bold">{data.stats.ai_asks}</dd></div>
              </dl>
            </div>
          )}

          {data && (
            <div className="card">
              <h2 className="border-b border-line px-5 py-3 text-sm font-bold">誤り報告 <span className="tabular text-muted">{data.reports.length}</span></h2>
              {!data.reports.length && <p className="px-5 py-4 text-sm text-muted">報告はありません</p>}
              <ul className="divide-y divide-line">
                {data.reports.map(r => (
                  <li key={r.id} className="px-5 py-3 text-sm">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium">{REPORT_KIND[r.kind]}</span>
                      <span className={clsx('rounded-md px-1.5 py-0.5 text-xs', REPORT_STATUS[r.status].cls)}>{REPORT_STATUS[r.status].label}</span>
                    </div>
                    {r.message && <p className="mt-1 whitespace-pre-wrap text-muted">{r.message}</p>}
                    <p className="mt-1 text-xs text-muted">
                      {fmtDateTime(r.created_at)}
                      {r.selected !== null && ` · 選んだ答え ${KANA[r.selected]}`}
                    </p>
                    {r.status === 'open' && (
                      <div className="mt-2 flex gap-2">
                        <button onClick={() => setReport(r.id, 'resolved')} className="inline-flex items-center gap-1 text-xs font-semibold text-ok hover:underline"><Check className="h-3.5 w-3.5" aria-hidden />対応済み</button>
                        <button onClick={() => setReport(r.id, 'dismissed')} className="text-xs text-muted hover:underline">対応不要</button>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="card p-5">
            <h2 className="text-sm font-bold">プレビュー</h2>
            <div className="mt-2 flex flex-wrap gap-1">
              <span className="chip">{form.subject === 'B' ? '科目B' : '科目A'}</span>
              <span className="chip">{categoryOf(form.category).short}</span>
            </div>
            <p className="mt-2 whitespace-pre-wrap text-sm">{form.question || '（問題文）'}</p>
            <ol className="mt-2 space-y-1 text-sm">
              {form.choices.map((c, i) => (
                <li key={i} className={clsx('rounded-lg px-2 py-1', i === form.answer ? 'bg-ok-soft' : 'bg-sunken')}>
                  <span className="font-bold">{KANA[i]}</span> {c}
                </li>
              ))}
            </ol>
          </div>
        </aside>
      </div>
    </div>
  )
}
