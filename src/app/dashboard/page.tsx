import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import LogoutButton from './logout-button'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Get user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, role, email')
    .eq('id', user.id)
    .single()

  return (
    <main className="min-h-screen p-4 max-w-md mx-auto">
      <div className="glass-card rounded-2xl p-6 space-y-4 mt-6">
        <div className="text-center pb-4 border-b border-pink-200/50">
          <div className="text-3xl mb-2">🎉</div>
          <h1 className="text-xl font-bold text-pink-950">Welcome!</h1>
          <p className="text-sm text-pink-800/70 mt-1">
            {profile?.full_name || 'User'}
          </p>
          <p className="text-xs text-pink-700/50 mt-0.5">
            {profile?.email}
          </p>
          <span className="inline-block mt-2 px-3 py-0.5 rounded-full text-[10px] font-bold uppercase bg-pink-100 text-pink-700 border border-pink-200">
            {profile?.role || 'staff'}
          </span>
        </div>
        
        <div className="space-y-2">
          <p className="text-sm text-pink-900/70 font-medium text-center">
            ✅ Auth flow working!
          </p>
          <p className="text-xs text-pink-800/50 text-center">
            Dashboard UI akan dibangun di Phase 1b
          </p>
        </div>

        <div className="pt-4 border-t border-pink-200/50">
          <LogoutButton />
        </div>
      </div>
    </main>
  )
}
