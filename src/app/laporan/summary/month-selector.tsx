'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { BULAN_LIST, getTahunListDynamic, getCurrentMonth, getCurrentYear, getTodayISO } from '@/lib/utils/format'

export default function MonthSelector({
  defaultMode = 'bulanan',
  defaultMonth,
  defaultYear,
  defaultDate,
}: {
  defaultMode?: 'harian' | 'mingguan' | 'bulanan'
  defaultMonth: number
  defaultYear: number
  defaultDate: string
}) {
  const [mode, setMode] = useState(defaultMode)
  const [month, setMonth] = useState(defaultMonth)
  const [year, setYear] = useState(defaultYear)
  const [date, setDate] = useState(defaultDate)
  const router = useRouter()

  function handleShow() {
    const params = new URLSearchParams()
    params.set('mode', mode)
    if (mode === 'harian') {
      params.set('date', date)
    } else if (mode === 'mingguan') {
      params.set('date', date)
    } else {
      params.set('month', String(month))
      params.set('year', String(year))
    }
    router.push(`/laporan/summary?${params.toString()}`)
    router.refresh()
  }

  return (
    <div className="glass-mini rounded-xl p-3">
      {/* Mode selector */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        {(['harian', 'mingguan', 'bulanan'] as const).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`py-1.5 px-2 rounded-lg text-[10px] font-bold uppercase transition ${
              mode === m
                ? 'bg-gradient-to-r from-pink-400 to-rose-400 text-white'
                : 'bg-white/80 text-pink-950/70 border border-pink-200/60'
            }`}
          >
            {m === 'harian' ? '📅 Harian' : m === 'mingguan' ? '📆 Mingguan' : '📊 Bulanan'}
          </button>
        ))}
      </div>

      {/* Mode-specific inputs */}
      {mode === 'bulanan' ? (
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
      ) : (
        <div className="mb-2">
          <label className="block text-[10px] font-bold uppercase text-pink-900/70 mb-1">
            {mode === 'harian' ? 'Tanggal' : 'Tanggal (pilih hari apapun dalam minggu itu)'}
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="custom-input w-full rounded-lg py-2 px-3 text-sm font-semibold"
          />
          {mode === 'mingguan' && (
            <p className="text-[9px] text-pink-700/50 mt-0.5">
              Sistem otomatis hitung Senin - Minggu dari tanggal yang dipilih.
            </p>
          )}
        </div>
      )}

      <button
        onClick={handleShow}
        className="w-full bg-gradient-to-r from-pink-400 to-rose-400 hover:from-pink-500 hover:to-rose-500 text-white font-bold py-2 px-4 rounded-lg text-xs"
      >
        📊 Tampilkan Data
      </button>
    </div>
  )
}
