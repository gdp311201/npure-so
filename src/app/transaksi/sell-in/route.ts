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
    const { transaction_date, items, note } = body

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Cart kosong' }, { status: 400 })
    }

    // Insert stock_transactions directly (no sales table for sell-in)
    const stockTxData = items.map((item: any) => ({
      product_id: item.product_id,
      type: 'sell_in',
      qty: Number(item.qty),
      transaction_date,
      unit_price: Number(item.price),
      note: note || null,
      created_by: user.id,
    }))

    const { data: inserted, error: txError } = await supabase
      .from('stock_transactions')
      .insert(stockTxData)
      .select('id')

    if (txError) {
      return NextResponse.json({ error: txError.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      count: inserted?.length || 0,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
