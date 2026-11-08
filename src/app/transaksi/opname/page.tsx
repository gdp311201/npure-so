import AppShell from '@/components/layout/app-shell'

export default async function OpnamePage() {
  return (
    <AppShell title="Stock Opname">
      <div className="glass-card rounded-2xl p-6 text-center">
        <div className="text-4xl mb-3">📋</div>
        <h2 className="text-lg font-bold text-pink-950">Stock Opname</h2>
        <p className="text-sm text-pink-800/70 mt-1">Opname input akan dibangun di Phase 1c-3.</p>
      </div>
    </AppShell>
  )
}
