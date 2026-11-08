import { createClient } from '@/lib/supabase/server'
import AppShell from '@/components/layout/app-shell'
import SellInCart from './sell-in-cart'

export default async function SellInPage() {
  const supabase = await createClient()

  const jakartaDate = new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Jakarta' })

  const { data: products } = await supabase
    .from('v_product_summary')
    .select('id, name, current_price, current_stock')
    .eq('is_active', true)
    .order('name')

  return (
    <AppShell title="Barang Masuk">
      <SellInCart products={products || []} defaultDate={jakartaDate} />
    </AppShell>
  )
}
