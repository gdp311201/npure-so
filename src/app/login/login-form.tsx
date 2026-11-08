'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      router.push('/dashboard')
      router.refresh()
    }
  }

  return (
    <div className="glass-card rounded-2xl p-6 space-y-4">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-bold uppercase text-pink-900/70 mb-1">
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="custom-input w-full rounded-xl py-2.5 px-3 text-sm"
            placeholder="email@example.com"
          />
        </div>
        <div>
          <label className="block text-xs font-bold uppercase text-pink-900/70 mb-1">
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="custom-input w-full rounded-xl py-2.5 px-3 text-sm"
            placeholder="••••••••"
          />
        </div>
        {error && (
          <div className="text-xs font-bold text-red-400 bg-red-950/40 border border-red-500/20 rounded-xl py-2 px-3">
            ❌ {error}
          </div>
        )}
        <button
          type="submit"
          disabled={loading}
          className="w-full font-bold py-3 px-4 rounded-xl text-sm transition disabled:opacity-50"
          style={{
            background: 'rgba(6, 78, 59, 0.15)',
            border: '1px solid rgba(52, 211, 153, 0.25)',
            color: '#6ee7b7',
            boxShadow: '0 0 12px rgba(16, 185, 129, 0.10)',
          }}
        >
          {loading ? '⏳ Memuat...' : '🔐 Masuk'}
        </button>
      </form>
    </div>
  )
}
