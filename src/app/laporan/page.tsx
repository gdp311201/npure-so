import AppShell from '@/components/layout/app-shell'

export default async function LaporanPage() {
  return (
    <AppShell title="Laporan">
      <div className="space-y-3">
        <a href="/laporan/summary" className="block">
          <div className="glass-card rounded-2xl p-4 flex items-center gap-3 transition active:scale-95">
            <div className="text-3xl">📈</div>
            <div className="flex-1">
              <h2 className="text-sm font-bold text-pink-950">Interactive Summary</h2>
              <p className="text-xs text-pink-800/70">Lihat sell-out per produk per periode</p>
            </div>
            <div className="text-pink-400 text-lg">→</div>
          </div>
        </a>

        <a href="/laporan/tracking" className="block">
          <div className="glass-card rounded-2xl p-4 flex items-center gap-3 transition active:scale-95">
            <div className="text-3xl">📋</div>
            <div className="flex-1">
              <h2 className="text-sm font-bold text-pink-950">Product Tracking</h2>
              <p className="text-xs text-pink-800/70">Mutasi produk: stock awal, pergerakan, stock akhir</p>
            </div>
            <div className="text-pink-400 text-lg">→</div>
          </div>
        </a>

        <a href="/laporan/e-receipt" className="block">
          <div className="glass-card rounded-2xl p-4 flex items-center gap-3 transition active:scale-95">
            <div className="text-3xl">🧾</div>
            <div className="flex-1">
              <h2 className="text-sm font-bold text-pink-950">E-Receipt Generator</h2>
              <p className="text-xs text-pink-800/70">Bukti kuitansi formal (PNG)</p>
            </div>
            <div className="text-pink-400 text-lg">→</div>
          </div>
        </a>

        <a href="/laporan/export" className="block">
          <div className="glass-card rounded-2xl p-4 flex items-center gap-3 transition active:scale-95">
            <div className="text-3xl">📤</div>
            <div className="flex-1">
              <h2 className="text-sm font-bold text-pink-950">Export Excel</h2>
              <p className="text-xs text-pink-800/70">Download transaksi per periode</p>
            </div>
            <div className="text-pink-400 text-lg">→</div>
          </div>
        </a>
      </div>
    </AppShell>
  )
}
