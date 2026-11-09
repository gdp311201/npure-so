'use client'

import { useState, useMemo } from 'react'
import { BULAN_LIST, getCurrentMonth, getCurrentYear, formatRupiah } from '@/lib/utils/format'

interface StockTxItem {
  id: string
  qty: number
  unit_price: number
  product_id: { id: string; name: string }
}

interface Sale {
  id: string
  transaction_date: string
  total_qty: number
  gross_amount: number
  discount_rate: number
  discount_amount: number
  net_amount: number
  note: string | null
  created_at: string
  stock_transactions: StockTxItem[]
}

const BULAN_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agt', 'Sep', 'Okt', 'Nov', 'Des']

function formatDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  return `${d} ${BULAN_SHORT[m - 1]} ${y}`
}

function formatDateTime(iso: string): string {
  const dt = new Date(iso)
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Jakarta',
    day: '2-digit',
    month: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(dt)

  const get = (type: string) => parts.find((p) => p.type === type)?.value || ''
  const day = get('day')
  const monthNum = parseInt(get('month')) - 1
  const year = get('year')
  let hour = get('hour')
  if (hour === '24') hour = '00'
  const minute = get('minute')

  return `${day} ${BULAN_SHORT[monthNum]} ${year} · ${hour}:${minute}`
}

