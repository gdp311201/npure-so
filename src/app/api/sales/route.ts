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
    const { transaction_date, items, discount_rate } = body

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Cart kosong' }, { status: 400 })
    }

    // Calculate totals
    const gross_amount = items.reduce(
      (sum: number, item: any) => sum + Number(item.price) * Number(item.qty),
      0
    )
    const discount_amount = Math.round(gross_amount * Number(discount_rate))
    const net_amount = gross_amount - discount_amount
    const total_qty = items.reduce(
      (sum: number, item: any) => sum + Number(item.qty),
      0
    )

    // Insert sale header
    const { data: sale, error: saleError } = await supabase
      .from('sales')
      .insert({
        transaction_date,
        total_qty,
        gross_amount,
        discount_rate,
        discount_amount,
        net_amount,
        created_by: user.id,
      })
      .select('id')
      .single()

    if (saleError || !sale) {
      return NextResponse.json(
        { error: saleError?.message || 'Gagal insert sale' },
        { status: 500 }
      )
    }

    // Insert stock_transactions
    const stockTxData = items.map((item: any) => ({
      product_id: item.product_id,
      type: 'sell_out',
      qty: Number(item.qty),
      transaction_date,
      sale_id: sale.id,
      unit_price: Number(item.price),
      created_by: user.id,
    }))

    const { error: txError } = await supabase
      .from('stock_transactions')
      .insert(stockTxData)

    if (txError) {
      // Rollback: delete the sale
      await supabase.from('sales').delete().eq('id', sale.id)
      return NextResponse.json({ error: txError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, sale_id: sale.id })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
