'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid } from 'recharts'
import { formatRupiah, BULAN_LIST, getCurrentMonth, getCurrentYear, getTodayISO, getTahunListDynamic } from '@/lib/utils/format'

interface AnalyticsData {
  overview: { total_qty: number; total_customer: number; gross_omset: number; net_omset: number; target_omset: number; achievement_pct: number }
  top_sellers: Array<{ name: string; qty: number; omset: number }>
  slow_movers: Array<{ name: string; qty: number; omset: number }>
  daily_trend: Array<{ date: string; qty: number; omset: number; customer: number }>
  turnover: Array<{ name: string; stock_awal: number; sold: number; incoming: number; current_stock: number; turnover_pct: number; status: string }>
  restock_alert: Array<{ name: string; current_stock: number; sold: number; incoming: number }>
  period_label: string
}

const CHART_AXIS = { fill: '#ecfdf5', fontSize: 10 }
const CHART_GRID = 'rgba(255,255,255,0.06)'
const TOOLTIP_STYLE = {
  background: 'rgba(6, 78, 59, 0.95)',
  border: '1px solid rgba(52, 211, 153, 0.3)',
  borderRadius: '8px',
  fontSize: '11px',
  color: '#ecfdf5',
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

  const turnoverColors: Record<string, string> = { fast: '#ef4444', healthy: '#10b981', slow: '#f59e0b', dead: '#6b7280' }
  const turnoverLabels: Record<string, string> = { fast: '⚡ Cepat Habis', healthy: '✅ Sehat', slow: '🐢 Lambat', dead: '💀 Dead Stock' }

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

      {/* Period Label */}
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
          <ResponsiveContainer width="100%" height={280}>
            <BarChart layout="vertical" data={data.top_sellers} margin={{ left: 0, right: 10 }}>
              <CartesianGrid horizontal={false} stroke={CHART_GRID} />
              <XAxis type="number" tick={CHART_AXIS} axisLine={{ stroke: CHART_GRID }} />
              <YAxis type="category" dataKey="name" tick={{ ...CHART_AXIS, fontSize: 9 }} axisLine={{ stroke: CHART_GRID }} width={130} />
              <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: 'rgba(255,255,255,0.05)' }} formatter={(v: any, n: string) => n === 'qty' ? [`${v} pcs`, 'Qty'] : [formatRupiah(Number(v)), 'Omset']} />
              <Bar dataKey="qty" fill="#10b981" radius={[0, 4, 4, 0]} barSize={20} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Slow Movers */}
      {data.slow_movers.length > 0 && (
        <div className="glass-card rounded-2xl p-4">
          <h3 className="text-xs font-bold text-pink-950 mb-3">🐢 Slow Movers (Bottom 10)</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart layout="vertical" data={data.slow_movers} margin={{ left: 0, right: 10 }}>
              <CartesianGrid horizontal={false} stroke={CHART_GRID} />
              <XAxis type="number" tick={CHART_AXIS} axisLine={{ stroke: CHART_GRID }} />
              <YAxis type="category" dataKey="name" tick={{ ...CHART_AXIS, fontSize: 9 }} axisLine={{ stroke: CHART_GRID }} width={130} />
              <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: 'rgba(255,255,255,0.05)' }} formatter={(v: any) => [`${v} pcs`, 'Qty']} />
              <Bar dataKey="qty" fill="#f59e0b" radius={[0, 4, 4, 0]} barSize={20} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Daily Trend */}
      {data.daily_trend.length > 0 && (
        <div className="glass-card rounded-2xl p-4">
          <h3 className="text-xs font-bold text-pink-950 mb-3">📅 Daily Sell-Out Trend</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data.daily_trend} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
              <CartesianGrid vertical={false} stroke={CHART_GRID} />
              <XAxis dataKey="date" tick={{ ...CHART_AXIS, fontSize: 8 }} axisLine={{ stroke: CHART_GRID }} interval={0} angle={-45} textAnchor="end" height={50} />
              <YAxis tick={CHART_AXIS} axisLine={{ stroke: CHART_GRID }} />
              <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: 'rgba(255,255,255,0.05)' }} formatter={(v: any, n: string) => n === 'qty' ? [`${v} pcs`, 'Qty'] : n === 'omset' ? [formatRupiah(Number(v)), 'Omset'] : [`${v}`, 'Customer']} />
              <Bar dataKey="qty" fill="#34d399" radius={[4, 4, 0, 0]} barSize={16} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Stock Turnover */}
      {data.turnover.length > 0 && (
        <div className="glass-card rounded-2xl p-4">
          <h3 className="text-xs font-bold text-pink-950 mb-3">⚡ Stock Turnover Rate</h3>
          <div className="space-y-1.5">
            {data.turnover.slice(0, 15).map((t, i) => (
              <div key={i} className="flex items-center justify-between text-[10px] py-1 border-b border-pink-100/20">
                <span className="text-pink-950 flex-1 truncate pr-2">{t.name}</span>
                <span className="text-pink-700/60 whitespace-nowrap mr-2">Awal: {t.stock_awal} | Sold: {t.sold}</span>
                <span className="font-bold whitespace-nowrap" style={{ color: turnoverColors[t.status] }}>{t.turnover_pct}%</span>
              </div>
            ))}
          </div>
          <div className="flex gap-2 mt-2 flex-wrap">
            {Object.entries(turnoverLabels).map(([k, v]) => (
              <span key={k} className="text-[8px] px-1.5 py-0.5 rounded-full" style={{ background: `${turnoverColors[k]}20`, color: turnoverColors[k] }}>{v}</span>
            ))}
          </div>
        </div>
      )}

      {/* Restock Alert */}
      {data.restock_alert.length > 0 && (
        <div className="glass-card rounded-2xl p-4">
          <h3 className="text-xs font-bold text-pink-950 mb-3">🔁 Restock Alert (≤ 10 pcs)</h3>
          <div className="space-y-1">
            {data.restock_alert.slice(0, 10).map((r, i) => (
              <div key={i} className="flex items-center justify-between text-[10px] py-1 border-b border-pink-100/20">
                <span className="text-pink-950 flex-1 truncate pr-2">{r.name}</span>
                <span className={`font-bold ${r.current_stock === 0 ? 'text-rose-400' : 'text-amber-400'}`}>{r.current_stock} pcs</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {data.top_sellers.length === 0 && (
        <div className="glass-card rounded-2xl p-6 text-center">
          <div className="text-3xl mb-2 opacity-50">📊</div>
          <p className="text-xs font-bold text-pink-900/70">Tidak ada data untuk periode ini</p>
        </div>
      )}
    </div>
  )
}
