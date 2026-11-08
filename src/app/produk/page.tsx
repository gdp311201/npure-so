import { createClient } from '@/lib/supabase/server'
import AppShell from '@/components/layout/app-shell'
import ProdukManager from './produk-manager'

export default async function ProdukPage() {
  const supabase = await createClient()

  const { data: products } = await supabase
    .from('v_product_summary')
    .select('id, name, is_active, current_price, current_stock, stock_status, low_stock_threshold')
    .order('name')

  return (
    <AppShell title="Produk">
      <ProdukManager products={products || []} />
    </AppShell>
  )
}
