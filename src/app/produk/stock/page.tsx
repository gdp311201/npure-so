import { createClient } from '@/lib/supabase/server'
import AppShell from '@/components/layout/app-shell'
import StockView from './stock-view'

export default async function StockPage() {
  const supabase = await createClient()

  const { data: products } = await supabase
    .from('v_product_summary')
    .select('id, name, current_stock, stock_status, low_stock_threshold')
    .eq('is_active', true)
    .order('name')

  return (
    <AppShell title="Stock Overview" showBackButton backHref="/produk">
      <StockView products={products || []} />
    </AppShell>
  )
}
