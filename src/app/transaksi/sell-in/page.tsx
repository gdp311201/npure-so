import { createClient } from '@/lib/supabase/server'
import AppShell from '@/components/layout/app-shell'
import { getTodayISO } from '@/lib/utils/format'
import SellInTabs from './sell-in-tabs'
import SellInCart from './sell-in-cart'
import SellInHistory from './sell-in-history'

// Force dynamic rendering — fresh data on every request
export const dynamic = 'force-dynamic'
export const revalidate = 0

interface Product {
  id: string
  name: string
  current_price: number | bigint
  current_stock: number
}

interface StockTxRow {
  id: string
  qty: number
  unit_price: number
  transaction_date: string
  note: string | null
  created_at: string
  product_id: { id: string; name: string }
}

export default async function SellInPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>
}) {
  const params = await searchParams
  const tab = params.tab === 'history' ? 'history' : 'input'
  const supabase = await createClient()

  const today = getTodayISO()

  // === Fetch products (for input tab) ===
  const { data: productsData } = await supabase
    .from('v_product_summary')
    .select('id, name, current_price, current_stock')
    .eq('is_active', true)
    .order('name')

  // === Fetch all sell-in transactions (for history tab) ===
  // Sell-in items are stored in stock_transactions with type='sell_in'
  // Join with products for product names
  const { data: sellInData } = await supabase
    .from('stock_transactions')
    .select(`
      id, qty, unit_price, transaction_date, note, created_at,
      product_id (id, name)
    `)
    .eq('type', 'sell_in')
    .eq('is_deleted', false)
    .order('transaction_date', { ascending: false })
    .order('created_at', { ascending: false })

  const products = (productsData as Product[]) || []
  const transactions = (sellInData as unknown as StockTxRow[]) || []

  return (
    <AppShell title="Sell In" showBackButton backHref="/dashboard">
      {/* Tabs UI */}
      <SellInTabs activeTab={tab} />

      {/* Tab content */}
      <div className="mt-4">
        {tab === 'input' ? (
          <SellInCart products={products} defaultDate={today} />
        ) : (
          <SellInHistory transactions={transactions} />
        )}
      </div>
    </AppShell>
  )
}
