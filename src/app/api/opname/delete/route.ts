import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// ============================================================
// POST /api/opname/delete
// Body: { ids: [UUID, UUID, ...] }  — list of stock_opname IDs in a session
//
// Behavior (Opsi A — Revert Stock):
//   1. Delete all stock_transactions where opname_id IN (ids)
//      → This REVERTS the stock adjustments (stock returns to pre-opname state)
//   2. Delete all stock_opname rows where id IN (ids)
//      → Removes the opname audit records
//
// Use case: Trial cleanup, or correcting a mistakenly-saved opname.
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
        { error: 'ids[] wajib diisi (array UUID opname)' },
        { status: 400 }
      )
    }

    // === Step 1: Delete adjustment transactions linked to these opnames ===
    // This reverts the stock to pre-opname state
    const { error: txError } = await supabase
      .from('stock_transactions')
      .delete()
      .in('opname_id', ids)

    if (txError) {
      console.error('Error deleting adjustments:', txError)
      return NextResponse.json(
        { error: `Gagal hapus adjustment transaction: ${txError.message}` },
        { status: 500 }
      )
    }

    // === Step 2: Delete opname records ===
    const { error: opnameError } = await supabase
      .from('stock_opname')
      .delete()
      .in('id', ids)

    if (opnameError) {
      console.error('Error deleting opname:', opnameError)
      return NextResponse.json(
        { error: `Gagal hapus opname: ${opnameError.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      deleted_opname_count: ids.length,
      message: `Berhasil hapus ${ids.length} record opname + adjustment terkait. Stock revert ke pre-opname state.`,
    })
  } catch (err: any) {
    console.error('Opname delete API error:', err)
    return NextResponse.json(
      { error: err.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
