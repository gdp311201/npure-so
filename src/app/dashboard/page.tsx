import AppShell from '@/components/layout/app-shell'

export default async function DashboardPage() {
  return (
    <AppShell title="Dashboard">
      <div className="space-y-4">
        {/* Welcome card — placeholder for now */}
        <div className="glass-card rounded-2xl p-6 text-center">
          <div className="text-4xl mb-3 mascot-float-glow inline-block">🏠</div>
          <h2 className="text-lg font-bold text-pink-950">Dashboard</h2>
          <p className="text-sm text-pink-800/70 mt-1">
            Navigation shell aktif! Full dashboard UI coming in Part 2.
          </p>
        </div>

        {/* Hint about bottom nav */}
        <div className="glass-mini rounded-xl p-4 text-center">
          <p className="text-xs text-pink-900/70 font-medium">
            👇 Coba klik tab di bottom navigation
          </p>
        </div>
      </div>
    </AppShell>
  )
}
