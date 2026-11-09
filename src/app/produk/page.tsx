import AppShell from '@/components/layout/app-shell'

export default async function ProdukPage() {
  return (
    <AppShell title="Produk">
      <div className="space-y-3">
        <a href="/produk/manage" className="block">
          <div className="glass-card rounded-2xl p-4 flex items-center gap-3 transition active:scale-95">
            <div className="text-3xl">⚙️</div>
            <div className="flex-1">
              <h2 className="text-sm font-bold text-pink-950">Manage Produk</h2>
              <p className="text-xs text-pink-800/70">Add, edit, hide/unhide produk</p>
            </div>
            <div className="text-pink-400 text-lg">→</div>
          </div>
        </a>

        <a href="/produk/stock" className="block">
          <div className="glass-card rounded-2xl p-4 flex items-center gap-3 transition active:scale-95">
            <div className="text-3xl">📦</div>
            <div className="flex-1">
              <h2 className="text-sm font-bold text-pink-950">Stock Overview</h2>
              <p className="text-xs text-pink-800/70">Cek stock semua produk aktif</p>
            </div>
            <div className="text-pink-400 text-lg">→</div>
          </div>
        </a>

        <a href="/produk/tracking" className="block">
          <div className="glass-card rounded-2xl p-4 flex items-center gap-3 transition active:scale-95">
            <div className="text-3xl">📋</div>
            <div className="flex-1">
              <h2 className="text-sm font-bold text-pink-950">Product Tracking</h2>
              <p className="text-xs text-pink-800/70">Mutasi produk: stock awal, pergerakan, stock akhir</p>
            </div>
            <div className="text-pink-400 text-lg">→</div>
          </div>
        </a>
      </div>
    </AppShell>
  )
}
