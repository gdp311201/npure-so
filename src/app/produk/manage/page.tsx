import { createClient } from '@/lib/supabase/server'
import AppShell from '@/components/layout/app-shell'
import ProdukManager from './produk-manager'

export default async function ManageProdukPage() {
  const supabase = await createClient()

  const { data: products } = await supabase
    .from('v_product_summary')
    .select('id, name, is_active, current_price, current_stock, stock_status, low_stock_threshold')
    .order('name')

  return (
    <AppShell title="Manage Produk" showBackButton backHref="/produk">
      <ProdukManager products={products || []} />
    </AppShell>
  )
}
