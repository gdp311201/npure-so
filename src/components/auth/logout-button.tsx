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
      className="w-full bg-white/80 hover:bg-white disabled:opacity-60 text-rose-700 font-semibold py-2.5 px-4 rounded-xl border border-rose-200/80 text-sm transition"
    >
      {loading ? '⏳ Keluar...' : '🚪 Keluar'}
    </button>
  )
}
