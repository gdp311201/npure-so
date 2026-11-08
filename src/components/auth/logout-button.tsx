'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function LogoutButton() {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleLogout() {
    setLoading(true)
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <button
      onClick={handleLogout}
      disabled={loading}
      className="w-full font-bold py-3 px-4 rounded-xl text-sm transition disabled:opacity-50"
      style={{
        background: 'rgba(127, 29, 29, 0.15)',
        border: '1px solid rgba(248, 113, 113, 0.25)',
        color: '#fca5a5',
        boxShadow: '0 0 12px rgba(248, 113, 113, 0.08)',
      }}
    >
      {loading ? '⏳ Keluar...' : '🚪 Keluar'}
    </button>
  )
}
