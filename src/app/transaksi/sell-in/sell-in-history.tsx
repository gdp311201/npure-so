'use client'

import { useState, useMemo } from 'react'
import { BULAN_LIST, getCurrentMonth, getCurrentYear, formatRupiah } from '@/lib/utils/format'

interface StockTxRow {
  id: string
  qty: number
  unit_price: number
  transaction_date: string
  note: string | null
  created_at: string
  product_id: { id: string; name: string }
}

interface Session {
  key: string
  transaction_date: string
  totalItems: number
  totalQty: number
  totalValue: number
  note: string | null
  rows: StockTxRow[]
  createdAtLabel: string
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

export default function SellInHistory({ transactions }: { transactions: StockTxRow[] }) {
  const currentMonth = getCurrentMonth()
  const currentYear = getCurrentYear()

  // === Local state (instant UI update after delete) ===
  const [localTx, setLocalTx] = useState(transactions)

  // === Filter state ===
  const [filterMonth, setFilterMonth] = useState<number | 'all'>(currentMonth)
  const [filterYear, setFilterYear] = useState<number>(currentYear)

  // === Delete state ===
  const [deleteTarget, setDeleteTarget] = useState<Session | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  // === Expand/collapse state ===
  const [expandedSessions, setExpandedSessions] = useState<Set<string>>(new Set())

  function toggleSession(key: string) {
    setExpandedSessions(prev => {
      const newSet = new Set(prev)
      if (newSet.has(key)) {
        newSet.delete(key)
      } else {
        newSet.add(key)
      }
      return newSet
    })
  }

  // === Available years ===
  const availableYears = useMemo(() => {
    const years = new Set<number>()
    localTx.forEach((t) => {
      const [y] = t.transaction_date.split('-').map(Number)
      years.add(y)
    })
    years.add(currentYear)
    return Array.from(years).sort((a, b) => b - a)
  }, [localTx, currentYear])

  // === Filter by month/year ===
  const filteredTx = useMemo(() => {
    return localTx.filter((t) => {
      const [y, m] = t.transaction_date.split('-').map(Number)
      const yearMatch = y === filterYear
      const monthMatch = filterMonth === 'all' || m === filterMonth
      return yearMatch && monthMatch
    })
  }, [localTx, filterMonth, filterYear])

  // === Group by created_at (truncated to minute) — same as opname ===
  const sessions = useMemo<Session[]>(() => {
    const sessionMap = new Map<string, StockTxRow[]>()

    filteredTx.forEach((row) => {
      // Truncate created_at to minute for session key
      const tsKey = row.created_at.slice(0, 16)
      const sessionKey = `${row.transaction_date}_${tsKey}`

      if (!sessionMap.has(sessionKey)) sessionMap.set(sessionKey, [])
      sessionMap.get(sessionKey)!.push(row)
    })

    const result: Session[] = []
    sessionMap.forEach((rows, key) => {
      const first = rows[0]
      const totalQty = rows.reduce((s, r) => s + r.qty, 0)
      const totalValue = rows.reduce((s, r) => s + (Number(r.unit_price) * r.qty), 0)
      result.push({
        key,
        transaction_date: first.transaction_date,
        totalItems: rows.length,
        totalQty,
        totalValue,
        note: first.note,
        rows: rows.sort((a, b) => a.product_id.name.localeCompare(b.product_id.name)),
        createdAtLabel: formatDateTime(first.created_at),
      })
    })

    // Sort by created_at desc
    result.sort((a, b) => b.rows[0].created_at.localeCompare(a.rows[0].created_at))
    return result
  }, [filteredTx])

  // === Delete handler ===
  async function handleDelete() {
    if (!deleteTarget) return
    console.log('[Delete SellIn] Step 1: handleDelete started')
    setDeleting(true)
    setDeleteError(null)
    try {
      const ids = deleteTarget.rows.map((r) => r.id)
      console.log('[Delete SellIn] Step 2: ids prepared', { count: ids.length })

      const controller = new AbortController()
      const timeoutId = setTimeout(() => {
        controller.abort()
        console.error('[Delete SellIn] FETCH TIMED OUT after 10s')
      }, 10000)

      console.log('[Delete SellIn] Step 3: calling fetch /api/sell-in/delete...')
      const response = await fetch('/api/sell-in/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids }),
        signal: controller.signal,
      })
      clearTimeout(timeoutId)
      console.log('[Delete SellIn] Step 4: fetch returned', response.status)

      const contentType = response.headers.get('content-type') || ''
      if (!contentType.includes('application/json')) {
        const text = await response.text()
        if (response.status === 404) {
          throw new Error('Endpoint /api/sell-in/delete tidak ditemukan (404)')
        }
        throw new Error(`Server error ${response.status}`)
      }

      const result = await response.json()
      console.log('[Delete SellIn] Step 5: response parsed', result)
      if (!response.ok) throw new Error(result.error || 'Gagal hapus sell-in')

      // === SUCCESS: update local state + reload ===
      console.log('[Delete SellIn] Step 6: success, updating UI + reloading...')
      const deletedIdSet = new Set(ids)
      setLocalTx(prev => prev.filter(t => !deletedIdSet.has(t.id)))
      setDeleteTarget(null)
      setDeleting(false)
      setTimeout(() => {
        window.location.reload()
      }, 300)
    } catch (err: any) {
      console.error('[Delete SellIn] ERROR:', err.name, err.message)
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
  if (localTx.length === 0) {
    return (
      <div className="glass-card rounded-2xl p-8 text-center">
        <div className="text-4xl mb-3 opacity-50">📥</div>
        <p className="text-sm font-bold text-pink-950">Belum ada history sell in</p>
        <p className="text-xs text-pink-900/60 mt-1">
          History akan muncul setelah Elsa simpan barang masuk pertama
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
          {sessions.length} sesi · {filteredTx.length} item
        </p>
      </div>

      {/* === Sessions list === */}
      {sessions.length === 0 ? (
        <div className="glass-card rounded-2xl p-6 text-center">
          <div className="text-3xl mb-2 opacity-50">🔍</div>
          <p className="text-xs font-bold text-pink-900/70">Tidak ada sell in pada periode ini</p>
          <p className="text-[10px] text-pink-900/50 mt-1">Coba ganti filter bulan/tahun</p>
        </div>
      ) : (
        sessions.map((session) => {
          const isExpanded = expandedSessions.has(session.key)
          return (
            <div key={session.key} className="glass-card rounded-2xl p-4">
              {/* === Compact header (always visible — click to expand/collapse) === */}
              <div
                className="flex items-center justify-between cursor-pointer"
                onClick={() => toggleSession(session.key)}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-pink-950">{formatDate(session.transaction_date)}</p>
                  <p className="text-[10px] text-pink-700/70 mt-0.5">
                    📥 {session.totalItems} item · {session.totalQty} pcs · <span className="font-bold text-emerald-600">{formatRupiah(session.totalValue)}</span>
                  </p>
                  <p className="text-[9px] text-pink-900/40 mt-0.5">{session.createdAtLabel}</p>
                </div>
                <span className="text-lg ml-2">{isExpanded ? '🔼' : '🔽'}</span>
              </div>

              {/* === Expanded content (only when expanded) === */}
              {isExpanded && (
                <div className="mt-3">
                  {/* Session stats */}
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <div className="glass-mini rounded-lg p-2 text-center">
                      <p className="text-[9px] font-bold uppercase text-pink-900/60">Total Qty</p>
                      <p className="text-sm font-bold text-pink-950 font-mono">{session.totalQty} pcs</p>
                    </div>
                    <div className="glass-mini rounded-lg p-2 text-center">
                      <p className="text-[9px] font-bold uppercase text-pink-900/60">Total Nilai (HET)</p>
                      <p className="text-sm font-bold text-emerald-500 font-mono">{formatRupiah(session.totalValue)}</p>
                    </div>
                  </div>

                  {/* Note (if any) */}
                  {session.note && (
                    <div className="glass-mini rounded-lg p-2 mb-3 text-[10px] text-pink-700/80 italic">
                      📝 {session.note}
                    </div>
                  )}

                  {/* Items detail */}
                  <div className="space-y-1 mb-3">
                    <p className="text-[10px] font-bold uppercase text-pink-900/60 mb-1">Detail Item:</p>
                    {session.rows.map((row) => (
                      <div
                        key={row.id}
                        className="glass-mini rounded-lg p-2 flex items-start justify-between text-[10px] gap-2"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-pink-950 leading-tight">{row.product_id.name}</p>
                          <p className="text-pink-900/60 font-mono mt-0.5">
                            {formatRupiah(Number(row.unit_price))} × {row.qty} pcs
                          </p>
                        </div>
                        <span className="font-bold font-mono whitespace-nowrap text-pink-950">
                          {formatRupiah(Number(row.unit_price) * row.qty)}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Delete button */}
                  <button
                    onClick={() => {
                      setDeleteTarget(session)
                      setDeleteError(null)
                    }}
                    className="w-full py-1.5 rounded-lg text-[10px] font-bold text-rose-600 bg-rose-50/60 border border-rose-200/60 hover:bg-rose-100/80 transition"
                  >
                    🗑 Hapus Sesi Ini
                  </button>
                </div>
              )}
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
            <h3 className="text-sm font-bold text-pink-950 mb-2">⚠️ Hapus Sesi Sell In?</h3>
            <div className="text-xs text-pink-900/70 space-y-1 mb-3">
              <p>📅 {formatDate(deleteTarget.transaction_date)}</p>
              <p>📥 {deleteTarget.totalItems} item · {deleteTarget.totalQty} pcs</p>
              <p>💰 Total Nilai: <span className="font-bold text-emerald-600">{formatRupiah(deleteTarget.totalValue)}</span></p>
              {deleteTarget.note && (
                <p>📝 {deleteTarget.note}</p>
              )}
              <p className="text-[10px] text-pink-900/50">Disimpan: {deleteTarget.createdAtLabel}</p>
            </div>
            <div className="glass-mini rounded-lg p-2 mb-3 text-[10px] text-amber-700 bg-amber-50/80 border border-amber-200/60 leading-relaxed">
              ⚠️ <strong>Konsekuensi (Hard Delete + Stock Revert):</strong>
              <br />• Stock transactions dihapus permanen
              <br />• <strong>Stock akan BERKURANG</strong> (revert sell-in addition)
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
