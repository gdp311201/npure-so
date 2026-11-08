import AppShell from '@/components/layout/app-shell'

export default async function ProdukPage() {
  return (
    <AppShell title="Produk">
      <div className="glass-card rounded-2xl p-6 text-center">
        <div className="text-4xl mb-3">📦</div>
        <h2 className="text-lg font-bold text-pink-950">Produk</h2>
        <p className="text-sm text-pink-800/70 mt-1">
          Master produk dengan toggle Aktif/Semua akan dibangun di sini.
        </p>
      </div>
    </AppShell>
  )
}
