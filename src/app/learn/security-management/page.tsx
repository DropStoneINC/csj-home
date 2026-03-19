'use client'
import { useEffect } from 'react'

export default function SecurityManagementPage() {
  useEffect(() => {
    window.open('https://dscss-sg.vercel.app/', '_blank')
  }, [])

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-2xl">
          🛡️
        </div>
        <div>
          <h1 className="text-xl font-bold">情報セキュリティマネジメント試験</h1>
          <p className="text-sm text-cyber-muted">270問 4択クイズ学習アプリ</p>
        </div>
      </div>

      <div className="bg-cyber-bg rounded-xl border border-cyber-border p-6 space-y-4">
        <p className="text-sm text-gray-300">
          情報セキュリティマネジメント試験の学習アプリが新しいタブで開きます。
        </p>
        <ul className="text-sm text-gray-400 space-y-2">
          <li>📝 模擬試験モード（ランダム30問）</li>
          <li>🔄 間違い復習モード</li>
          <li>📚 カテゴリ別学習（9カテゴリ × 3レベル × 10問 = 270問）</li>
          <li>💾 スコアはデータベースに自動保存</li>
          <li>🤖 AI学習アシスタント付き</li>
        </ul>
        <a
          href="https://dscss-sg.vercel.app/"
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full text-center py-3 rounded-lg bg-gradient-to-r from-teal-500 to-emerald-600 text-white font-bold hover:from-teal-600 hover:to-emerald-700 transition-all"
        >
          🚀 学習アプリを開く
        </a>
      </div>
    </div>
  )
}
