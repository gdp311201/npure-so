import { createClient } from '@/lib/supabase/server'
import AppShell from '@/components/layout/app-shell'
import { getCurrentMonth, getCurrentYear, getTodayISO, BULAN_LIST } from '@/lib/utils/format'
import TrackingControls from './tracking-controls'

interface Product { id: string; name: string }
interface TransactionRow { date: string; type: string; qty_in: number; qty_out: number; balance: number }

export default async function TrackingPage({ searchParams }: { searchParams: Promise<{ productId?: string; mode?: string; date?: string; dateFrom?: string; dateTo?: string; month?: string; year?: string }> }) {
  const params = await searchParams
  const supabase = await createClient()
  const { data: allProducts } = await supabase.from('v_product_summary').select('id, name').eq('is_active', true).order('name')
  const productId = params.productId
  const mode = (params.mode as 'bulanan' | 'custom') || 'bulanan'

  if (!productId) {
    return (
      <AppShell title="Product Tracking" showBackButton backHref="/produk">
        <TrackingControls products={(allProducts as Product[]) || []} selectedProductId={null} mode={mode} searchParams={params} />
        <div className="glass-card rounded-2xl p-6 text-center mt-4">
          <div className="text-3xl mb-2 opacity-50">📋</div>
          <p className="text-xs font-bold text-pink-900/70">Pilih produk untuk melihat mutasi</p>
          <p className="text-[10px] text-pink-900/50 mt-1">Cari produk di atas, lalu pilih periode</p>
        </div>
      </AppShell>
    )
  }

  let dateFrom: string, dateTo: string, periodLabel: string

  if (mode === 'custom') {
    dateFrom = params.dateFrom || getTodayISO()
    dateTo = params.dateTo || getTodayISO()
    const [fy, fm, fd] = dateFrom.split('-').map(Number)
    const [ty, tm, td] = dateTo.split('-').map(Number)
    periodLabel = `${fd} ${BULAN_LIST[fm - 1].slice(0, 3)} ${fy} - ${td} ${BULAN_LIST[tm - 1].slice(0, 3)} ${ty}`
  } else {
    const month = params.month ? Number(params.month) : getCurrentMonth()
    const year = params.year ? Number(params.year) : getCurrentYear()
    dateFrom = `${year}-${String(month).padStart(2, '0')}-01`
    const lastDay = new Date(year, month, 0).getDate()
    dateTo = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`
    periodLabel = `${BULAN_LIST[month - 1]} ${year}`
  }

  const { data: product } = await supabase.from('products').select('name').eq('id', productId).single()
  const dayBefore = new Date(dateFrom); dayBefore.setDate(dayBefore.getDate() - 1)
  const dayBeforeStr = `${dayBefore.getFullYear()}-${String(dayBefore.getMonth() + 1).padStart(2, '0')}-${String(dayBefore.getDate()).padStart(2, '0')}`
  const { data: beforeTx } = await supabase.from('stock_transactions').select('type, qty').eq('product_id', productId).eq('is_deleted', false).lte('transaction_date', dayBeforeStr)
  let stockAwal = 0
  beforeTx?.forEach((tx) => { if (tx.type === 'initial_stock' || tx.type === 'sell_in') stockAwal += tx.qty; else if (tx.type === 'sell_out') stockAwal -= tx.qty; else if (tx.type === 'adjustment') stockAwal += tx.qty })
  const { data: transactions } = await supabase.from('stock_transactions').select('type, qty, transaction_date, unit_price').eq('product_id', productId).eq('is_deleted', false).gte('transaction_date', dateFrom).lte('transaction_date', dateTo).order('transaction_date', { ascending: true })

  let runningBalance = stockAwal
  const rows: TransactionRow[] = []
  const byDate = new Map<string, { type: string; qty: number }[]>()
  transactions?.forEach((tx) => { const date = tx.transaction_date; if (!byDate.has(date)) byDate.set(date, []); byDate.get(date)!.push({ type: tx.type, qty: tx.qty }) })
  byDate.forEach((txs, date) => {
    let dayIn = 0, dayOut = 0
    txs.forEach((tx) => {
      if (tx.type === 'initial_stock' || tx.type === 'sell_in') { runningBalance += tx.qty; dayIn += tx.qty }
      else if (tx.type === 'sell_out') { runningBalance -= tx.qty; dayOut += tx.qty }
      else if (tx.type === 'adjustment') { runningBalance += tx.qty; if (tx.qty > 0) dayIn += tx.qty; else dayOut += Math.abs(tx.qty) }
    })
    rows.push({ date, type: txs.length > 1 ? `${txs.length} transaksi` : txs[0].type, qty_in: dayIn, qty_out: dayOut, balance: runningBalance })
  })

  const stockAkhir = runningBalance
  const totalIn = rows.reduce((s, r) => s + r.qty_in, 0)
  const totalOut = rows.reduce((s, r) => s + r.qty_out, 0)

  return (
    <AppShell title="Product Tracking" showBackButton backHref="/produk">
      <TrackingControls products={(allProducts as Product[]) || []} selectedProductId={productId} mode={mode} searchParams={params} />
      {product && (
        <div className="space-y-3 mt-4">
          <div className="glass-card rounded-2xl p-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-bold text-pink-950">{product.name}</h2>
              <span className="text-[10px] font-bold text-pink-700 bg-pink-100 px-2 py-0.5 rounded-full">{periodLabel}</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="glass-mini rounded-lg p-2 text-center"><p className="text-[9px] font-bold uppercase text-pink-900/60">Stock Awal</p><p className="text-lg font-bold text-pink-950">{stockAwal}</p></div>
              <div className="glass-mini rounded-lg p-2 text-center"><p className="text-[9px] font-bold uppercase text-pink-900/60">Total In</p><p className="text-lg font-bold text-emerald-400">+{totalIn}</p></div>
              <div className="glass-mini rounded-lg p-2 text-center"><p className="text-[9px] font-bold uppercase text-pink-900/60">Total Out</p><p className="text-lg font-bold text-rose-400">-{totalOut}</p></div>
            </div>
            <div className="mt-2 glass-mini rounded-lg p-2 text-center"><p className="text-[9px] font-bold uppercase text-pink-900/60">Stock Akhir ({dateTo})</p><p className="text-xl font-black text-pink-950">{stockAkhir} pcs</p></div>
          </div>
          {rows.length === 0 ? (
            <div className="glass-card rounded-2xl p-6 text-center"><p className="text-xs font-bold text-pink-900/70">Tidak ada transaksi pada periode ini</p></div>
          ) : (
            <div className="glass-card rounded-xl overflow-hidden">
              <table className="w-full text-[10px]">
                <thead><tr className="bg-pink-500/10 border-b border-pink-200/50">
                  <th className="text-left py-2 px-2 font-bold text-pink-900/70">Tanggal</th>
                  <th className="text-left py-2 px-1 font-bold text-pink-900/70">Type</th>
                  <th className="text-right py-2 px-1 font-bold text-pink-900/70">In</th>
                  <th className="text-right py-2 px-1 font-bold text-pink-900/70">Out</th>
                  <th className="text-right py-2 px-1 font-bold text-pink-900/70">Balance</th>
                </tr></thead>
                <tbody>
                  {rows.map((row, i) => (
                    <tr key={i} className="border-b border-pink-100/40">
                      <td className="py-1.5 px-2 text-pink-950 font-medium">{row.date}</td>
                      <td className="py-1.5 px-1 text-pink-700/60">{row.type === 'sell_in' ? '📥 Sell-In' : row.type === 'sell_out' ? '🛒 Sell-Out' : row.type === 'initial_stock' ? '📦 Initial' : row.type === 'adjustment' ? '⚙️ Adj' : row.type}</td>
                      <td className="text-right py-1.5 px-1 font-mono text-emerald-400">{row.qty_in > 0 ? `+${row.qty_in}` : '—'}</td>
                      <td className="text-right py-1.5 px-1 font-mono text-rose-400">{row.qty_out > 0 ? `-${row.qty_out}` : '—'}</td>
                      <td className="text-right py-1.5 px-1 font-mono font-bold text-pink-950">{row.balance}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </AppShell>
  )
}
