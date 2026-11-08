'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { BULAN_LIST, getTahunListDynamic } from '@/lib/utils/format'

export default function MonthSelector({
  defaultMonth,
  defaultYear,
}: {
  defaultMonth: number
  defaultYear: number
}) {
  const [month, setMonth] = useState(defaultMonth)
  const [year, setYear] = useState(defaultYear)
  const router = useRouter()

  function handleShow() {
    router.push(`/laporan/summary?month=${month}&year=${year}`)
    router.refresh()
  }

  return (
    <div className="glass-mini rounded-xl p-3">
      <div className="grid grid-cols-2 gap-2 mb-2">
        <div>
          <label className="block text-[10px] font-bold uppercase text-pink-900/70 mb-1">Bulan</label>
          <select
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
            className="custom-input w-full rounded-lg py-2 px-3 text-sm font-semibold"
          >
            {BULAN_LIST.map((b, i) => (
              <option key={b} value={i + 1}>{b}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-[10px] font-bold uppercase text-pink-900/70 mb-1">Tahun</label>
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="custom-input w-full rounded-lg py-2 px-3 text-sm font-semibold"
          >
            {getTahunListDynamic().map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>
      <button
        onClick={handleShow}
        className="w-full bg-gradient-to-r from-pink-400 to-rose-400 hover:from-pink-500 hover:to-rose-500 text-white font-bold py-2 px-4 rounded-lg text-xs"
      >
        📊 Tampilkan Data
      </button>
    </div>
  )
}
