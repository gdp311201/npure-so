'use client'

import { useState, useMemo } from 'react'
import { BULAN_LIST, getCurrentMonth, getCurrentYear } from '@/lib/utils/format'

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

interface Session {
  key: string
  opname_date: string
  opname_type: string
  totalProducts: number
  mismatchCount: number
  matchCount: number
  totalAdjustment: number
  rows: OpnameRow[]
  createdAtLabel: string
}

const BULAN_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agt', 'Sep', 'Okt', 'Nov', 'Des']

function formatDate(iso: string): string {
  // Date-only string — no timezone ambiguity (YYYY-MM-DD)
  const [y, m, d] = iso.split('-').map(Number)
  return `${d} ${BULAN_SHORT[m - 1]} ${y}`
}

function formatDateTime(iso: string): string {
  // Use Intl.DateTimeFormat with explicit timezone to ensure
  // CONSISTENT output between server (Vercel UTC) and client (Jakarta)
  // Without this, hydration mismatch occurs (React error #418)
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
  if (hour === '24') hour = '00' // Intl can return 24 for midnight
  const minute = get('minute')

  return `${day} ${BULAN_SHORT[monthNum]} ${year} · ${hour}:${minute}`
}

export default function HistoryOpname({ opnames }: { opnames: OpnameRow[] }) {
  const currentMonth = getCurrentMonth()
  const currentYear = getCurrentYear()

  // === Local opnames state — allows instant UI update after delete ===
  // Without this, we'd need page reload (which may serve cached HTML)
  const [localOpnames, setLocalOpnames] = useState(opnames)

  // === Filter state (default: current month + current year) ===
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

  // === Available years from data (timezone-independent — parse date string) ===
  const availableYears = useMemo(() => {
    const years = new Set<number>()
    localOpnames.forEach((o) => {
      // Parse "YYYY-MM-DD" manually — no new Date() to avoid timezone issues
      const [y] = o.opname_date.split('-').map(Number)
      years.add(y)
    })
    years.add(currentYear)
    return Array.from(years).sort((a, b) => b - a) // descending
  }, [localOpnames, currentYear])

  // === Filter opnames by month/year (timezone-independent — parse date string manually) ===
  const filteredOpnames = useMemo(() => {
    return localOpnames.filter((o) => {
      // opname_date is "YYYY-MM-DD" — parse manually to avoid timezone issues
      const [y, m] = o.opname_date.split('-').map(Number)
      const yearMatch = y === filterYear
      const monthMatch = filterMonth === 'all' || m === filterMonth
      return yearMatch && monthMatch
    })
  }, [opnames, filterMonth, filterYear])

  // === Group by raw created_at ISO string (timezone-independent) ===
  // All rows in one submit share the same created_at from Supabase NOW()
  // Truncate to minute for safety (handles any ms variance)
  const sessions = useMemo<Session[]>(() => {
    const sessionMap = new Map<string, OpnameRow[]>()

    filteredOpnames.forEach((row) => {
      // Use raw ISO string — no new Date() parsing → no timezone ambiguity
      // "2026-11-09T11:18:45.123Z" → "2026-11-09T11:18" (truncate to minute)
      const tsKey = row.created_at.slice(0, 16)
      const sessionKey = `${row.opname_date}_${row.opname_type}_${tsKey}`

      if (!sessionMap.has(sessionKey)) sessionMap.set(sessionKey, [])
      sessionMap.get(sessionKey)!.push(row)
    })

    const result: Session[] = []
    sessionMap.forEach((rows, key) => {
      const first = rows[0]
      const mismatchCount = rows.filter((r) => r.difference !== 0).length
      const matchCount = rows.length - mismatchCount
      const totalAdjustment = rows.reduce((s, r) => s + r.difference, 0)
      result.push({
        key,
        opname_date: first.opname_date,
        opname_type: first.opname_type,
        totalProducts: rows.length,
        mismatchCount,
        matchCount,
        totalAdjustment,
        rows: rows.sort((a, b) => a.product_id.name.localeCompare(b.product_id.name)),
        createdAtLabel: formatDateTime(first.created_at),
      })
    })

    // Sort sessions by created_at desc (most recent first)
    result.sort((a, b) => b.rows[0].created_at.localeCompare(a.rows[0].created_at))
    return result
  }, [filteredOpnames])

  // === Delete handler ===
  async function handleDelete() {
    if (!deleteTarget) return
    console.log('[Delete Opname] Step 1: handleDelete started, deleteTarget set')
    setDeleting(true)
    setDeleteError(null)
    try {
      const ids = deleteTarget.rows.map((r) => r.id)
      console.log('[Delete Opname] Step 2: ids prepared', { count: ids.length, firstId: ids[0] })

      // === AbortController with 10s timeout ===
      // Detects if Service Worker is blocking the fetch (fetch hangs forever)
      const controller = new AbortController()
      const timeoutId = setTimeout(() => {
        controller.abort()
        console.error('[Delete Opname] FETCH TIMED OUT after 10s — Service Worker is likely blocking the request')
      }, 10000)

      console.log('[Delete Opname] Step 3: calling fetch /api/opname/delete...')
      const response = await fetch('/api/opname/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids }),
        signal: controller.signal,
      })
      clearTimeout(timeoutId)
      console.log('[Delete Opname] Step 4: fetch returned', response.status, response.statusText)

      // Handle non-JSON responses (e.g., 404 HTML page if endpoint missing)
      const contentType = response.headers.get('content-type') || ''
      if (!contentType.includes('application/json')) {
        const text = await response.text()
        console.error('[Delete Opname] Non-JSON response:', text.substring(0, 200))
        if (response.status === 404) {
          throw new Error('Endpoint /api/opname/delete tidak ditemukan (404). Cek file di src/app/api/opname/delete/route.ts')
        }
        throw new Error(`Server error ${response.status}: ${text.substring(0, 80)}...`)
      }

      const result = await response.json()
      console.log('[Delete Opname] Step 5: response parsed', result)
      if (!response.ok) throw new Error(result.error || 'Gagal hapus sesi opname')

      // === SUCCESS: update local state + reload page ===
      // 1. Local state update → instant UI feedback (sesi disappears immediately)
      // 2. window.location.reload() → guaranteed fresh data from server
      //    (with RLS fixed + force-dynamic, reload shows correct data)
      console.log('[Delete Opname] Step 6: success, updating UI + reloading page...')
      const deletedIdSet = new Set(ids)
      setLocalOpnames(prev => prev.filter(o => !deletedIdSet.has(o.id)))
      setDeleteTarget(null)
      setDeleting(false)
      // Reload after 300ms — lets React update UI first, then fetch fresh data
      setTimeout(() => {
        window.location.reload()
      }, 300)
    } catch (err: any) {
      console.error('[Delete Opname] ERROR caught:', err.name, err.message)
      if (err.name === 'AbortError') {
        setDeleteError(
          'FETCH TIMEOUT (10s) — Service Worker kemungkinan memblokir request. ' +
          'SOLUSI: Buka DevTools (F12) → tab Application → Service Workers → klik "Unregister" di semua SW → hard refresh (Ctrl+Shift+R) → coba lagi.'
        )
      } else {
        setDeleteError(err.message)
      }
    } finally {
      setDeleting(false)
    }
  }

  // === Empty state ===
  if (localOpnames.length === 0) {
    return (
      <div className="glass-card rounded-2xl p-8 text-center">
        <div className="text-4xl mb-3 opacity-50">📚</div>
        <p className="text-sm font-bold text-pink-950">Belum ada history opname</p>
        <p className="text-xs text-pink-900/60 mt-1">
          History akan muncul setelah Elsa simpan opname pertama
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
          {sessions.length} sesi · {filteredOpnames.length} produk tercatat
        </p>
      </div>

      {/* === Sessions list === */}
      {sessions.length === 0 ? (
        <div className="glass-card rounded-2xl p-6 text-center">
          <div className="text-3xl mb-2 opacity-50">🔍</div>
          <p className="text-xs font-bold text-pink-900/70">Tidak ada opname pada periode ini</p>
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
                  <p className="text-sm font-bold text-pink-950">{formatDate(session.opname_date)}</p>
                  <p className="text-[10px] text-pink-700/70 mt-0.5">
                    {session.opname_type === 'bulanan' ? '📅 Bulanan' : '🎉 Event'} · {session.totalProducts} produk ·{' '}
                    <span className={session.mismatchCount > 0 ? 'text-amber-600 font-bold' : 'text-emerald-600 font-bold'}>
                      {session.mismatchCount > 0 ? `${session.mismatchCount} selisih` : '✓ match'}
                    </span>
                  </p>
                  <p className="text-[9px] text-pink-900/40 mt-0.5">{session.createdAtLabel}</p>
                </div>
                <span className="text-lg ml-2">{isExpanded ? '🔼' : '🔽'}</span>
              </div>

              {/* === Expanded content (only when expanded) === */}
              {isExpanded && (
                <div className="mt-3">
                  {/* Session summary stats */}
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    <div className="glass-mini rounded-lg p-2 text-center">
                      <p className="text-[9px] font-bold uppercase text-pink-900/60">Total Produk</p>
                      <p className="text-sm font-bold text-pink-950">{session.totalProducts}</p>
                    </div>
                    <div className="glass-mini rounded-lg p-2 text-center">
                      <p className="text-[9px] font-bold uppercase text-pink-900/60">Match</p>
                      <p className="text-sm font-bold text-emerald-500">{session.matchCount}</p>
                    </div>
                    <div className="glass-mini rounded-lg p-2 text-center">
                      <p className="text-[9px] font-bold uppercase text-pink-900/60">Selisih</p>
                      <p className="text-sm font-bold text-amber-500">{session.mismatchCount}</p>
                    </div>
                  </div>

                  {/* Total adjustment (if any) */}
                  {session.totalAdjustment !== 0 && (
                    <div className="glass-mini rounded-lg p-2 text-center mb-3">
                      <p className="text-[9px] font-bold uppercase text-pink-900/60">Total Penyesuaian Stock</p>
                      <p
                        className={`text-lg font-black font-mono ${
                          session.totalAdjustment > 0 ? 'text-rose-500' : 'text-emerald-500'
                        }`}
                      >
                        {session.totalAdjustment > 0 ? '+' : ''}{session.totalAdjustment} pcs
                      </p>
                      <p className="text-[9px] text-pink-900/50 mt-0.5">
                        {session.totalAdjustment > 0
                          ? '(stock berkurang — perlu investigasi)'
                          : '(stock bertambah — surplus)'}
                      </p>
                    </div>
                  )}

                  {/* Detail selisih (only if mismatch) */}
                  {session.mismatchCount > 0 && (
                    <div className="space-y-1 mb-3">
                      <p className="text-[10px] font-bold uppercase text-pink-900/60 mb-1">Detail Selisih:</p>
                      {session.rows
                        .filter((r) => r.difference !== 0)
                        .map((row) => (
                          <div
                            key={row.id}
                            className="glass-mini rounded-lg p-2 flex items-start justify-between text-[10px] gap-2"
                          >
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-pink-950 leading-tight">{row.product_id.name}</p>
                              <p className="text-pink-900/60 font-mono mt-0.5">
                                System: {row.system_count} → Fisik: {row.physical_count}
                              </p>
                              {row.reason && (
                                <p className="text-pink-700/80 italic mt-0.5 leading-tight">📝 {row.reason}</p>
                              )}
                            </div>
                            <span
                              className={`font-bold font-mono whitespace-nowrap ${
                                row.difference > 0 ? 'text-rose-500' : 'text-emerald-500'
                              }`}
                            >
                              {row.difference > 0 ? '+' : ''}{row.difference}
                            </span>
                          </div>
                        ))}
                    </div>
                  )}

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
            <h3 className="text-sm font-bold text-pink-950 mb-2">⚠️ Hapus Sesi Opname?</h3>
            <div className="text-xs text-pink-900/70 space-y-1 mb-3">
              <p>📅 {formatDate(deleteTarget.opname_date)} ({deleteTarget.opname_type})</p>
              <p>📊 {deleteTarget.totalProducts} produk · {deleteTarget.mismatchCount} selisih</p>
              <p className="text-[10px] text-pink-900/50">Disimpan: {deleteTarget.createdAtLabel}</p>
            </div>
            <div className="glass-mini rounded-lg p-2 mb-3 text-[10px] text-amber-700 bg-amber-50/80 border border-amber-200/60 leading-relaxed">
              ⚠️ <strong>Konsekuensi (Opsi A):</strong>
              <br />• Record opname akan dihapus permanen
              <br />• Adjustment transaction juga dihapus
              <br />• <strong>Stock akan REVERT ke pre-opname state</strong>
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
