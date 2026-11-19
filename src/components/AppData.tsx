'use client'
import { applyOverrides, type QuestionOverrides } from '@/data/exam'
import { setFeatures } from '@/lib/telemetry'

/**
 * サーバーで取得した管理画面の設定（問題の上書き・機能フラグ）を、子の描画より先に反映する。
 * どちらも冪等なので描画のたびに呼んでよい。
 */
export default function AppData({
  overrides,
  features,
  children,
}: {
  overrides: QuestionOverrides | null
  features: { telemetry: boolean; reports: boolean }
  children: React.ReactNode
}) {
  applyOverrides(overrides)
  setFeatures(features)
  return <>{children}</>
}
