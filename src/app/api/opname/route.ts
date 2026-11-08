import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { opname_date, opname_type, items } = body

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Tidak ada produk dihitung' }, { status: 400 })
    }

    // Prepare stock_opname records (all counted items)
    const opnameRecords = items.map((item: any) => ({
      opname_date,
      opname_type,
      product_id: item.product_id,
      physical_count: Number(item.physical_count),
      system_count: Number(item.system_count),
      difference: Number(item.physical_count) - Number(item.system_count),
      reason: item.reason || null,
      created_by: user.id,
    }))

    // Insert all stock_opname records
    const { data: opnameInserted, error: opnameError } = await supabase
      .from('stock_opname')
      .insert(opnameRecords)
      .select('id, product_id, difference')

    if (opnameError) {
      return NextResponse.json({ error: opnameError.message }, { status: 500 })
    }

    // Create adjustment transactions for items with difference ≠ 0
    const adjustments = (opnameInserted || [])
      .filter((op: any) => op.difference !== 0)
      .map((op: any) => ({
        product_id: op.product_id,
        type: 'adjustment' as const,
        qty: op.difference, // can be negative
        transaction_date: opname_date,
        opname_id: op.id,
        note: `Stock opname adjustment (${opname_type})`,
        created_by: user.id,
      }))

    if (adjustments.length > 0) {
      const { error: adjError } = await supabase
        .from('stock_transactions')
        .insert(adjustments)

      if (adjError) {
        return NextResponse.json({
          success: true,
          warning: 'Opname tersimpan, tapi adjustment gagal dibuat',
          opname_count: opnameInserted?.length || 0,
          adjustment_error: adjError.message,
        })
      }
    }

    return NextResponse.json({
      success: true,
      opname_count: opnameInserted?.length || 0,
      adjustment_count: adjustments.length,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
