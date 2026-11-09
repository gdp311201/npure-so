import { createClient } from '@/lib/supabase/server'
import AppShell from '@/components/layout/app-shell'
import LiveClock from '@/components/dashboard/live-clock'
import { formatRupiah } from '@/lib/utils/format'

export default async function DashboardPage() {
  const supabase = await createClient()

  // Jakarta timezone date
  const jakartaDate = new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Jakarta' })
  const currentMonth = jakartaDate.slice(0, 7)

  // ✅ Parallel queries — semua fetch jalan bareng
  const [
    { data: todaySales },
    { data: monthlyConfig },
    { data: monthSales },
    { data: focusProducts },
    { data: lowStockProducts },
  ] = await Promise.all([
    // Today's sales
    supabase
      .from('sales')
      .select('total_qty, net_amount')
      .eq('transaction_date', jakartaDate),
    // Monthly config
    supabase
      .from('monthly_config')
      .select('target_omset, discount_rate')
      .eq('period', currentMonth)
      .single(),
    // This month's sales
    supabase
      .from('sales')
      .select('net_amount')
      .gte('transaction_date', `${currentMonth}-01`)
      .lte('transaction_date', jakartaDate),
    // Focus products progress
    supabase
      .from('v_focus_progress')
      .select('*')
      .eq('period', currentMonth),
    // Low stock products (fetch id + more items for smart analysis)
    supabase
      .from('v_product_summary')
      .select('id, name, current_stock')
      .in('stock_status', ['low_stock', 'out_of_stock'])
      .eq('is_active', true)
      .order('current_stock', { ascending: true })
      .limit(15),
  ])

  // Smart Low Stock — check which products have sales history
  const lowStockIds = (lowStockProducts || []).map(p => p.id)
  const { data: sellOutCheck } = lowStockIds.length > 0 ? await supabase
    .from('stock_transactions')
    .select('product_id, qty')
    .eq('type', 'sell_out')
    .eq('is_deleted', false)
    .in('product_id', lowStockIds) : { data: null }

  const sellOutQtyMap = new Map<string, number>()
  sellOutCheck?.forEach(tx => sellOutQtyMap.set(tx.product_id, (sellOutQtyMap.get(tx.product_id) || 0) + tx.qty))

  const lowStockSmart = (lowStockProducts || []).map(p => ({
    name: p.name,
    current_stock: p.current_stock,
    has_sales: (sellOutQtyMap.get(p.id) || 0) > 0,
    sold_qty: sellOutQtyMap.get(p.id) || 0,
  })).sort((a, b) => {
    // Sort: has_sales first (sold-out = restock urgent), then dead stock
    if (a.has_sales && !b.has_sales) return -1
    if (!a.has_sales && b.has_sales) return 1
    return a.current_stock - b.current_stock
  }).slice(0, 8)

  // Calculate today's stats
  const todaySellOutQty = todaySales?.reduce((sum, s) => sum + s.total_qty, 0) || 0
  const todayOmset = todaySales?.reduce((sum, s) => sum + Number(s.net_amount), 0) || 0
  const todayCustomers = todaySales?.length || 0

  // Calculate monthly achievement
  const monthOmset = monthSales?.reduce((sum, s) => sum + Number(s.net_amount), 0) || 0
  const targetOmset = Number(monthlyConfig?.target_omset || 0)
  const achievementPct = targetOmset > 0 ? (monthOmset / targetOmset) * 100 : 0
  const remainingOmset = Math.max(targetOmset - monthOmset, 0)

  // Format date display
  const dateDisplay = new Date().toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'Asia/Jakarta',
  })

  return (
    <AppShell title="Dashboard">
      <div className="space-y-4">
        {/* Live date + clock */}
        <div className="text-center space-y-0.5">
          <p className="text-xs text-pink-800/70 font-medium">{dateDisplay}</p>
          <LiveClock />
        </div>

        {/* Stats tiles — 3 columns */}
        <div className="grid grid-cols-3 gap-2">
          <div className="glass-mini rounded-xl p-3 text-center">
            <p className="text-[9px] font-bold uppercase text-pink-900/60 mb-0.5">Sell-Out</p>
            <p className="text-xl font-bold text-pink-950 leading-none">{todaySellOutQty}</p>
            <p className="text-[8px] text-pink-700/50 mt-1">pcs today</p>
          </div>
          <div className="glass-mini rounded-xl p-3 text-center">
            <p className="text-[9px] font-bold uppercase text-pink-900/60 mb-0.5">Omset</p>
            <p className="text-sm font-bold text-pink-950 leading-none mt-1">
              {todayOmset >= 1000000
                ? `Rp ${(todayOmset / 1000000).toFixed(1)}M`
                : todayOmset >= 1000
                ? `Rp ${(todayOmset / 1000).toFixed(0)}k`
                : `Rp ${todayOmset}`}
            </p>
            <p className="text-[8px] text-pink-700/50 mt-1">net today</p>
          </div>
          <div className="glass-mini rounded-xl p-3 text-center">
            <p className="text-[9px] font-bold uppercase text-pink-900/60 mb-0.5">Customer</p>
            <p className="text-xl font-bold text-pink-950 leading-none">{todayCustomers}</p>
            <p className="text-[8px] text-pink-700/50 mt-1">today</p>
          </div>
        </div>

        {/* Monthly target card — premium gradient with sweep effect */}
        <div className="asset-card premium-sweep-wrapper rounded-2xl p-4 relative overflow-hidden">
          <div className="premium-sweep" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs font-bold text-white/90 flex items-center gap-1">
                🎯 Monthly Target
              </h2>
              <span className="text-[10px] font-bold text-white/80 bg-white/20 px-2 py-0.5 rounded-full backdrop-blur-sm">
                {currentMonth}
              </span>
            </div>

            <div className="mb-3">
              <div className="flex items-baseline gap-2">
                <span className="text-lg font-black text-white font-mono">
                  {formatRupiah(monthOmset)}
                </span>
                <span className="text-[10px] text-white/60">
                  / {formatRupiah(targetOmset)}
                </span>
              </div>
            </div>

            {/* Progress bar */}
            <div className="progress-bar-track bg-white/20 mb-2">
              <div
                className="progress-bar-fill"
                style={{ width: `${Math.min(achievementPct, 100)}%` }}
              />
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-white">
                {achievementPct.toFixed(1)}%
              </span>
              <span className="text-[10px] text-white/70">
                Sisa: {formatRupiah(remainingOmset)}
              </span>
            </div>
          </div>
        </div>

        {/* Focus products section */}
        {focusProducts && focusProducts.length > 0 && (
          <div>
            <h3 className="text-xs font-bold text-pink-950 mb-2 px-1 flex items-center gap-1">
              🌟 Focus Products
              <span className="text-[10px] text-pink-700/50 font-normal">
                ({focusProducts.length})
              </span>
            </h3>
            <div className="space-y-2">
              {focusProducts.map((fp) => {
                const sold = Number(fp.sold_qty) || 0
                const target = Number(fp.target_qty) || 0
                const achPct = Number(fp.achievement_pct) || 0
                const remaining = Number(fp.remaining_qty) || 0
                const contribution = Number(fp.contribution_to_sales_pct) || 0

                return (
                  <div key={fp.product_id} className="glass-focus rounded-xl p-3">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-bold text-pink-950 truncate flex-1">
                        {fp.product_name}
                      </p>
                      <span className="text-[10px] font-bold text-violet-600 ml-2 whitespace-nowrap">
                        {contribution.toFixed(1)}% sales
                      </span>
                    </div>
                    <div className="progress-bar-track mb-1.5">
                      <div
                        className="progress-bar-fill"
                        style={{ width: `${Math.min(achPct, 100)}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-pink-800/70">
                      <span className="font-semibold">
                        {achPct.toFixed(0)}% ({sold}/{target})
                      </span>
                      <span>Sisa: {remaining} pcs</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Low stock alert — smart (sold-out vs dead stock) */}
        {lowStockSmart.length > 0 && (
          <div>
            <h3 className="text-xs font-bold text-pink-950 mb-2 px-1 flex items-center gap-1">
              ⚠️ Low Stock
              <span className="text-[10px] text-pink-700/50 font-normal">
                ({lowStockSmart.length})
              </span>
            </h3>
            <div className="glass-stock-low rounded-xl p-3 space-y-1.5">
              {lowStockSmart.map((p) => (
                <div key={p.name} className="flex items-center justify-between text-xs">
                  <span className="text-pink-950 truncate flex-1 pr-2">{p.name}</span>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <span>{p.has_sales ? '🔴' : '⚫'}</span>
                    <span className={`font-bold whitespace-nowrap ${p.current_stock === 0 ? 'text-rose-400' : 'text-amber-400'}`}>
                      {p.current_stock} pcs
                    </span>
                    {p.has_sales && p.sold_qty > 0 && (
                      <span className="text-[9px] text-pink-700/40">({p.sold_qty} sold)</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-2 mt-2 px-1">
              <span className="text-[8px] text-rose-400">🔴 Sold out — restock!</span>
              <span className="text-[8px] text-slate-400">⚫ Dead stock — skip</span>
            </div>
          </div>
        )}

        {/* Quick actions */}
        <div>
          <h3 className="text-xs font-bold text-pink-950 mb-2 px-1">⚡ Quick Actions</h3>
          <div className="grid grid-cols-3 gap-2">
            <a
              href="/transaksi"
              className="quick-action-btn rounded-xl p-3 text-center"
            >
              <p className="text-xl mb-1">🛒</p>
              <p className="text-[10px] font-bold text-pink-950">Sell-Out</p>
            </a>
            <a
              href="/transaksi"
              className="quick-action-btn rounded-xl p-3 text-center"
            >
              <p className="text-xl mb-1">📥</p>
              <p className="text-[10px] font-bold text-pink-950">Sell-In</p>
            </a>
            <a
              href="/transaksi"
              className="quick-action-btn rounded-xl p-3 text-center"
            >
              <p className="text-xl mb-1">📋</p>
              <p className="text-[10px] font-bold text-pink-950">Opname</p>
            </a>
          </div>
        </div>
      </div>
    </AppShell>
  )
}
