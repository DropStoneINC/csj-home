import type { Metadata, Viewport } from 'next'
import './globals.css'
import AppShell from '@/components/AppShell'
import AppData from '@/components/AppData'
import { getActiveAnnouncements, getOverrides } from '@/lib/server/bank'
import { supabaseConfigured } from '@/lib/server/supabase'

// 管理画面の編集は revalidateTag で即時反映される。これは念のための定期更新
export const revalidate = 300

export const metadata: Metadata = {
  title: { default: 'CSJ 資格ラボ', template: '%s | CSJ 資格ラボ' },
  description: '情報セキュリティマネジメント試験の分野別演習・本番形式の模擬試験・AI解説で合格を目指す学習アプリ',
  manifest: '/manifest.json',
  icons: { icon: '/icon.svg', apple: '/apple-icon.png' },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#eff0f2',
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // 管理画面での編集内容（キャッシュ済み。編集すると即時に再取得される）
  const [overrides, announcements] = await Promise.all([getOverrides(), getActiveAnnouncements()])
  const enabled = supabaseConfigured()
  return (
    <html lang="ja">
      <body className="min-h-screen font-sans antialiased">
        <AppData overrides={overrides} features={{ telemetry: enabled, reports: enabled }}>
          <AppShell
            announcements={announcements.map(({ id, title, body, level, starts_at, ends_at, updated_at }) => ({
              id, title, body, level, starts_at, ends_at, updated_at,
            }))}
          >
            {children}
          </AppShell>
        </AppData>
      </body>
    </html>
  )
}
