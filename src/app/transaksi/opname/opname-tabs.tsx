'use client'

import { useRouter } from 'next/navigation'

export default function OpnameTabs({ activeTab }: { activeTab: 'input' | 'history' }) {
  const router = useRouter()

  function switchTab(tab: 'input' | 'history') {
    router.push(`/transaksi/opname?tab=${tab}`)
    router.refresh()
  }

  return (
    <div className="grid grid-cols-2 gap-2">
      <button
        onClick={() => switchTab('input')}
        className={`py-2.5 px-3 rounded-xl text-xs font-bold uppercase transition ${
          activeTab === 'input'
            ? 'bg-gradient-to-r from-pink-400 to-rose-400 text-white shadow-lg shadow-pink-500/30'
            : 'glass-card text-pink-950/70'
        }`}
      >
        📝 Input Opname
      </button>
      <button
        onClick={() => switchTab('history')}
        className={`py-2.5 px-3 rounded-xl text-xs font-bold uppercase transition ${
          activeTab === 'history'
            ? 'bg-gradient-to-r from-pink-400 to-rose-400 text-white shadow-lg shadow-pink-500/30'
            : 'glass-card text-pink-950/70'
        }`}
      >
        📚 History
      </button>
    </div>
  )
}
