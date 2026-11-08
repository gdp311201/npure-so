import { createClient } from '@/lib/supabase/server'
import AppShell from '@/components/layout/app-shell'
import { formatRupiah, getCurrentMonth, getCurrentYear, getTodayISO, BULAN_LIST } from '@/lib/utils/format'
import MonthSelector from './month-selector'

export default async function SummaryPage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string; date?: string; month?: string; year?: string }>
}) {
  const params = await searchParams
  const mode = (params.mode as 'harian' | 'mingguan' | 'bulanan') || 'bulanan'

  let dateFrom: string, dateTo: string, periodLabel: string

  if (mode === 'harian') {
    const date = params.date || getTodayISO()
    dateFrom = date
    dateTo = date
    const [y, m, d] = date.split('-').map(Number)
    periodLabel = new Date(y, m - 1, d).toLocaleDateString('id-ID', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    })
  } else if (mode === 'mingguan') {
    const dateStr = params.date || getTodayISO()
    const [y, m, d] = dateStr.split('-').map(Number)
    const date = new Date(y, m - 1, d)
    const dayOfWeek = date.getDay()
    const monday = new Date(y, m - 1, d - (dayOfWeek === 0 ? 6 : dayOfWeek - 1))
    const sunday = new Date(monday)
    sunday.setDate(monday.getDate() + 6)

    const fmt = (dt: Date) =>
      `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`
    dateFrom = fmt(monday)
    dateTo = fmt(sunday)
    periodLabel = `${monday.getDate()} ${BULAN_LIST[monday.getMonth()].slice(0, 3)} - ${sunday.getDate()} ${BULAN_LIST[sunday.getMonth()].slice(0, 3)} ${sunday.getFullYear()}`
  } else {
    const month = params.month ? Number(params.month) : getCurrentMonth()
    const year = params.year ? Number(params.year) : getCurrentYear()
    dateFrom = `${year}-${String(month).padStart(2, '0')}-01`
    const lastDay = new Date(year, month, 0).getDate()
    dateTo = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`
    periodLabel = `${BULAN_LIST[month - 1]} ${year}`
  }

  const supabase = await createClient()

  const [
    { data: products },
    { data: sellOutTx },
    { data: sellInTx },
    { data: sales },
    { data: monthlyConfig },
  ] = await Promise.all([
    supabase.from('v_product_summary').select('id, name, current_price, current_stock').eq('is_active', true).order('name'),
    supabase.from('stock_transactions').select('product_id, qty, unit_price').eq('type', 'sell_out').eq('is_deleted', false).gte('transaction_date', dateFrom).lte('transaction_date', dateTo),
    supabase.from('stock_transactions').select('product_id, qty, unit_price').eq('type', 'sell_in').eq('is_deleted', false).gte('transaction_date', dateFrom).lte('transaction_date', dateTo),
    supabase.from('sales').select('total_qty, net_amount').gte('transaction_date', dateFrom).lte('transaction_date', dateTo),
    supabase.from('monthly_config').select('discount_rate, target_omset').eq('period', dateFrom.slice(0, 7)).single(),
  ])

  const sellOutMap = new Map<string, { qty: number; omset: number }>()
  sellOutTx?.forEach((tx) => {
    const ex = sellOutMap.get(tx.product_id) || { qty: 0, omset: 0 }
    ex.qty += tx.qty
    ex.omset += Number(tx.unit_price) * tx.qty
    sellOutMap.set(tx.product_id, ex)
  })

  const sellInMap = new Map<string, { qty: number; omset: number }>()
  sellInTx?.forEach((tx) => {
    const ex = sellInMap.get(tx.product_id) || { qty: 0, omset: 0 }
    ex.qty += tx.qty
    ex.omset += Number(tx.unit_price) * tx.qty
    sellInMap.set(tx.product_id, ex)
  })

  const summaryRows = (products || [])
    .map((p) => ({
      product_name: p.name,
      sell_out_qty: sellOutMap.get(p.id)?.qty || 0,
      sell_out_omset: sellOutMap.get(p.id)?.omset || 0,
      sell_in_qty: sellInMap.get(p.id)?.qty || 0,
      stock_end: p.current_stock,
    }))
    .filter((r) => r.sell_out_qty > 0 || r.sell_in_qty > 0)

  const totalSellOutQty = summaryRows.reduce((s, r) => s + r.sell_out_qty, 0)
  const totalSellOutOmset = summaryRows.reduce((s, r) => s + r.sell_out_omset, 0)
  const totalSellInQty = summaryRows.reduce((s, r) => s + r.sell_in_qty, 0)
  const totalCustomers = sales?.length || 0
  const totalNetOmset = sales?.reduce((s, sale) => s + Number(sale.net_amount), 0) || 0
  const targetOmset = Number(monthlyConfig?.target_omset || 0)
  const achievementPct = targetOmset > 0 ? (totalNetOmset / targetOmset) * 100 : 0

  return (
    <AppShell title="Summary" showBackButton backHref="/laporan">
      <div className="space-y-4">
        <MonthSelector
          defaultMode={mode}
          defaultMonth={mode === 'bulanan' ? (params.month ? Number(params.month) : getCurrentMonth()) : getCurrentMonth()}
          defaultYear={mode === 'bulanan' ? (params.year ? Number(params.year) : getCurrentYear()) : getCurrentYear()}
          defaultDate={params.date || getTodayISO()}
        />

        {/* Period label */}
        <div className="text-center">
          <p className="text-xs font-bold text-pink-950">{periodLabel}</p>
        </div>

        {/* Summary stats */}
        <div className="grid grid-cols-2 gap-2">
          <div className="glass-mini rounded-xl p-3">
            <p className="text-[9px] font-bold uppercase text-pink-900/60">Total Sell-Out</p>
            <p className="text-lg font-bold text-pink-950">{totalSellOutQty} pcs</p>
            <p className="text-[10px] text-pink-700/60">{formatRupiah(totalSellOutOmset)} gross</p>
          </div>
          <div className="glass-mini rounded-xl p-3">
            <p className="text-[9px] font-bold uppercase text-pink-900/60">Net Omset</p>
            <p className="text-lg font-bold text-pink-950">{formatRupiah(totalNetOmset)}</p>
            <p className="text-[10px] text-pink-700/60">{totalCustomers} customers</p>
          </div>
          <div className="glass-mini rounded-xl p-3">
            <p className="text-[9px] font-bold uppercase text-pink-900/60">Total Sell-In</p>
            <p className="text-lg font-bold text-pink-950">{totalSellInQty} pcs</p>
            <p className="text-[10px] text-pink-700/60">barang masuk</p>
          </div>
          <div className="glass-mini rounded-xl p-3">
            <p className="text-[9px] font-bold uppercase text-pink-900/60">Achievement</p>
            <p className="text-lg font-bold text-pink-950">{achievementPct.toFixed(1)}%</p>
            <p className="text-[10px] text-pink-700/60">/ {formatRupiah(targetOmset)}</p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="glass-card rounded-xl p-3">
          <div className="progress-bar-track mb-1">
            <div className="progress-bar-fill" style={{ width: `${Math.min(achievementPct, 100)}%` }} />
          </div>
          <p className="text-[10px] text-pink-700/60 text-center">
            {periodLabel} · {achievementPct.toFixed(1)}% dari target
          </p>
        </div>

        {/* Product breakdown */}
        {summaryRows.length === 0 ? (
          <div className="glass-card rounded-2xl p-6 text-center">
            <p className="text-xs font-bold text-pink-900/70">Tidak ada transaksi pada periode ini</p>
          </div>
        ) : (
          <div>
            <h3 className="text-xs font-bold text-pink-950 mb-2 px-1">
              📋 Rincian Per Produk ({summaryRows.length} produk)
            </h3>
            <div className="glass-card rounded-xl overflow-hidden">
              <table className="w-full text-[10px]">
                <thead>
                  <tr className="bg-pink-500/10 border-b border-pink-200/50">
                    <th className="text-left py-2 px-2 font-bold text-pink-900/70">Produk</th>
                    <th className="text-right py-2 px-1 font-bold text-pink-900/70">Out Qty</th>
                    <th className="text-right py-2 px-1 font-bold text-pink-900/70">Out Rp</th>
                    <th className="text-right py-2 px-1 font-bold text-pink-900/70">In Qty</th>
                    <th className="text-right py-2 px-1 font-bold text-pink-900/70">Stock</th>
                  </tr>
                </thead>
                <tbody>
                  {summaryRows.map((row, i) => (
                    <tr key={i} className="border-b border-pink-100/40">
                      <td className="py-1.5 px-2 text-pink-950 font-medium truncate max-w-[120px]">{row.product_name}</td>
                      <td className="text-right py-1.5 px-1 font-mono text-pink-950">{row.sell_out_qty}</td>
                      <td className="text-right py-1.5 px-1 font-mono text-pink-700/70">{row.sell_out_omset > 0 ? formatRupiah(row.sell_out_omset) : '—'}</td>
                      <td className="text-right py-1.5 px-1 font-mono text-emerald-600">{row.sell_in_qty > 0 ? row.sell_in_qty : '—'}</td>
                      <td className="text-right py-1.5 px-1 font-mono font-bold text-pink-950">{row.stock_end}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  )
}
