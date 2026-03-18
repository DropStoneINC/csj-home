'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { logActivity } from '@/lib/db'
import GlowCard from '@/components/common/GlowCard'
import CyberButton from '@/components/common/CyberButton'

const THREATS_URL = 'https://cybershield-jp.vercel.app/threats'

export default function ThreatSearchPage() {
  const [userId, setUserId] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [recentSearches, setRecentSearches] = useState<any[]>([])
  const [totalThreats, setTotalThreats] = useState(0)

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUserId(user.id)

        // Get recent searches
        const { data: searches } = await supabase
          .from('threat_search_logs')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(5)
        if (searches) setRecentSearches(searches)
      }

      // Get total threat count from public indicators
      const { count } = await supabase
        .from('threat_reports')
        .select('*', { count: 'exact', head: true })
      setTotalThreats(count || 0)
    }
    init()
  }, [])

  const handleSearch = async () => {
    if (!query.trim()) return

    // Log search to DB
    if (userId) {
      await supabase.from('threat_search_logs').insert({
        user_id: userId,
        query_text: query,
        query_type: detectQueryType(query),
        results_count: 0,
      })
      await logActivity(userId, 'threat_searched', 'threat_search', { query })

      // Refresh recent searches
      const { data } = await supabase
        .from('threat_search_logs')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(5)
      if (data) setRecentSearches(data)
    }

    // Open external search with query
    window.open(`${THREATS_URL}?q=${encodeURIComponent(query)}`, '_blank')
  }

  const detectQueryType = (q: string): string => {
    if (q.match(/^https?:\/\//)) return 'url'
    if (q.match(/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/)) return 'ip'
    if (q.match(/@/)) return 'email'
    if (q.match(/^[a-z0-9.-]+\.[a-z]{2,}$/i)) return 'domain'
    return 'keyword'
  }

  const formatTime = (ts: string) => {
    const d = new Date(ts)
    return d.toLocaleDateString('ja-JP', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="text-xl font-bold">🔍 脅威検索データベース</h1>

      {/* Search Box */}
      <GlowCard hover={false}>
        <p className="text-sm text-cyber-muted mb-3">URL、IPアドレス、ドメイン、メールアドレス、キーワードで脅威情報を検索</p>
        <div className="flex gap-3">
          <input
            type="text"
            placeholder="例: example-phishing.com / 192.168.1.1 / suspicious@email.com"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="flex-1 bg-cyber-bg/50 border border-cyber-border/50 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-cyber-glow/50"
          />
          <CyberButton onClick={handleSearch} disabled={!query.trim()}>
            検索
          </CyberButton>
        </div>

        {/* Quick search examples */}
        <div className="flex flex-wrap gap-2 mt-3">
          {['フィッシング', 'ランサムウェア', '詐欺SMS', 'なりすまし'].map(tag => (
            <button
              key={tag}
              onClick={() => { setQuery(tag); }}
              className="text-xs px-3 py-1 bg-cyber-bg/50 border border-cyber-border/30 rounded-full text-cyber-muted hover:text-cyber-glow hover:border-cyber-glow/30 transition-all"
            >
              {tag}
            </button>
          ))}
        </div>
      </GlowCard>

      {/* Link to full DB */}
      <GlowCard hover={false} className="text-center !py-6">
        <p className="text-sm text-cyber-muted mb-3">全脅威データベースを閲覧・検索</p>
        <CyberButton size="lg" onClick={() => window.open(THREATS_URL, '_blank')}>
          🗄️ 脅威データベースを開く（外部ページ）
        </CyberButton>
      </GlowCard>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Recent Searches */}
        <GlowCard hover={false}>
          <h3 className="text-sm font-semibold mb-3">🕐 最近の検索履歴</h3>
          {recentSearches.length === 0 ? (
            <p className="text-xs text-cyber-muted py-4 text-center">
              {userId ? '検索履歴はまだありません' : 'ログインすると検索履歴が記録されます'}
            </p>
          ) : (
            <div className="space-y-2">
              {recentSearches.map((s: any) => (
                <div key={s.id} className="flex items-center gap-3 p-2 rounded-lg bg-cyber-bg/30">
                  <span className="text-xs px-1.5 py-0.5 bg-cyber-glow/10 text-cyber-glow rounded font-mono">
                    {s.query_type}
                  </span>
                  <span className="flex-1 text-sm truncate">{s.query_text}</span>
                  <span className="text-[10px] text-cyber-muted">{formatTime(s.created_at)}</span>
                </div>
              ))}
            </div>
          )}
        </GlowCard>

        {/* DB Stats */}
        <GlowCard hover={false}>
          <h3 className="text-sm font-semibold mb-3">📊 データベース統計</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-2.5 bg-cyber-bg/30 rounded-lg">
              <span className="text-sm">総脅威レポート数</span>
              <span className="text-lg font-bold text-cyber-glow">{totalThreats}</span>
            </div>
            <div className="flex items-center justify-between p-2.5 bg-cyber-bg/30 rounded-lg">
              <span className="text-sm">あなたの検索回数</span>
              <span className="text-lg font-bold text-cyber-glow">{recentSearches.length}</span>
            </div>
            <div className="flex items-center justify-between p-2.5 bg-cyber-bg/30 rounded-lg">
              <span className="text-sm">対応カテゴリ</span>
              <span className="text-xs text-cyber-muted">URL / IP / ドメイン / メール / キーワード</span>
            </div>
          </div>
        </GlowCard>
      </div>

      {!userId && (
        <GlowCard hover={false} className="border-yellow-500/20">
          <p className="text-sm text-yellow-400">
            <a href="/login" className="underline">ログイン</a>すると検索履歴が記録され、脅威情報をより効果的に活用できます。
          </p>
        </GlowCard>
      )}
    </div>
  )
}
