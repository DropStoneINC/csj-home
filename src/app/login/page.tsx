'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import CyberButton from '@/components/common/CyberButton'

export default function LoginPage() {
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const { supabase } = await import('@/lib/supabase')

      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { display_name: displayName } },
        })
        if (error) throw error
      }
      router.push('/')
    } catch (err: any) {
      setError(err.message || 'エラーが発生しました')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-cyber-bg grid-pattern flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-cyber-glow/10 border border-cyber-glow/30 flex items-center justify-center text-3xl mb-4 animate-pulse-glow">
            🛡️
          </div>
          <h1 className="text-2xl font-bold text-cyber-glow tracking-wider">CYBER SHIELD</h1>
          <p className="text-sm text-cyber-muted mt-1">AGENT PWA</p>
        </div>

        {/* Form */}
        <div className="bg-cyber-card border border-cyber-border/50 rounded-2xl p-6 cyber-glow">
          {/* Tab */}
          <div className="flex mb-6 bg-cyber-bg/50 rounded-lg p-1">
            <button
              onClick={() => setMode('login')}
              className={`flex-1 py-2 text-sm rounded-md transition-all ${mode === 'login' ? 'bg-cyber-glow/10 text-cyber-glow' : 'text-cyber-muted'}`}
            >
              ログイン
            </button>
            <button
              onClick={() => setMode('signup')}
              className={`flex-1 py-2 text-sm rounded-md transition-all ${mode === 'signup' ? 'bg-cyber-glow/10 text-cyber-glow' : 'text-cyber-muted'}`}
            >
              新規登録
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div>
                <label className="block text-xs text-cyber-muted mb-1.5">表示名</label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  required
                  className="w-full bg-cyber-bg/50 border border-cyber-border/50 rounded-lg px-4 py-2.5 text-sm text-cyber-text focus:outline-none focus:border-cyber-glow/50 transition-all"
                  placeholder="あなたの名前"
                />
              </div>
            )}
            <div>
              <label className="block text-xs text-cyber-muted mb-1.5">メールアドレス</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-cyber-bg/50 border border-cyber-border/50 rounded-lg px-4 py-2.5 text-sm text-cyber-text focus:outline-none focus:border-cyber-glow/50 transition-all"
                placeholder="email@example.com"
              />
            </div>
            <div>
              <label className="block text-xs text-cyber-muted mb-1.5">パスワード</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full bg-cyber-bg/50 border border-cyber-border/50 rounded-lg px-4 py-2.5 text-sm text-cyber-text focus:outline-none focus:border-cyber-glow/50 transition-all"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div className="p-3 bg-cyber-red/10 border border-cyber-red/30 rounded-lg text-sm text-cyber-red">
                {error}
              </div>
            )}

            <CyberButton type="submit" fullWidth disabled={loading}>
              {loading ? '処理中...' : mode === 'login' ? 'ログイン' : '新規登録'}
            </CyberButton>
          </form>

          {/* Demo login */}
          <div className="mt-4 pt-4 border-t border-cyber-border/30">
            <button
              onClick={() => {
                setEmail('demo@cybershield.jp')
                setPassword('demo123456')
              }}
              className="w-full text-center text-xs text-cyber-muted hover:text-cyber-glow transition-all"
            >
              デモアカウントで試す →
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
