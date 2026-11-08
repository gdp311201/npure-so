'use client'

import { useRouter } from 'next/navigation'
import { BULAN_LIST } from '@/lib/utils/format'

export default function MonthNavigator({
  currentMonth,
  currentYear,
}: {
  currentMonth: number
  currentYear: number
}) {
  const router = useRouter()

  function navigate(delta: number) {
    let m = currentMonth + delta
    let y = currentYear
    if (m > 12) { m = 1; y++ }
    if (m < 1) { m = 12; y-- }
    router.push(`/setting?month=${m}&year=${y}`)
    router.refresh()
  }

  const monthName = BULAN_LIST[currentMonth - 1]
  const today = new Date()
  const currentRealMonth = today.getMonth() + 1
  const currentRealYear = today.getFullYear()
  const isCurrentMonth = currentMonth === currentRealMonth && currentYear === currentRealYear

  return (
    <div className="glass-card rounded-2xl p-3">
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="w-9 h-9 rounded-full glass-mini flex items-center justify-center text-pink-950 font-bold text-lg hover:bg-white/80 transition"
          aria-label="Bulan sebelumnya"
        >
          ‹
        </button>
        <div className="text-center">
          <p className="text-[10px] font-bold uppercase text-pink-900/60">Periode Konfigurasi</p>
          <p className="text-sm font-bold text-pink-950">{monthName} {currentYear}</p>
          {isCurrentMonth && (
            <span className="text-[8px] font-bold text-emerald-600">● Bulan berjalan</span>
          )}
        </div>
        <button
          onClick={() => navigate(1)}
          className="w-9 h-9 rounded-full glass-mini flex items-center justify-center text-pink-950 font-bold text-lg hover:bg-white/80 transition"
          aria-label="Bulan berikutnya"
        >
          ›
        </button>
      </div>
    </div>
  )
}
