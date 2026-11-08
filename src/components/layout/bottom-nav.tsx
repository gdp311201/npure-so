'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV_ITEMS = [
  { href: '/dashboard', icon: '🏠', label: 'Home' },
  { href: '/transaksi', icon: '🛒', label: 'Transaksi' },
  { href: '/produk', icon: '📦', label: 'Produk' },
  { href: '/laporan', icon: '📊', label: 'Laporan' },
  { href: '/setting', icon: '⚙️', label: 'Setting' },
]

export default function BottomNav({ lowStockCount = 0 }: { lowStockCount?: number }) {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 w-[calc(100%-2rem)] max-w-md">
      <div className="glass-nav flex items-center justify-around px-2 py-2.5">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname.startsWith(item.href)
          const showBadge = item.href === '/produk' && lowStockCount > 0

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`relative flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition ${
                isActive
                  ? 'bg-pink-500/15 text-pink-600'
                  : 'text-pink-950/60 hover:text-pink-600'
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              <span className="text-[10px] font-semibold">{item.label}</span>
              {showBadge && (
                <span className="nav-badge">{lowStockCount > 99 ? '99+' : lowStockCount}</span>
              )}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
