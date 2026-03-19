'use client'

import { useState } from 'react'

export default function SecurityManagementPage() {
    const [showQuiz, setShowQuiz] = useState(false)

  if (showQuiz) {
        return (
                <div className="flex flex-col h-[calc(100vh-4rem)]">
                        <div className="flex items-center justify-between px-4 py-2 bg-cyber-bg border-b border-cyber-border">
                                  <div className="flex items-center gap-2">
                                              <span className="text-lg">🛡️</span>span>
                                              <span className="text-sm font-bold">情報セキュリティマネジメント試験</span>span>
                                  </div>div>
                                  <div className="flex items-center gap-2">
                                              <a
                                                              href="https://csj-learn-sg.vercel.app/"
                                                              target="_blank"
                                                              rel="noopener noreferrer"
                                                              className="text-xs text-cyber-muted hover:text-teal-400 transition-colors"
                                                            >
                                                            ↗ 別タブで開く
                                              </a>a>
                                              <button
                                                              onClick={() => setShowQuiz(false)}
                                                              className="text-xs px-3 py-1 rounded bg-gray-700 hover:bg-gray-600 text-gray-300 transition-colors"
                                                            >
                                                            ✕ 閉じる
                                              </button>button>
                                  </div>div>
                        </div>div>
                        <iframe
                                    src="https://csj-learn-sg.vercel.app/"
                                    className="flex-1 w-full border-0"
                                    allow="clipboard-write"
                                    sandbox="allow-scripts allow-same-origin allow-popups allow-forms allow-storage-access-by-user-activation"
                                    title="情報セキュリティマネジメント試験 学習アプリ"
                                  />
                </div>div>
              )
  }
  
    return (
          <div className="max-w-3xl mx-auto space-y-6">
                <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-2xl">
                                  🛡️
                        </div>div>
                        <div>
                                  <h1 className="text-xl font-bold">情報セキュリティマネジメント試験</h1>h1>
                                  <p className="text-sm text-cyber-muted">270問 4択クイズ学習アプリ</p>p>
                        </div>div>
                </div>div>
          
                <div className="bg-cyber-bg rounded-xl border border-cyber-border p-6 space-y-4">
                        <p className="text-sm text-gray-300">
                                  情報セキュリティマネジメント試験の学習アプリをこのページ内で利用できます。
                        </p>p>
                        <ul className="text-sm text-gray-400 space-y-2">
                                  <li>📝 模擬試験モード（ランダム30問）</li>li>
                                  <li>🔄 間違い復習モード</li>li>
                                  <li>📚 カテゴリ別学習（9カテゴリ × 3レベル × 10問 = 270問）</li>li>
                                  <li>💾 スコアはデータベースに自動保存</li>li>
                                  <li>🤖 AI学習アシスタント付き</li>li>
                        </ul>ul>
                
                        <button
                                    onClick={() => setShowQuiz(true)}
                                    className="block w-full text-center py-3 rounded-lg bg-gradient-to-r from-teal-500 to-emerald-600 text-white font-bold hover:from-teal-600 hover:to-emerald-700 transition-all cursor-pointer"
                                  >
                                  🚀 学習を開始する
                        </button>button>
                
                        <a
                                    href="https://csj-learn-sg.vercel.app/"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="block w-full text-center py-2 rounded-lg border border-cyber-border text-sm text-gray-400 hover:text-white hover:border-teal-500 transition-all"
                                  >
                                  ↗ 別タブで学習アプリを開く
                        </a>a>
                </div>div>
          </div>div>
        )
}</div>
