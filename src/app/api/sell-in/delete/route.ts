import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// ============================================================
// POST /api/sell-in/delete
// Body: { ids: [UUID, UUID, ...] }  — list of stock_transactions IDs
//
// Behavior (Hard Delete + Stock Revert — Opsi A):
//   1. Delete from stock_transactions WHERE id IN (ids) AND type = 'sell_in'
//   2. This REVERTS the stock (sell_in additions removed → stock decreases)
//
// RLS policy required:
//   - stock_tx_delete_all_types (DELETE on stock_transactions for sell_in type)
// ============================================================

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { ids } = body

    // === Validation ===
    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: 'ids[] wajib diisi (array UUID stock_transactions)' },
        { status: 400 }
      )
    }

    // === Delete sell-in transactions ===
    // Filter by type='sell_in' for safety (prevent accidentally deleting other types)
    const { error: deleteError } = await supabase
      .from('stock_transactions')
      .delete()
      .in('id', ids)
      .eq('type', 'sell_in')

    if (deleteError) {
      console.error('Error deleting sell-in transactions:', deleteError)
      return NextResponse.json(
        { error: `Gagal hapus sell-in: ${deleteError.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      deleted_count: ids.length,
      message: `Berhasil hapus ${ids.length} record sell-in. Stock telah revert (berkurang).`,
    })
  } catch (err: any) {
    console.error('Sell-in delete API error:', err)
    return NextResponse.json(
      { error: err.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
