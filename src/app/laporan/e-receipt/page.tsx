import { createClient } from '@/lib/supabase/server'
import AppShell from '@/components/layout/app-shell'
import EReceiptView from './e-receipt-view'
import { BULAN_LIST, getCurrentMonth, getCurrentYear, getTodayISO } from '@/lib/utils/format'

export default async function EReceiptPage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string; date?: string; month?: string; year?: string; dateFrom?: string; dateTo?: string }>
}) {
  const params = await searchParams
  const mode = (params.mode as 'harian' | 'bulanan' | 'custom') || 'bulanan'

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let dateFrom: string, dateTo: string, periodLabel: string

  if (mode === 'harian') {
    const date = params.date || getTodayISO()
    dateFrom = date
    dateTo = date
    periodLabel = new Date(date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Jakarta' })
  } else if (mode === 'custom') {
    dateFrom = params.dateFrom || getTodayISO()
    dateTo = params.dateTo || getTodayISO()
    periodLabel = `${dateFrom} s/d ${dateTo}`
  } else {
    const month = params.month ? Number(params.month) : getCurrentMonth()
    const year = params.year ? Number(params.year) : getCurrentYear()
    dateFrom = `${year}-${String(month).padStart(2, '0')}-01`
    const lastDay = new Date(year, month, 0).getDate()
    dateTo = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`
    periodLabel = `${BULAN_LIST[month - 1]} ${year}`
  }

  const [
    { data: sellOutTx },
    { data: sellInTx },
    { data: sales },
    { data: monthlyConfig },
    { data: focusProducts },
    { data: opnameLogs },
    { data: products },
    { data: profile },
  ] = await Promise.all([
    supabase.from('stock_transactions').select('product_id, qty, unit_price').eq('type', 'sell_out').eq('is_deleted', false).gte('transaction_date', dateFrom).lte('transaction_date', dateTo),
    supabase.from('stock_transactions').select('product_id, qty, unit_price').eq('type', 'sell_in').eq('is_deleted', false).gte('transaction_date', dateFrom).lte('transaction_date', dateTo),
    supabase.from('sales').select('total_qty, gross_amount, discount_amount, net_amount').gte('transaction_date', dateFrom).lte('transaction_date', dateTo),
    supabase.from('monthly_config').select('discount_rate, target_omset').eq('period', dateFrom.slice(0, 7)).single(),
    supabase.from('v_focus_progress').select('*').eq('period', dateFrom.slice(0, 7)),
    supabase.from('stock_opname').select('opname_date, opname_type, product_id, difference, reason').gte('opname_date', dateFrom).lte('opname_date', dateTo),
    supabase.from('v_product_summary').select('id, name').eq('is_active', true).order('name'),
    supabase.from('profiles').select('full_name').eq('id', user!.id).single(),
  ])

  const sellOutMap = new Map<string, { qty: number; omset: number }>()
  sellOutTx?.forEach((tx) => {
    const ex = sellOutMap.get(tx.product_id) || { qty: 0, omset: 0 }
    ex.qty += tx.qty
    ex.omset += Number(tx.unit_price) * tx.qty
    sellOutMap.set(tx.product_id, ex)
  })

  const productDetails = (products || []).map((p) => ({
    product_name: p.name,
    sell_out_qty: sellOutMap.get(p.id)?.qty || 0,
    sell_out_omset: sellOutMap.get(p.id)?.omset || 0,
  })).filter((r) => r.sell_out_qty > 0)

  const totalSellOutQty = sellOutTx?.reduce((s, tx) => s + tx.qty, 0) || 0
  const grossOmset = sales?.reduce((s, sale) => s + Number(sale.gross_amount), 0) || 0
  const discountAmount = sales?.reduce((s, sale) => s + Number(sale.discount_amount), 0) || 0
  const netOmset = sales?.reduce((s, sale) => s + Number(sale.net_amount), 0) || 0
  const totalCustomers = sales?.length || 0
  const totalSellInQty = sellInTx?.reduce((s, tx) => s + tx.qty, 0) || 0
  const targetOmset = Number(monthlyConfig?.target_omset || 0)
  const achievementPct = targetOmset > 0 ? (netOmset / targetOmset) * 100 : 0
  const remainingOmset = Math.max(targetOmset - netOmset, 0)
  const discountRate = Number(monthlyConfig?.discount_rate || 0.25)

  const productMap = new Map(products?.map((p) => [p.id, p.name]) || [])
  const opnameLogsWithNames = (opnameLogs || []).map((o) => ({
    opname_date: o.opname_date,
    opname_type: o.opname_type,
    product_name: productMap.get(o.product_id) || 'Unknown',
    difference: o.difference,
    reason: o.reason,
  }))

  const receiptData = {
    summary: {
      total_sell_out_qty: totalSellOutQty,
      total_customer: totalCustomers,
      gross_omset: grossOmset,
      discount_rate: discountRate,
      discount_amount: discountAmount,
      net_omset: netOmset,
      total_sell_in_qty: totalSellInQty,
    },
    target: {
      target_omset: targetOmset,
      achieved_omset: netOmset,
      achievement_pct: achievementPct,
      remaining_omset: remainingOmset,
    },
    focus_products: (focusProducts || []).map((fp) => ({
      product_id: fp.product_id,
      product_name: fp.product_name,
      target_qty: Number(fp.target_qty),
      sold_qty: Number(fp.sold_qty),
      achievement_pct: Number(fp.achievement_pct),
      remaining_qty: Number(fp.remaining_qty),
      contribution_to_sales_pct: Number(fp.contribution_to_sales_pct),
    })),
    product_details: productDetails,
    opname_logs: opnameLogsWithNames,
    meta: {
      period_label: periodLabel,
      user_name: profile?.full_name || 'User',
      generated_at: new Date().toLocaleString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta' }) + ' WIB',
    },
  }

  return (
    <AppShell title="E-Receipt" showBackButton backHref="/laporan">
      <EReceiptView
        data={receiptData}
        mode={mode}
        searchParams={params}
      />
    </AppShell>
  )
}
