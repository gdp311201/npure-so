import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AppShell from '@/components/layout/app-shell'
import LogoutButton from '@/components/auth/logout-button'
import MonthlyConfigSection from './monthly-config-section'
import FocusProductsSection from './focus-products-section'

export default async function SettingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const jakartaDate = new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Jakarta' })
  const currentMonth = jakartaDate.slice(0, 7)

  const [
    { data: profile },
    { data: monthlyConfig },
    { data: focusProducts },
    { data: allProducts },
  ] = await Promise.all([
    supabase.from('profiles').select('full_name, email, role').eq('id', user.id).single(),
    supabase.from('monthly_config').select('period, discount_rate, target_omset').eq('period', currentMonth).single(),
    supabase.from('v_focus_progress').select('*').eq('period', currentMonth),
    supabase.from('v_product_summary').select('id, name').eq('is_active', true).order('name'),
  ])

  return (
    <AppShell title="Setting">
      <div className="space-y-4">
        {/* Profile */}
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

        {/* Monthly Config */}
        <MonthlyConfigSection config={monthlyConfig} userRole={profile?.role || 'staff'} />

        {/* Focus Products */}
        <FocusProductsSection
          focusProducts={focusProducts || []}
          allProducts={allProducts || []}
          defaultPeriod={currentMonth}
        />

        {/* Logout */}
        <div className="pt-4">
          <LogoutButton />
        </div>
      </div>
    </AppShell>
  )
}
