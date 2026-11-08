import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import BottomNav from './bottom-nav'

const LOGO_URL = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/npure-assets/logo.png`;

export default async function AppShell({
  children,
  title,
}: {
  children: React.ReactNode
  title: string
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // ✅ PARALLEL QUERIES — run both at same time instead of sequential
  const [{ data: profile }, { count: lowStockCount }] = await Promise.all([
    supabase
      .from('profiles')
      .select('full_name, role')
      .eq('id', user.id)
      .single(),
    supabase
      .from('v_product_summary')
      .select('*', { count: 'exact', head: true })
      .in('stock_status', ['low_stock', 'out_of_stock'])
      .eq('is_active', true)
  ])

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top Nav */}
      <header className="glass-nav-top sticky top-0 z-40 px-4 py-3">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img
              src={LOGO_URL}
              alt="NPURE"
              className="w-7 h-7 rounded-lg object-cover"
            />
            <div>
              <h1 className="text-sm font-bold text-pink-950 leading-tight">NPURE SO</h1>
              <p className="text-[10px] text-pink-700/60 leading-tight">{title}</p>
            </div>
          </div>
          <a
            href="/setting"
            className="glass-mini rounded-full px-3 py-1.5 text-xs font-semibold text-pink-950 flex items-center gap-2"
          >
            <span className="w-6 h-6 rounded-full bg-gradient-to-r from-pink-400 to-rose-400 flex items-center justify-center text-white text-[10px] font-bold">
              {(profile?.full_name || 'U').charAt(0).toUpperCase()}
            </span>
            <span className="hidden sm:inline">{profile?.full_name || 'User'}</span>
          </a>
        </div>
      </header>

      {/* Page Content */}
      <main className="flex-1 max-w-md mx-auto w-full px-4 py-4 pb-24">
        {children}
      </main>

      {/* Bottom Nav */}
      <BottomNav lowStockCount={lowStockCount || 0} />
    </div>
  )
}
