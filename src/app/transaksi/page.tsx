import AppShell from '@/components/layout/app-shell'

export default async function TransaksiPage() {
  return (
    <AppShell title="Transaksi">
      <div className="space-y-3">
        <div className="text-center mb-2">
          <p className="text-xs text-pink-800/70 font-medium">Pilih jenis transaksi</p>
        </div>

        <a href="/transaksi/sell-out" className="block">
          <div className="glass-sell-out rounded-2xl p-4 flex items-center gap-3 transition active:scale-95">
            <div className="text-3xl">🛒</div>
            <div className="flex-1">
              <h2 className="text-sm font-bold text-pink-950">Input Penjualan</h2>
              <p className="text-xs text-pink-800/70">Sell-Out (barang terjual ke customer)</p>
            </div>
            <div className="text-pink-400 text-lg">→</div>
          </div>
        </a>

        <a href="/transaksi/sell-in" className="block">
          <div className="glass-sell-in rounded-2xl p-4 flex items-center gap-3 transition active:scale-95">
            <div className="text-3xl">📥</div>
            <div className="flex-1">
              <h2 className="text-sm font-bold text-pink-950">Input Barang Masuk</h2>
              <p className="text-xs text-pink-800/70">Sell-In (restock dari brand)</p>
            </div>
            <div className="text-pink-400 text-lg">→</div>
          </div>
        </a>

        <a href="/transaksi/opname" className="block">
          <div className="glass-opname rounded-2xl p-4 flex items-center gap-3 transition active:scale-95">
            <div className="text-3xl">📋</div>
            <div className="flex-1">
              <h2 className="text-sm font-bold text-pink-950">Stock Opname</h2>
              <p className="text-xs text-pink-800/70">Hitung fisik & adjust stock</p>
            </div>
            <div className="text-pink-400 text-lg">→</div>
          </div>
        </a>
      </div>
    </AppShell>
  )
}
