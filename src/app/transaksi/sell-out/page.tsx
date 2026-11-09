import { createClient } from '@/lib/supabase/server'
import AppShell from '@/components/layout/app-shell'
import { getTodayISO } from '@/lib/utils/format'
import SellOutTabs from './sell-out-tabs'
import SellOutCart from './sell-out-cart'
import SellOutHistory from './sell-out-history'

// Force dynamic rendering — fresh data on every request
export const dynamic = 'force-dynamic'
export const revalidate = 0

interface Product {
  id: string
  name: string
  current_price: number | bigint
  current_stock: number
}

interface StockTxItem {
  id: string
  qty: number
  unit_price: number
  product_id: { id: string; name: string }
}

interface Sale {
  id: string
  transaction_date: string
  total_qty: number
  gross_amount: number
  discount_rate: number
  discount_amount: number
  net_amount: number
  note: string | null
  created_at: string
  stock_transactions: StockTxItem[]
}

export default async function SellOutPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>
}) {
  const params = await searchParams
  const tab = params.tab === 'history' ? 'history' : 'input'
  const supabase = await createClient()

  const today = getTodayISO()
  const period = today.slice(0, 7) // "2026-11"

  // === Fetch products (for input tab) ===
  const { data: productsData } = await supabase
    .from('v_product_summary')
    .select('id, name, current_price, current_stock')
    .eq('is_active', true)
    .order('name')

  // === Fetch monthly config for discount rate ===
  const { data: monthlyConfig } = await supabase
    .from('monthly_config')
    .select('discount_rate')
    .eq('period', period)
    .single()

  const discountRate = monthlyConfig?.discount_rate ?? 0.25

  // === Fetch all sales with stock_transactions (items) ===
  // Items are stored in stock_transactions (type='sell_out', sale_id FK)
  // NO sale_items table exists — items come from stock_transactions
  const { data: salesData } = await supabase
    .from('sales')
    .select(`
      id, transaction_date, total_qty, gross_amount, discount_rate,
      discount_amount, net_amount, note, created_at,
      stock_transactions (
        id, qty, unit_price,
        product_id (id, name)
      )
    `)
    .order('transaction_date', { ascending: false })
    .order('created_at', { ascending: false })

  const products = (productsData as Product[]) || []
  const sales = (salesData as unknown as Sale[]) || []

  return (
    <AppShell title="Sell Out" showBackButton backHref="/dashboard">
      {/* Tabs UI */}
      <SellOutTabs activeTab={tab} />

      {/* Tab content */}
      <div className="mt-4">
        {tab === 'input' ? (
          <SellOutCart products={products} discountRate={discountRate} defaultDate={today} />
        ) : (
          <SellOutHistory sales={sales} />
        )}
      </div>
    </AppShell>
  )
}
