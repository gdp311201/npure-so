'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { formatRupiah, BULAN_LIST, getCurrentMonth, getCurrentYear, getTodayISO, getTahunListDynamic } from '@/lib/utils/format'

interface AnalyticsData {
  overview: { total_qty: number; total_customer: number; gross_omset: number; net_omset: number; target_omset: number; achievement_pct: number }
  top_sellers: Array<{ name: string; qty: number; omset: number }>
  slow_movers: Array<{ name: string; qty: number; omset: number }>
  demand_consistency: Array<{ name: string; days_sold: number; total_qty: number; avg_per_day: number; consistency_pct: number }>
  weekday_summary: Array<{ day: string; avg_qty: number; total_qty: number; days_active: number }>
  restock_alert: Array<{ name: string; current_stock: number; sold: number; incoming: number }>
  period_label: string
  total_days: number
}

export default function AnalyticsView({ data, mode, searchParams }: { data: AnalyticsData; mode: string; searchParams: any }) {
  const [currentMode, setCurrentMode] = useState(mode)
  const [month, setMonth] = useState(Number(searchParams.month) || getCurrentMonth())
  const [year, setYear] = useState(Number(searchParams.year) || getCurrentYear())
  const [date, setDate] = useState(searchParams.date || getTodayISO())
  const router = useRouter()

  function handleShow() {
    const params = new URLSearchParams()
    params.set('mode', currentMode)
    if (currentMode === 'harian' || currentMode === 'mingguan') params.set('date', date)
    else { params.set('month', String(month)); params.set('year', String(year)) }
    router.push(`/laporan/analytics?${params.toString()}`)
    router.refresh()
  }

  const medals = ['🥇', '🥈', '🥉']

  return (
    <div className="space-y-4">
      {/* Period Selector */}
      <div className="glass-mini rounded-xl p-3">
        <div className="grid grid-cols-3 gap-2 mb-2">
          {(['harian', 'mingguan', 'bulanan'] as const).map(m => (
            <button key={m} onClick={() => setCurrentMode(m)}
              className={`py-1.5 px-2 rounded-lg text-[10px] font-bold uppercase transition ${currentMode === m ? 'bg-gradient-to-r from-pink-400 to-rose-400 text-white' : 'bg-white/60 text-pink-950/70 border border-pink-200/60'}`}>
              {m === 'harian' ? '📅 Harian' : m === 'mingguan' ? '📆 Mingguan' : '📊 Bulanan'}
            </button>
          ))}
        </div>
        {currentMode === 'bulanan' ? (
          <div className="grid grid-cols-2 gap-2 mb-2">
            <select value={month} onChange={e => setMonth(Number(e.target.value))} className="custom-input rounded-lg py-2 px-3 text-sm">
              {BULAN_LIST.map((b, i) => <option key={b} value={i + 1}>{b}</option>)}
            </select>
            <select value={year} onChange={e => setYear(Number(e.target.value))} className="custom-input rounded-lg py-2 px-3 text-sm">
              {getTahunListDynamic().map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        ) : (
          <div className="mb-2">
            <input type="date" value={date} onChange={e => setDate(e.target.value)} className="custom-input w-full rounded-lg py-2 px-3 text-sm" />
          </div>
        )}
        <button onClick={handleShow} className="w-full bg-gradient-to-r from-pink-400 to-rose-400 text-white font-bold py-2 px-4 rounded-lg text-xs">📊 Tampilkan Analytics</button>
      </div>

      <div className="text-center"><p className="text-xs font-bold text-pink-950">{data.period_label}</p></div>

      {/* Overview */}
      <div className="grid grid-cols-2 gap-2">
        <div className="glass-mini rounded-xl p-3 text-center">
          <p className="text-[9px] font-bold uppercase text-pink-900/60">Total Qty</p>
          <p className="text-lg font-bold text-pink-950">{data.overview.total_qty}</p>
          <p className="text-[9px] text-pink-700/50">pcs sold</p>
        </div>
        <div className="glass-mini rounded-xl p-3 text-center">
          <p className="text-[9px] font-bold uppercase text-pink-900/60">Customer</p>
          <p className="text-lg font-bold text-pink-950">{data.overview.total_customer}</p>
          <p className="text-[9px] text-pink-700/50">sale events</p>
        </div>
        <div className="glass-mini rounded-xl p-3 text-center">
          <p className="text-[9px] font-bold uppercase text-pink-900/60">Net Omset</p>
          <p className="text-sm font-bold text-pink-950">{formatRupiah(data.overview.net_omset)}</p>
        </div>
        <div className="glass-mini rounded-xl p-3 text-center">
          <p className="text-[9px] font-bold uppercase text-pink-900/60">Achievement</p>
          <p className="text-lg font-bold text-pink-950">{data.overview.achievement_pct.toFixed(1)}%</p>
          <p className="text-[9px] text-pink-700/50">/ {formatRupiah(data.overview.target_omset)}</p>
        </div>
      </div>

      {/* Top 10 Sellers */}
      {data.top_sellers.length > 0 && (
        <div className="glass-card rounded-2xl p-4">
          <h3 className="text-xs font-bold text-pink-950 mb-3">🏆 Top 10 Sellers (by Qty)</h3>
          <div className="space-y-2.5">
            {data.top_sellers.map((seller, i) => {
              const maxQty = data.top_sellers[0]?.qty || 1
              const barWidth = Math.max((seller.qty / maxQty) * 100, 5)
              return (
                <div key={i} className="flex items-start gap-2">
                  <span className="text-sm flex-shrink-0 w-6 text-center leading-tight">{medals[i] || `${i + 1}`}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-0.5">
                      <span className="text-[10px] font-medium text-pink-950 pr-2 leading-tight">{seller.name}</span>
                      <span className="text-[10px] font-bold text-pink-950 whitespace-nowrap flex-shrink-0">{seller.qty} pcs</span>
                    </div>
                    <div className="h-2 rounded-full bg-pink-950/10 overflow-hidden">
                      <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-500" style={{ width: `${barWidth}%` }} />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Slow Movers */}
      {data.slow_movers.length > 0 && (
        <div className="glass-card rounded-2xl p-4">
          <h3 className="text-xs font-bold text-pink-950 mb-3">🐢 Slow Movers (Bottom 10)</h3>
          <div className="space-y-1">
            {data.slow_movers.map((mover, i) => (
              <div key={i} className="flex items-start justify-between text-[10px] py-1 border-b border-pink-100/20">
                <span className="text-pink-700/60 flex-shrink-0 mr-2 w-4 leading-tight">{i + 1}</span>
                <span className="text-pink-950 flex-1 pr-2 leading-tight">{mover.name}</span>
                <span className="font-bold text-amber-400 whitespace-nowrap flex-shrink-0">{mover.qty} pcs</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Demand Consistency — Sell Frequency */}
      {data.demand_consistency.length > 0 && (
        <div className="glass-card rounded-2xl p-4">
          <h3 className="text-xs font-bold text-pink-950 mb-1">📊 Demand Consistency (Sell Frequency)</h3>
          <p className="text-[9px] text-pink-700/50 mb-3">
            Seberapa sering produk terjual dalam {data.total_days} hari periode
          </p>
          <div className="space-y-2.5">
            {data.demand_consistency.map((item, i) => {
              const maxDays = data.demand_consistency[0]?.days_sold || 1
              const barWidth = Math.max((item.days_sold / maxDays) * 100, 5)
              const isStaple = item.consistency_pct >= 80
              const isOneTime = item.days_sold <= 1
              return (
                <div key={i} className="flex items-start gap-2">
                  <span className="text-xs flex-shrink-0 w-4 text-pink-700/60 leading-tight">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-0.5">
                      <span className="text-[10px] font-medium text-pink-950 pr-2 leading-tight">
                        {item.name}
                        {isStaple && <span className="text-emerald-400 ml-1">★</span>}
                        {isOneTime && <span className="text-amber-400 ml-1">○</span>}
                      </span>
                      <span className="text-[10px] font-bold text-pink-950 whitespace-nowrap flex-shrink-0">
                        {item.days_sold}h · {item.avg_per_day}/d · {item.total_qty}pcs
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-pink-950/10 overflow-hidden">
                      <div className={`h-full rounded-full transition-all duration-500 ${isStaple ? 'bg-gradient-to-r from-emerald-500 to-emerald-400' : isOneTime ? 'bg-amber-500' : 'bg-gradient-to-r from-teal-600 to-teal-500'}`} style={{ width: `${barWidth}%` }} />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
          <div className="flex gap-2 mt-3 flex-wrap">
            <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400">★ Staple (≥80% hari)</span>
            <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-teal-500/20 text-teal-400">Consistent (20-79%)</span>
            <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400">○ One-time (1 hari)</span>
          </div>
        </div>
      )}

      {/* Weekday Summary */}
      {data.weekday_summary.length > 0 && (
        <div className="glass-card rounded-2xl p-4">
          <h3 className="text-xs font-bold text-pink-950 mb-3">📅 Sell-Out by Weekday (Average)</h3>
          <div className="space-y-2.5">
            {data.weekday_summary.map((wd, i) => {
              const maxAvg = data.weekday_summary[0]?.avg_qty || 1
              const barWidth = Math.max((wd.avg_qty / maxAvg) * 100, 5)
              const isPeak = i === 0
              const isLow = i === data.weekday_summary.length - 1
              return (
                <div key={i} className="flex items-center gap-2">
                  <span className={`text-[10px] font-bold w-14 flex-shrink-0 ${isPeak ? 'text-emerald-400' : isLow ? 'text-rose-400' : 'text-pink-950'}`}>
                    {wd.day}
                  </span>
                  <div className="flex-1">
                    <div className="h-3 rounded-full bg-pink-950/10 overflow-hidden">
                      <div className={`h-full rounded-full transition-all duration-500 ${isPeak ? 'bg-gradient-to-r from-emerald-500 to-emerald-400' : isLow ? 'bg-rose-500' : 'bg-gradient-to-r from-teal-600 to-teal-500'}`} style={{ width: `${barWidth}%` }} />
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-pink-950 whitespace-nowrap w-20 text-right">avg {wd.avg_qty} pcs</span>
                </div>
              )
            })}
          </div>
          <div className="flex justify-between mt-2 pt-2 border-t border-pink-100/20">
            <p className="text-[9px] text-emerald-400">📈 Peak: {data.weekday_summary[0]?.day}</p>
            <p className="text-[9px] text-rose-400">📉 Lowest: {data.weekday_summary[data.weekday_summary.length - 1]?.day}</p>
          </div>
          <p className="text-[8px] text-pink-700/40 mt-1">
            Berdasarkan {data.weekday_summary.reduce((s, d) => s + d.days_active, 0)} hari penjualan dalam periode ini
          </p>
        </div>
      )}

      {/* Restock Alert */}
      {data.restock_alert.length > 0 && (
        <div className="glass-card rounded-2xl p-4">
          <h3 className="text-xs font-bold text-pink-950 mb-3">🔁 Restock Alert (≤ 10 pcs)</h3>
          <div className="space-y-1">
            {data.restock_alert.slice(0, 10).map((r, i) => (
              <div key={i} className="flex items-start justify-between text-[10px] py-1 border-b border-pink-100/20">
                <span className="text-pink-950 flex-1 pr-2 leading-tight">{r.name}</span>
                <span className={`font-bold flex-shrink-0 ${r.current_stock === 0 ? 'text-rose-400' : 'text-amber-400'}`}>{r.current_stock} pcs</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {data.top_sellers.length === 0 && (
        <div className="glass-card rounded-2xl p-6 text-center">
          <div className="text-3xl mb-2 opacity-50">📊</div>
          <p className="text-xs font-bold text-pink-900/70">Tidak ada data untuk periode ini</p>
        </div>
      )}
    </div>
  )
}