export default function SellOutHistory({ sales }: { sales: Sale[] }) {
  const currentMonth = getCurrentMonth()
  const currentYear = getCurrentYear()

  // === Local sales state (instant UI update after delete) ===
  const [localSales, setLocalSales] = useState(sales)

  // === Filter state ===
  const [filterMonth, setFilterMonth] = useState<number | 'all'>(currentMonth)
  const [filterYear, setFilterYear] = useState<number>(currentYear)

  // === Delete state ===
  const [deleteTarget, setDeleteTarget] = useState<Sale | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  // === Available years ===
  const availableYears = useMemo(() => {
    const years = new Set<number>()
    localSales.forEach((s) => {
      const [y] = s.transaction_date.split('-').map(Number)
      years.add(y)
    })
    years.add(currentYear)
    return Array.from(years).sort((a, b) => b - a)
  }, [localSales, currentYear])

  // === Filter sales by month/year ===
  const filteredSales = useMemo(() => {
    return localSales.filter((s) => {
      const [y, m] = s.transaction_date.split('-').map(Number)
      const yearMatch = y === filterYear
      const monthMatch = filterMonth === 'all' || m === filterMonth
      return yearMatch && monthMatch
    })
  }, [localSales, filterMonth, filterYear])

  // === Delete handler ===
  async function handleDelete() {
    if (!deleteTarget) return
    console.log('[Delete SellOut] Step 1: handleDelete started')
    setDeleting(true)
    setDeleteError(null)
    try {
      const saleId = deleteTarget.id
      console.log('[Delete SellOut] Step 2: saleId prepared', { saleId })

      const controller = new AbortController()
      const timeoutId = setTimeout(() => {
        controller.abort()
        console.error('[Delete SellOut] FETCH TIMED OUT after 10s')
      }, 10000)

      console.log('[Delete SellOut] Step 3: calling fetch /api/sell-out/delete...')
      const response = await fetch('/api/sell-out/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ saleId }),
        signal: controller.signal,
      })
      clearTimeout(timeoutId)
      console.log('[Delete SellOut] Step 4: fetch returned', response.status)

      const contentType = response.headers.get('content-type') || ''
      if (!contentType.includes('application/json')) {
        const text = await response.text()
        if (response.status === 404) {
          throw new Error('Endpoint /api/sell-out/delete tidak ditemukan (404)')
        }
        throw new Error(`Server error ${response.status}`)
      }

      const result = await response.json()
      console.log('[Delete SellOut] Step 5: response parsed', result)
      if (!response.ok) throw new Error(result.error || 'Gagal hapus sale')

      // === SUCCESS: update local state + reload ===
      console.log('[Delete SellOut] Step 6: success, updating UI + reloading...')
      setLocalSales(prev => prev.filter(s => s.id !== saleId))
      setDeleteTarget(null)
      setDeleting(false)
      setTimeout(() => {
        window.location.reload()
      }, 300)
    } catch (err: any) {
      console.error('[Delete SellOut] ERROR:', err.name, err.message)
      if (err.name === 'AbortError') {
        setDeleteError('FETCH TIMEOUT (10s) — coba unregister Service Worker di DevTools')
      } else {
        setDeleteError(err.message)
      }
    } finally {
      setDeleting(false)
    }
  }

  // === Empty state ===
  if (localSales.length === 0) {
    return (
      <div className="glass-card rounded-2xl p-8 text-center">
        <div className="text-4xl mb-3 opacity-50">🛒</div>
        <p className="text-sm font-bold text-pink-950">Belum ada history sell out</p>
        <p className="text-xs text-pink-900/60 mt-1">
          History akan muncul setelah Elsa simpan transaksi sell out pertama
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* === Filter Card === */}
      <div className="glass-card rounded-xl p-3">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-[10px] font-bold uppercase text-pink-900/70 mb-1">Bulan</label>
            <select
              value={filterMonth === 'all' ? 'all' : String(filterMonth)}
              onChange={(e) => setFilterMonth(e.target.value === 'all' ? 'all' : Number(e.target.value))}
              className="custom-input w-full rounded-lg py-2 px-3 text-sm font-semibold"
            >
              <option value="all">📅 Semua Bulan</option>
              {BULAN_LIST.map((b, i) => (
                <option key={b} value={i + 1}>{b}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase text-pink-900/70 mb-1">Tahun</label>
            <select
              value={String(filterYear)}
              onChange={(e) => setFilterYear(Number(e.target.value))}
              className="custom-input w-full rounded-lg py-2 px-3 text-sm font-semibold"
            >
              {availableYears.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* === Summary count === */}
      <div className="glass-mini rounded-xl p-3 text-center">
        <p className="text-[10px] font-bold uppercase text-pink-900/60">Filter Result</p>
        <p className="text-sm font-bold text-pink-950">
          {filteredSales.length} transaksi
        </p>
      </div>

      {/* === Sales list === */}
      {filteredSales.length === 0 ? (
        <div className="glass-card rounded-2xl p-6 text-center">
          <div className="text-3xl mb-2 opacity-50">🔍</div>
          <p className="text-xs font-bold text-pink-900/70">Tidak ada sell out pada periode ini</p>
          <p className="text-[10px] text-pink-900/50 mt-1">Coba ganti filter bulan/tahun</p>
        </div>
      ) : (
        filteredSales.map((sale) => {
          // Items come from stock_transactions (type='sell_out', linked via sale_id)
          const items = sale.stock_transactions || []
          const totalQty = sale.total_qty || items.reduce((s, item) => s + item.qty, 0)
          const grossAmount = Number(sale.gross_amount || 0)
          const discountAmount = Number(sale.discount_amount || 0)
          const netAmount = Number(sale.net_amount || 0)
          const discountRate = Number(sale.discount_rate || 0)

          return (
            <div key={sale.id} className="glass-card rounded-2xl p-4">
              {/* === Sale header === */}
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-sm font-bold text-pink-950">{formatDate(sale.transaction_date)}</p>
                  <p className="text-[10px] font-bold uppercase text-pink-700 mt-0.5">🛒 Sell Out</p>
                  <p className="text-[9px] text-pink-900/50 mt-0.5">{formatDateTime(sale.created_at)}</p>
                </div>
                <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-emerald-100/80 text-emerald-700">
                  {items.length} item · {totalQty} pcs
                </span>
              </div>

              {/* === Sale summary stats === */}
              <div className="grid grid-cols-3 gap-2 mb-3">
                <div className="glass-mini rounded-lg p-2 text-center">
                  <p className="text-[9px] font-bold uppercase text-pink-900/60">Subtotal</p>
                  <p className="text-xs font-bold text-pink-950 font-mono">{formatRupiah(grossAmount)}</p>
                </div>
                <div className="glass-mini rounded-lg p-2 text-center">
                  <p className="text-[9px] font-bold uppercase text-pink-900/60">Diskon ({(discountRate * 100).toFixed(0)}%)</p>
                  <p className="text-xs font-bold text-rose-500 font-mono">-{formatRupiah(discountAmount)}</p>
                </div>
                <div className="glass-mini rounded-lg p-2 text-center">
                  <p className="text-[9px] font-bold uppercase text-pink-900/60">Total</p>
                  <p className="text-xs font-black text-emerald-500 font-mono">{formatRupiah(netAmount)}</p>
                </div>
              </div>

              {/* === Items detail === */}
              <div className="space-y-1 mb-3">
                <p className="text-[10px] font-bold uppercase text-pink-900/60 mb-1">Detail Item:</p>
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="glass-mini rounded-lg p-2 flex items-start justify-between text-[10px] gap-2"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-pink-950 leading-tight">{item.product_id.name}</p>
                      <p className="text-pink-900/60 font-mono mt-0.5">
                        {formatRupiah(Number(item.unit_price))} × {item.qty} pcs
                      </p>
                    </div>
                    <span className="font-bold font-mono whitespace-nowrap text-pink-950">
                      {formatRupiah(Number(item.unit_price) * item.qty)}
                    </span>
                  </div>
                ))}
              </div>

              {/* === Footer: delete button === */}
              <button
                onClick={() => {
                  setDeleteTarget(sale)
                  setDeleteError(null)
                }}
                className="w-full py-1.5 rounded-lg text-[10px] font-bold text-rose-600 bg-rose-50/60 border border-rose-200/60 hover:bg-rose-100/80 transition"
              >
                🗑 Hapus Transaksi Ini
              </button>
            </div>
          )
        })
      )}

      {/* === Delete Confirmation Modal === */}
      {deleteTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={() => !deleting && setDeleteTarget(null)}
        >
          <div
            className="glass-card rounded-2xl p-4 max-w-sm w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-sm font-bold text-pink-950 mb-2">⚠️ Hapus Transaksi Sell Out?</h3>
            <div className="text-xs text-pink-900/70 space-y-1 mb-3">
              <p>📅 {formatDate(deleteTarget.transaction_date)}</p>
              <p>🛒 {(deleteTarget.stock_transactions || []).length} item · {deleteTarget.total_qty} pcs</p>
              <p>💰 Total: <span className="font-bold text-emerald-600">{formatRupiah(Number(deleteTarget.net_amount || 0))}</span></p>
              <p className="text-[10px] text-pink-900/50">Disimpan: {formatDateTime(deleteTarget.created_at)}</p>
            </div>
            <div className="glass-mini rounded-lg p-2 mb-3 text-[10px] text-amber-700 bg-amber-50/80 border border-amber-200/60 leading-relaxed">
              ⚠️ <strong>Konsekuensi (Hard Delete + Stock Revert):</strong>
              <br />• Record sale dihapus permanen
              <br />• Stock transactions (items) juga dihapus (cascade)
              <br />• <strong>Stock akan BERTAMBAH</strong> (revert sell-out deduction)
              <br />• Untuk revisi: hapus transaksi ini, lalu input ulang di tab Input
            </div>
            {deleteError && (
              <div className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg p-2 mb-2">
                ❌ {deleteError}
              </div>
            )}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
                className="py-2.5 rounded-lg text-xs font-bold glass-mini text-pink-950 disabled:opacity-50"
              >
                Batal
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="py-2.5 rounded-lg text-xs font-bold bg-gradient-to-r from-rose-400 to-rose-500 text-white disabled:opacity-50"
              >
                {deleting ? '⏳ Menghapus...' : '🗑 Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
