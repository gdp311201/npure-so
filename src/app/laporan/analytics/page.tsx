import { createClient } from '@/lib/supabase/server'
import AppShell from '@/components/layout/app-shell'
import { formatRupiah, getCurrentMonth, getCurrentYear, getTodayISO, BULAN_LIST } from '@/lib/utils/format'
import AnalyticsView from './analytics-view'

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string; date?: string; month?: string; year?: string }>
}) {
  const params = await searchParams
  const mode = (params.mode as 'harian' | 'mingguan' | 'bulanan') || 'bulanan'

  const supabase = await createClient()

  let dateFrom: string, dateTo: string, periodLabel: string

  if (mode === 'harian') {
    const date = params.date || getTodayISO()
    dateFrom = date
    dateTo = date
    const [y, m, d] = date.split('-').map(Number)
    periodLabel = new Date(y, m - 1, d).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  } else if (mode === 'mingguan') {
    const dateStr = params.date || getTodayISO()
    const [y, m, d] = dateStr.split('-').map(Number)
    const date = new Date(y, m - 1, d)
    const dayOfWeek = date.getDay()
    const monday = new Date(y, m - 1, d - (dayOfWeek === 0 ? 6 : dayOfWeek - 1))
    const sunday = new Date(monday)
    sunday.setDate(monday.getDate() + 6)
    const fmt = (dt: Date) => `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`
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

  const [
    { data: products },
    { data: sellOutTx },
    { data: sellInTx },
    { data: adjustTx },
    { data: sales },
    { data: monthlyConfig },
    { data: beforeTx },
  ] = await Promise.all([
    supabase.from('v_product_summary').select('id, name, current_stock, current_price').eq('is_active', true).order('name'),
    supabase.from('stock_transactions').select('product_id, qty, unit_price').eq('type', 'sell_out').eq('is_deleted', false).gte('transaction_date', dateFrom).lte('transaction_date', dateTo),
    supabase.from('stock_transactions').select('product_id, qty').eq('type', 'sell_in').eq('is_deleted', false).gte('transaction_date', dateFrom).lte('transaction_date', dateTo),
    supabase.from('stock_transactions').select('product_id, qty').eq('type', 'adjustment').eq('is_deleted', false).gte('transaction_date', dateFrom).lte('transaction_date', dateTo),
    supabase.from('sales').select('transaction_date, total_qty, gross_amount, net_amount').gte('transaction_date', dateFrom).lte('transaction_date', dateTo).order('transaction_date'),
    supabase.from('monthly_config').select('discount_rate, target_omset').eq('period', dateFrom.slice(0, 7)).single(),
    supabase.from('stock_transactions').select('product_id, type, qty').eq('is_deleted', false).lt('transaction_date', dateFrom),
  ])

  const productMap = new Map<string, string>()
  products?.forEach(p => productMap.set(p.id, p.name))

  const stockBeforeMap = new Map<string, number>()
  beforeTx?.forEach(tx => {
    const cur = stockBeforeMap.get(tx.product_id) || 0
    if (tx.type === 'initial_stock' || tx.type === 'sell_in') stockBeforeMap.set(tx.product_id, cur + tx.qty)
    else if (tx.type === 'sell_out') stockBeforeMap.set(tx.product_id, cur - tx.qty)
    else if (tx.type === 'adjustment') stockBeforeMap.set(tx.product_id, cur + tx.qty)
  })

  const sellOutMap = new Map<string, { name: string; qty: number; omset: number }>()
  sellOutTx?.forEach(tx => {
    const name = productMap.get(tx.product_id) || 'Unknown'
    const ex = sellOutMap.get(tx.product_id) || { name, qty: 0, omset: 0 }
    ex.qty += tx.qty
    ex.omset += Number(tx.unit_price) * tx.qty
    sellOutMap.set(tx.product_id, ex)
  })

  const sellInMap = new Map<string, number>()
  sellInTx?.forEach(tx => sellInMap.set(tx.product_id, (sellInMap.get(tx.product_id) || 0) + tx.qty))
  adjustTx?.forEach(tx => sellInMap.set(tx.product_id, (sellInMap.get(tx.product_id) || 0) + tx.qty))

  const topSellers = Array.from(sellOutMap.values()).sort((a, b) => b.qty - a.qty).slice(0, 10)
    .map(s => ({ name: s.name.length > 28 ? s.name.slice(0, 28) + '...' : s.name, qty: s.qty, omset: s.omset }))

  const slowMovers = Array.from(sellOutMap.values()).filter(s => s.qty > 0).sort((a, b) => a.qty - b.qty).slice(0, 10)
    .map(s => ({ name: s.name.length > 28 ? s.name.slice(0, 28) + '...' : s.name, qty: s.qty, omset: s.omset }))

  // Weekday summary — average sellout per weekday
  const weekdayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']
  const weekdayData = weekdayNames.map(name => ({ day: name, total_qty: 0, total_omset: 0, count: 0 }))
  sales?.forEach(sale => {
    const [y, m, d] = sale.transaction_date.split('-').map(Number)
    const date = new Date(y, m - 1, d)
    const wd = date.getDay()
    weekdayData[wd].total_qty += sale.total_qty
    weekdayData[wd].total_omset += Number(sale.net_amount)
    weekdayData[wd].count += 1
  })
  const weekdaySummary = weekdayData
    .map(w => ({ day: w.day, avg_qty: w.count > 0 ? Math.round(w.total_qty / w.count) : 0, total_qty: w.total_qty, days_active: w.count }))
    .filter(w => w.days_active > 0)
    .sort((a, b) => b.avg_qty - a.avg_qty)

  const turnover = (products || []).map(p => {
    const stockAwal = stockBeforeMap.get(p.id) || 0
    const sold = sellOutMap.get(p.id)?.qty || 0
    const incoming = sellInMap.get(p.id) || 0
    const currentStock = stockAwal + incoming - sold
    const turnoverPct = stockAwal > 0 ? Math.round((sold / stockAwal) * 100) : 0
    return {
      name: p.name.length > 30 ? p.name.slice(0, 30) + '...' : p.name,
      stock_awal: stockAwal, sold, incoming, current_stock: currentStock,
      turnover_pct: turnoverPct,
      status: turnoverPct > 100 ? 'fast' : turnoverPct > 50 ? 'healthy' : turnoverPct > 10 ? 'slow' : 'dead',
    }
  }).filter(t => t.sold > 0).sort((a, b) => b.turnover_pct - a.turnover_pct)

  const restockAlert = (products || []).map(p => {
    const stockAwal = stockBeforeMap.get(p.id) || 0
    const sold = sellOutMap.get(p.id)?.qty || 0
    const incoming = sellInMap.get(p.id) || 0
    return { name: p.name, current_stock: stockAwal + incoming - sold, sold, incoming }
  }).filter(p => p.current_stock <= 10).sort((a, b) => a.current_stock - b.current_stock)

  const totalQty = sellOutTx?.reduce((s, tx) => s + tx.qty, 0) || 0
  const grossOmset = sales?.reduce((s, sale) => s + Number(sale.gross_amount), 0) || 0
  const netOmset = sales?.reduce((s, sale) => s + Number(sale.net_amount), 0) || 0
  const totalCustomers = sales?.length || 0
  const targetOmset = Number(monthlyConfig?.target_omset || 0)
  const achievementPct = targetOmset > 0 ? (netOmset / targetOmset) * 100 : 0

  const analyticsData = {
    overview: { total_qty: totalQty, total_customer: totalCustomers, gross_omset: grossOmset, net_omset: netOmset, target_omset: targetOmset, achievement_pct: achievementPct },
    top_sellers: topSellers,
    slow_movers: slowMovers,
    weekday_summary: weekdaySummary,
    turnover,
    restock_alert: restockAlert,
    period_label: periodLabel,
  }

  return (
    <AppShell title="Analytics" showBackButton backHref="/laporan">
      <AnalyticsView data={analyticsData} mode={mode} searchParams={params} />
    </AppShell>
  )
}
