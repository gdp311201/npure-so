import { createClient } from '@/lib/supabase/server'
import AppShell from '@/components/layout/app-shell'
import LogoutButton from '@/components/auth/logout-button'

export default async function SettingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, email, role')
    .eq('id', user!.id)
    .single()

  return (
    <AppShell title="Setting">
      <div className="space-y-4">
        {/* Profile card */}
        <div className="glass-card rounded-2xl p-5">
          <h3 className="text-xs font-bold uppercase text-pink-900/70 mb-3">👤 Profile</h3>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs text-pink-800/70">Nama</span>
              <span className="text-sm font-bold text-pink-950">{profile?.full_name}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-pink-800/70">Email</span>
              <span className="text-sm font-bold text-pink-950">{profile?.email}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-pink-800/70">Role</span>
              <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-pink-100 text-pink-700 border border-pink-200">
                {profile?.role}
              </span>
            </div>
          </div>
        </div>

        {/* Config placeholders */}
        <div className="glass-card rounded-2xl p-5">
          <h3 className="text-xs font-bold uppercase text-pink-900/70 mb-3">⚙️ Konfigurasi</h3>
          <div className="space-y-2">
            <div className="glass-mini rounded-xl p-3 flex justify-between items-center">
              <span className="text-sm text-pink-950">📅 Monthly Config</span>
              <span className="text-[10px] text-pink-700/50">Coming soon</span>
            </div>
            <div className="glass-mini rounded-xl p-3 flex justify-between items-center">
              <span className="text-sm text-pink-950">🌟 Focus Products</span>
              <span className="text-[10px] text-pink-700/50">Coming soon</span>
            </div>
          </div>
        </div>

        {/* Logout */}
        <div className="pt-4">
          <LogoutButton />
        </div>
      </div>
    </AppShell>
  )
}
