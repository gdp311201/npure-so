import { createClient } from '@/lib/supabase/server'
import AppShell from '@/components/layout/app-shell'
import SellOutCart from './sell-out-cart'

export default async function SellOutPage() {
  const supabase = await createClient()

  const jakartaDate = new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Jakarta' })
  const currentMonth = jakartaDate.slice(0, 7)

  // Parallel: fetch products + discount rate
  const [{ data: products }, { data: monthlyConfig }] = await Promise.all([
    supabase
      .from('v_product_summary')
      .select('id, name, current_price, current_stock')
      .eq('is_active', true)
      .order('name'),
    supabase
      .from('monthly_config')
      .select('discount_rate')
      .eq('period', currentMonth)
      .single(),
  ])

  const discountRate = monthlyConfig?.discount_rate || 0.25

  return (
    <AppShell title="Input Penjualan" showBackButton backHref="/transaksi">
      <SellOutCart
        products={products || []}
        discountRate={discountRate}
        defaultDate={jakartaDate}
      />
    </AppShell>
  )
}
