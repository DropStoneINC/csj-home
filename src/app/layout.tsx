import type { Metadata, Viewport } from 'next'
import './globals.css'
import ClientLayout from '@/components/layout/ClientLayout'

export const metadata: Metadata = {
  title: 'Cyber Shield Agent',
  description: '診断・学習・通報・検索・実践訓練を統合したサイバー防衛エージェントアプリ',
  manifest: '/manifest.json',
  icons: {
    icon: '/icons/icon-192x192.png',
    apple: '/icons/icon-192x192.png',
  },
}

export const viewport: Viewport = {
  themeColor: '#0a0e1a',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="bg-cyber-bg text-cyber-text antialiased">
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  )
}
