import { createClient } from '@/lib/supabase/server'
import AppShell from '@/components/layout/app-shell'
import { getTodayISO } from '@/lib/utils/format'
import OpnameTabs from './opname-tabs'
import InputOpname from './input-opname'
import HistoryOpname from './history-opname'

// Force dynamic rendering — ensures Supabase queries always return fresh data
// Critical for History tab: after delete, page reload must show updated data
export const dynamic = 'force-dynamic'
export const revalidate = 0

interface Product {
  id: string
  name: string
  current_stock: number
}

interface OpnameRow {
  id: string
  opname_date: string
  opname_type: string
  physical_count: number
  system_count: number
  difference: number
  reason: string | null
  note: string | null
  created_at: string
  product_id: { id: string; name: string }
}

export default async function OpnamePage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>
}) {
  const params = await searchParams
  const tab = params.tab === 'history' ? 'history' : 'input'
  const supabase = await createClient()

  // Fetch products (for input tab) — active only, ordered by name
  const { data: productsData } = await supabase
    .from('v_product_summary')
    .select('id, name, current_stock')
    .eq('is_active', true)
    .order('name')

  // Fetch all past opnames (for history tab) — join product name
  const { data: opnamesData } = await supabase
    .from('stock_opname')
    .select(`
      id, opname_date, opname_type, physical_count, system_count,
      difference, reason, note, created_at,
      product_id (id, name)
    `)
    .order('opname_date', { ascending: false })
    .order('created_at', { ascending: false })

  const products = (productsData as Product[]) || []
  const opnames = (opnamesData as unknown as OpnameRow[]) || []
  const today = getTodayISO()

  return (
    <AppShell title="Stock Opname" showBackButton backHref="/dashboard">
      {/* Tabs UI */}
      <OpnameTabs activeTab={tab} />

      {/* Tab content */}
      <div className="mt-4">
        {tab === 'input' ? (
          <InputOpname products={products} defaultDate={today} />
        ) : (
          <HistoryOpname opnames={opnames} />
        )}
      </div>
    </AppShell>
  )
}
