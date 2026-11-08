'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { BULAN_LIST, getCurrentMonth, getCurrentYear, getTahunListDynamic } from '@/lib/utils/format'
import * as XLSX from 'xlsx'

export default function ExportForm() {
  const [month, setMonth] = useState(getCurrentMonth())
  const [year, setYear] = useState(getCurrentYear())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  async function handleExport() {
    setLoading(true)
    setError(null)
    setSuccess(null)
    try {
      const supabase = createClient()
      const dateFrom = `${year}-${String(month).padStart(2, '0')}-01`
      const lastDay = new Date(year, month, 0).getDate()
      const dateTo = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`

      const [{ data: transactions }, { data: sales }, { data: products }] = await Promise.all([
        supabase.from('stock_transactions').select('product_id, type, qty, unit_price, transaction_date, note').eq('is_deleted', false).gte('transaction_date', dateFrom).lte('transaction_date', dateTo).order('transaction_date'),
        supabase.from('sales').select('transaction_date, total_qty, gross_amount, discount_amount, net_amount').gte('transaction_date', dateFrom).lte('transaction_date', dateTo).order('transaction_date'),
        supabase.from('products').select('id, name'),
      ])

      const productMap = new Map(products?.map((p) => [p.id, p.name]) || [])

      const txData = (transactions || []).map((tx) => ({
        'Tanggal': tx.transaction_date,
        'Tipe': tx.type === 'sell_out' ? 'Penjualan' : tx.type === 'sell_in' ? 'Barang Masuk' : tx.type === 'initial_stock' ? 'Stok Awal' : 'Adjustment',
        'Produk': productMap.get(tx.product_id) || 'Unknown',
        'Qty': tx.qty,
        'Harga Satuan': Number(tx.unit_price || 0),
        'Subtotal': Number(tx.unit_price || 0) * tx.qty,
        'Catatan': tx.note || '',
      }))

      const salesData = (sales || []).map((sale) => ({
        'Tanggal': sale.transaction_date,
        'Total Qty': sale.total_qty,
        'Gross Omset': Number(sale.gross_amount),
        'Diskon': Number(sale.discount_amount),
        'Net Omset': Number(sale.net_amount),
      }))

      const wb = XLSX.utils.book_new()

      if (txData.length > 0) {
        const ws1 = XLSX.utils.json_to_sheet(txData)
        ws1['!cols'] = [{ wch: 12 }, { wch: 15 }, { wch: 40 }, { wch: 8 }, { wch: 15 }, { wch: 15 }, { wch: 25 }]
        XLSX.utils.book_append_sheet(wb, ws1, 'Transaksi')
      }

      if (salesData.length > 0) {
        const ws2 = XLSX.utils.json_to_sheet(salesData)
        ws2['!cols'] = [{ wch: 12 }, { wch: 10 }, { wch: 18 }, { wch: 15 }, { wch: 18 }]
        XLSX.utils.book_append_sheet(wb, ws2, 'Penjualan')
      }

      if (wb.SheetNames.length === 0) {
        setError('Tidak ada data transaksi pada periode ini')
        return
      }

      const fileName = `NPURE_SO_Export_${BULAN_LIST[month - 1]}_${year}.xlsx`
      XLSX.writeFile(wb, fileName)
      setSuccess(`File ${fileName} berhasil di-download (${txData.length} transaksi, ${salesData.length} penjualan)`)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="glass-card rounded-2xl p-4 space-y-3">
        <h3 className="text-xs font-bold uppercase text-pink-900/70">📤 Export Excel</h3>
        <p className="text-[10px] text-pink-800/60">
          Download semua transaksi dan penjualan dalam format Excel (.xlsx).
          File berisi 2 sheet: Transaksi (detail per item) + Penjualan (summary per sale).
        </p>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-[10px] font-bold uppercase text-pink-900/70 mb-1">Bulan</label>
            <select
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
              className="custom-input w-full rounded-lg py-2 px-3 text-sm font-semibold"
            >
              {BULAN_LIST.map((b, i) => <option key={b} value={i + 1}>{b}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase text-pink-900/70 mb-1">Tahun</label>
            <select
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="custom-input w-full rounded-lg py-2 px-3 text-sm font-semibold"
            >
              {getTahunListDynamic().map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        </div>

        {error && (
          <div className="text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 rounded-lg py-2 px-3">❌ {error}</div>
        )}
        {success && (
          <div className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg py-2 px-3">✅ {success}</div>
        )}

        <button
          onClick={handleExport}
          disabled={loading}
          className="w-full bg-gradient-to-r from-pink-400 to-rose-400 hover:from-pink-500 hover:to-rose-500 disabled:opacity-50 text-white font-bold py-3 px-4 rounded-xl text-sm transition shadow-sm"
        >
          {loading ? '⏳ Menyiapkan...' : `📥 Download Excel (${BULAN_LIST[month - 1]} ${year})`}
        </button>
      </div>

      <div className="glass-mini rounded-xl p-3">
        <h4 className="text-[10px] font-bold uppercase text-pink-900/70 mb-2">📋 Isi File Excel</h4>
        <div className="space-y-1.5 text-[10px] text-pink-800/70">
          <div className="flex items-start gap-2"><span>📄</span><span><b>Sheet "Transaksi"</b> — semua stock movements dengan tanggal, produk, qty, harga, subtotal</span></div>
          <div className="flex items-start gap-2"><span>📄</span><span><b>Sheet "Penjualan"</b> — summary per sale event dengan qty, gross, diskon, net omset</span></div>
        </div>
      </div>
    </div>
  )
}
