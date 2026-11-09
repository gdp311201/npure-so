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
}

const BULAN_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agt', 'Sep', 'Okt', 'Nov', 'Des']

function formatDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  return `${d} ${BULAN_SHORT[m - 1]} ${y}`
}

function formatDateTime(iso: string): string {
  const dt = new Date(iso)
  const d = dt.getDate().toString().padStart(2, '0')
  const m = BULAN_SHORT[dt.getMonth()]
  const y = dt.getFullYear()
  const h = dt.getHours().toString().padStart(2, '0')
  const min = dt.getMinutes().toString().padStart(2, '0')
  return `${d} ${m} ${y} · ${h}:${min}`
}

export default function HistoryOpname({ opnames }: { opnames: OpnameRow[] }) {
  // Group by date + type (each "session" = one opname event)
  const sessions: Session[] = []
  const sessionMap = new Map<string, OpnameRow[]>()

  opnames.forEach((row) => {
    const key = `${row.opname_date}_${row.opname_type}`
    if (!sessionMap.has(key)) sessionMap.set(key, [])
    sessionMap.get(key)!.push(row)
  })

  sessionMap.forEach((rows, key) => {
    const first = rows[0]
    const mismatchCount = rows.filter((r) => r.difference !== 0).length
    const matchCount = rows.length - mismatchCount
    const totalAdjustment = rows.reduce((s, r) => s + r.difference, 0)
    sessions.push({
      key,
      opname_date: first.opname_date,
      opname_type: first.opname_type,
      totalProducts: rows.length,
      mismatchCount,
      matchCount,
      totalAdjustment,
      rows: rows.sort((a, b) => a.product_id.name.localeCompare(b.product_id.name)),
    })
  })

  // Sort sessions by date desc
  sessions.sort((a, b) => b.opname_date.localeCompare(a.opname_date))

  if (opnames.length === 0) {
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
      <div className="glass-mini rounded-xl p-3 text-center">
        <p className="text-[10px] font-bold uppercase text-pink-900/60">Total Opname</p>
        <p className="text-lg font-black text-pink-950">{sessions.length} sesi</p>
        <p className="text-[10px] text-pink-900/60 mt-0.5">{opnames.length} produk tercatat</p>
      </div>

      {sessions.map((session) => (
        <div key={session.key} className="glass-card rounded-2xl p-4">
          {/* Session header */}
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="text-sm font-bold text-pink-950">{formatDate(session.opname_date)}</p>
              <p className="text-[10px] font-bold uppercase text-pink-700 mt-0.5">
                {session.opname_type === 'bulanan' ? '📅 Bulanan' : '🎉 Event'}
              </p>
            </div>
            <span
              className={`text-[10px] font-bold px-2 py-1 rounded-full ${
                session.mismatchCount > 0
                  ? 'bg-amber-100/80 text-amber-700'
                  : 'bg-emerald-100/80 text-emerald-700'
              }`}
            >
              {session.mismatchCount > 0
                ? `${session.mismatchCount} selisih`
                : '✓ Semua match'}
            </span>
          </div>

          {/* Session summary */}
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

          {/* Total adjustment */}
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

          {/* Mismatched products detail (only if any) */}
          {session.mismatchCount > 0 && (
            <div className="space-y-1">
              <p className="text-[10px] font-bold uppercase text-pink-900/60 mb-1">Detail Selisih:</p>
              {session.rows
                .filter((r) => r.difference !== 0)
                .map((row) => (
                  <div
                    key={row.id}
                    className="glass-mini rounded-lg p-2 flex items-center justify-between text-[10px]"
                  >
                    <div className="flex-1 min-w-0 pr-2">
                      <p className="font-bold text-pink-950 truncate">{row.product_id.name}</p>
                      <p className="text-pink-900/60 font-mono">
                        System: {row.system_count} → Fisik: {row.physical_count}
                      </p>
                      {row.reason && (
                        <p className="text-pink-700/70 italic mt-0.5">📝 {row.reason}</p>
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

          {/* Footer: timestamp */}
          <p className="text-[9px] text-pink-900/40 text-center mt-3">
            Disimpan: {formatDateTime(session.rows[0].created_at)}
          </p>
        </div>
      ))}
    </div>
  )
}
