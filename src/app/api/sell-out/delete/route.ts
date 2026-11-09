import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// ============================================================
// POST /api/sell-out/delete
// Body: { saleId: UUID }
//
// Behavior (Hard Delete + Stock Revert — Opsi A):
//   1. Delete from sales WHERE id = saleId
//   2. sale_items cascade delete (ON DELETE CASCADE FK)
//   3. stock_transactions cascade delete (ON DELETE CASCADE FK)
//      → This REVERTS the stock (sell_out deductions removed)
//
// RLS policies required:
//   - sales_delete_all (DELETE on sales)
//   - sale_items_delete_all (DELETE on sale_items for cascade)
//   - stock_tx_delete_all_types (DELETE on stock_transactions for sell_out)
// ============================================================

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { saleId } = body

    // === Validation ===
    if (!saleId) {
      return NextResponse.json(
        { error: 'saleId wajib diisi (UUID)' },
        { status: 400 }
      )
    }

    // === Delete sale (cascade handles sale_items + stock_transactions) ===
    const { error: saleError } = await supabase
      .from('sales')
      .delete()
      .eq('id', saleId)

    if (saleError) {
      console.error('Error deleting sale:', saleError)
      return NextResponse.json(
        { error: `Gagal hapus sale: ${saleError.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      deleted_sale_id: saleId,
      message: 'Sale berhasil dihapus. Stock telah revert ke pre-sale state.',
    })
  } catch (err: any) {
    console.error('Sell-out delete API error:', err)
    return NextResponse.json(
      { error: err.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
