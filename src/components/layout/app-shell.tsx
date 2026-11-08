import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import BottomNav from './bottom-nav'

const LOGO_URL = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/npure-assets/NPURE-Logo-White-1.png`;

export default async function AppShell({
  children,
  title,
  showBackButton = false,
  backHref,
}: {
  children: React.ReactNode
  title: string
  showBackButton?: boolean
  backHref?: string
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

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
      {/* Top Nav — pure logo only */}
      <header className="glass-nav-top sticky top-0 z-40 px-4 py-3">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            {showBackButton && backHref && (
              <Link
                href={backHref}
                className="glass-mini rounded-full w-8 h-8 flex items-center justify-center hover:bg-white/20 transition flex-shrink-0"
                aria-label="Kembali"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-pink-950"
                >
                  <path d="M19 12H5M12 19l-7-7 7-7" />
                </svg>
              </Link>
            )}
            <img
              src={LOGO_URL}
              alt="NPURE"
              className="h-9 w-auto"
            />
          </div>
          <a
            href="/setting"
            className="glass-mini rounded-full px-3 py-1.5 text-xs font-semibold text-pink-950 flex items-center gap-2"
          >
            {/* Avatar — premium neon green glow, senada Monthly Target card */}
            <span
              className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold"
              style={{
                background: 'rgba(6, 78, 59, 0.6)',
                border: '1px solid rgba(52, 211, 153, 0.40)',
                boxShadow: '0 0 8px rgba(52, 211, 153, 0.30), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
              }}
            >
              {(profile?.full_name || 'U').charAt(0).toUpperCase()}
            </span>
            <span className="hidden sm:inline">{profile?.full_name || 'User'}</span>
          </a>
        </div>
      </header>

      {/* Page Content */}
      <main className="flex-1 max-w-md mx-auto w-full px-4 py-4 pb-28">
        {children}
      </main>

      {/* Bottom Nav */}
      <BottomNav lowStockCount={lowStockCount || 0} />
    </div>
  )
}
