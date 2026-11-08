import AppShell from '@/components/layout/app-shell'

export default async function SellInPage() {
  return (
    <AppShell title="Barang Masuk">
      <div className="glass-card rounded-2xl p-6 text-center">
        <div className="text-4xl mb-3">📥</div>
        <h2 className="text-lg font-bold text-pink-950">Input Barang Masuk</h2>
        <p className="text-sm text-pink-800/70 mt-1">Sell-In cart akan dibangun di Phase 1c-2.</p>
      </div>
    </AppShell>
  )
}
