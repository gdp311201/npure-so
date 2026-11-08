import { createClient } from '@/lib/supabase/server'
import AppShell from '@/components/layout/app-shell'
import OpnameForm from './opname-form'

export default async function OpnamePage() {
  const supabase = await createClient()

  const jakartaDate = new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Jakarta' })

  const { data: products } = await supabase
    .from('v_product_summary')
    .select('id, name, current_stock')
    .eq('is_active', true)
    .order('name')

  return (
    <AppShell title="Stock Opname">
      <OpnameForm products={products || []} defaultDate={jakartaDate} />
    </AppShell>
  )
}
