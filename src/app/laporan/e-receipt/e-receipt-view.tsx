'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { formatRupiah, BULAN_LIST, getCurrentMonth, getCurrentYear, getTodayISO, getTahunListDynamic } from '@/lib/utils/format'

interface ReceiptData {
  summary: {
    total_sell_out_qty: number
    total_customer: number
    gross_omset: number
    discount_rate: number
    discount_amount: number
    net_omset: number
    total_sell_in_qty: number
  }
  target: {
    target_omset: number
    achieved_omset: number
    achievement_pct: number
    remaining_omset: number
  }
  focus_products: Array<{
    product_id: string
    product_name: string
    target_qty: number
    sold_qty: number
    achievement_pct: number
    remaining_qty: number
    contribution_to_sales_pct: number
  }>
  product_details: Array<{
    product_name: string
    sell_out_qty: number
    sell_out_omset: number
  }>
  opname_logs: Array<{
    opname_date: string
    opname_type: string
    product_name: string
    difference: number
    reason: string | null
  }>
  meta: {
    period_label: string
    user_name: string
    generated_at: string
  }
}

function isMobileDevice(): boolean {
  if (typeof navigator === 'undefined') return false
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
}

export default function EReceiptView({
  data,
  mode,
  searchParams,
}: {
  data: ReceiptData
  mode: string
  searchParams: any
}) {
  const [currentMode, setCurrentMode] = useState(mode)
  const [date, setDate] = useState(searchParams.date || getTodayISO())
  const [month, setMonth] = useState(Number(searchParams.month) || getCurrentMonth())
  const [year, setYear] = useState(Number(searchParams.year) || getCurrentYear())
  const [dateFrom, setDateFrom] = useState(searchParams.dateFrom || getTodayISO())
  const [dateTo, setDateTo] = useState(searchParams.dateTo || getTodayISO())
  const [downloading, setDownloading] = useState(false)
  const receiptRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  function handleShow() {
    const params = new URLSearchParams()
    params.set('mode', currentMode)
    if (currentMode === 'harian') params.set('date', date)
    else if (currentMode === 'bulanan') { params.set('month', String(month)); params.set('year', String(year)) }
    else if (currentMode === 'custom') { params.set('dateFrom', dateFrom); params.set('dateTo', dateTo) }
    router.push(`/laporan/e-receipt?${params.toString()}`)
    router.refresh()
  }

  function getFileName(): string {
    const ts = new Date().toISOString().replace(/[:T.]/g, '').slice(0, 14)
    if (currentMode === 'harian') return `NPURE_SO_Receipt_${date}_${ts}.png`
    if (currentMode === 'bulanan') return `NPURE_SO_Receipt_${BULAN_LIST[month - 1].slice(0, 3)}${year}_${ts}.png`
    return `NPURE_SO_Receipt_${dateFrom}_${dateTo}_${ts}.png`
  }

  async function downloadAsPNG() {
    if (!receiptRef.current) return
    setDownloading(true)
    try {
      const { default: html2canvas } = await import('html2canvas-pro')
      const fileName = getFileName()
      const paper = receiptRef.current
      const origMaxHeight = paper.style.maxHeight
      const origOverflow = paper.style.overflowY
      paper.style.maxHeight = 'none'
      paper.style.overflowY = 'visible'

      const canvas = await html2canvas(paper, { scale: 2, useCORS: true, backgroundColor: '#FFF8F5', logging: false })
      paper.style.maxHeight = origMaxHeight
      paper.style.overflowY = origOverflow
      const imageURI = canvas.toDataURL('image/png')

      if (isMobileDevice() && navigator.share && navigator.canShare) {
        try {
          const blob = await (await fetch(imageURI)).blob()
          const file = new File([blob], fileName, { type: 'image/png' })
          if (navigator.canShare({ files: [file] })) {
            await navigator.share({ files: [file], title: fileName, text: 'E-Receipt NPURE SO' })
            return
          }
        } catch {}
      }
      const link = document.createElement('a')
      link.download = fileName
      link.href = imageURI
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (err: any) {
      alert('Gagal download: ' + err.message)
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div className="space-y-3">
      {/* Period mode selector */}
      <div className="glass-mini rounded-xl p-2.5">
        <div className="grid grid-cols-3 gap-2 mb-2">
          {(['harian', 'bulanan', 'custom'] as const).map((m) => (
            <button
              key={m}
              onClick={() => setCurrentMode(m)}
              className={`py-1.5 px-2 rounded-lg text-[10px] font-bold uppercase transition ${
                currentMode === m
                  ? 'bg-gradient-to-r from-pink-400 to-rose-400 text-white'
                  : 'bg-white/80 text-pink-950/70 border border-pink-200/60'
              }`}
            >
              {m === 'harian' ? '📅 Harian' : m === 'bulanan' ? '📊 Bulanan' : '🎯 Custom'}
            </button>
          ))}
        </div>

        {currentMode === 'harian' && (
          <div>
            <label className="block text-[10px] font-bold uppercase text-pink-900/70 mb-1">Tanggal</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="custom-input w-full rounded-lg py-2 px-3 text-sm" />
          </div>
        )}
        {currentMode === 'bulanan' && (
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] font-bold uppercase text-pink-900/70 mb-1">Bulan</label>
              <select value={month} onChange={(e) => setMonth(Number(e.target.value))} className="custom-input w-full rounded-lg py-2 px-3 text-sm">
                {BULAN_LIST.map((b, i) => <option key={b} value={i + 1}>{b}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase text-pink-900/70 mb-1">Tahun</label>
              <select value={year} onChange={(e) => setYear(Number(e.target.value))} className="custom-input w-full rounded-lg py-2 px-3 text-sm">
                {getTahunListDynamic().map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          </div>
        )}
        {currentMode === 'custom' && (
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] font-bold uppercase text-pink-900/70 mb-1">Dari</label>
              <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="custom-input w-full rounded-lg py-2 px-3 text-sm" />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase text-pink-900/70 mb-1">Sampai</label>
              <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="custom-input w-full rounded-lg py-2 px-3 text-sm" />
            </div>
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex gap-2">
        <button onClick={handleShow} className="flex-1 bg-gradient-to-r from-pink-400 to-rose-400 hover:from-pink-500 hover:to-rose-500 text-white font-semibold py-2 px-3 rounded-xl text-xs">
          📊 Tampilkan Data
        </button>
        <button onClick={downloadAsPNG} disabled={downloading} className="flex-1 bg-white/80 hover:bg-white disabled:opacity-50 text-pink-950 font-semibold py-2 px-3 rounded-xl border border-pink-200/80 text-xs">
          {downloading ? '⏳ Proses...' : '📥 Cetak / Simpan PNG'}
        </button>
      </div>

      {/* Receipt Paper */}
      <div
        ref={receiptRef}
        className="receipt-paper rounded-2xl p-4 relative overflow-hidden font-mono text-pink-950"
        style={{ maxHeight: '600px', overflowY: 'auto' }}
      >
        {/* Header */}
        <div className="text-center border-b-2 border-dashed border-pink-300 pb-3 mb-3">
          <div className="text-xs font-black tracking-wide text-pink-500 uppercase mb-1">🖤 NPURE SO 🖤</div>
          <div className="text-[10px] font-bold text-pink-400 tracking-widest uppercase">Sales & Stock Receipt</div>
          <div className="mt-2 inline-block bg-pink-50 text-pink-600 px-3 py-0.5 rounded-full text-[11px] font-bold border border-pink-200">
            PERIODE: {data.meta.period_label}
          </div>
          <div className="mt-1 text-[10px] text-pink-700/70">Dibuat oleh: {data.meta.user_name}</div>
          <div className="text-[10px] text-pink-700/70">Tanggal Cetak: {data.meta.generated_at}</div>
        </div>

        {/* Summary */}
        <div className="bg-pink-50/60 p-2.5 rounded-lg border border-pink-200/60 mb-3 space-y-1.5 text-xs">
          <div className="flex justify-between"><span className="text-gray-600">📦 TOTAL SELL-OUT QTY</span><span className="font-mono font-bold">{data.summary.total_sell_out_qty} pcs</span></div>
          <div className="flex justify-between"><span className="text-gray-600">👥 TOTAL CUSTOMER</span><span className="font-mono font-bold">{data.summary.total_customer} org</span></div>
          <div className="flex justify-between"><span className="text-gray-600">💵 GROSS OMSET</span><span className="font-mono font-bold">{formatRupiah(data.summary.gross_omset)}</span></div>
          <div className="flex justify-between"><span className="text-gray-600">🏷 DISKON ({(data.summary.discount_rate * 100).toFixed(0)}%)</span><span className="font-mono font-bold text-rose-600">-{formatRupiah(data.summary.discount_amount)}</span></div>
        </div>

        {/* Net Omset */}
        <div className="my-3 p-2.5 bg-pink-100/70 border border-pink-300/80 rounded-lg text-center">
          <div className="text-[10px] font-extrabold uppercase text-pink-800 tracking-wider">NET OMSET</div>
          <div className="text-base font-black font-mono mt-0.5 text-pink-700">{formatRupiah(data.summary.net_omset)}</div>
        </div>

        {/* Stock Movement */}
        <div className="space-y-1 text-xs border-b border-dashed border-pink-300 pb-3">
          <div className="flex justify-between text-gray-600"><span>📥 TOTAL SELL-IN QTY</span><span className="font-mono font-bold text-emerald-600">{data.summary.total_sell_in_qty} pcs</span></div>
        </div>

        {/* Target Achievement */}
        <div className="mt-3 mb-3">
          <div className="text-[11px] font-black tracking-wider uppercase text-pink-600 border-b border-dashed border-pink-300 pb-1 mb-2">🎯 TARGET ACHIEVEMENT</div>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between text-gray-600"><span>Target Omset</span><span className="font-mono font-bold">{formatRupiah(data.target.target_omset)}</span></div>
            <div className="flex justify-between text-gray-600"><span>Tercapai</span><span className="font-mono font-bold text-emerald-600">{formatRupiah(data.target.achieved_omset)}</span></div>
            <div className="flex justify-between text-gray-600"><span>Achievement %</span><span className="font-mono font-bold text-pink-600">{data.target.achievement_pct.toFixed(2)}%</span></div>
            <div className="flex justify-between text-gray-600"><span>Sisa Target</span><span className="font-mono font-bold text-rose-600">{formatRupiah(data.target.remaining_omset)}</span></div>
            <div className="mt-2 progress-bar-track">
              <div className="progress-bar-fill" style={{ width: `${Math.min(data.target.achievement_pct, 100)}%` }} />
            </div>
          </div>
        </div>

        {/* Focus Products */}
        {data.focus_products.length > 0 && (
          <div className="mt-3 mb-3">
            <div className="text-[11px] font-black tracking-wider uppercase text-violet-600 border-b border-dashed border-pink-300 pb-1 mb-2">🌟 FOCUS PRODUCT PROGRESS</div>
            <div className="space-y-2">
              {data.focus_products.map((fp) => (
                <div key={fp.product_id} className="bg-violet-50/60 p-2 rounded-md border border-violet-200/60">
                  <div className="font-bold text-gray-800 text-xs mb-1">{fp.product_name}</div>
                  <div className="space-y-0.5 text-[10px] text-gray-600">
                    <div className="flex justify-between"><span>Target: <b>{fp.target_qty}</b> pcs</span><span>Terjual: <b className="text-emerald-600">{fp.sold_qty}</b> pcs</span></div>
                    <div className="flex justify-between"><span>Achievement: <b className="text-pink-600">{fp.achievement_pct.toFixed(1)}%</b></span><span>Sisa: <b className="text-rose-600">{fp.remaining_qty}</b> pcs</span></div>
                    <div className="flex justify-between"><span>Contribution to Sales: <b className="text-violet-600">{fp.contribution_to_sales_pct.toFixed(1)}%</b></span></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Product Breakdown */}
        {data.product_details.length > 0 && (
          <div className="mt-3 mb-3">
            <div className="text-[11px] font-black tracking-wider uppercase text-pink-600 border-b border-dashed border-pink-300 pb-1 mb-2">📋 RINCIAN PER PRODUK</div>
            <div className="overflow-x-auto">
              <table className="w-full text-[10px]">
                <thead><tr className="border-b border-pink-200"><th className="text-left py-1 text-gray-600">Produk</th><th className="text-right text-gray-600">Qty</th><th className="text-right text-gray-600">Omset</th></tr></thead>
                <tbody>
                  {data.product_details.map((p, i) => (
                    <tr key={i} className="border-b border-pink-100/60">
                      <td className="py-1 text-gray-800 font-medium truncate max-w-[140px]">{p.product_name}</td>
                      <td className="text-right font-mono text-gray-700">{p.sell_out_qty}</td>
                      <td className="text-right font-mono text-gray-700">{formatRupiah(p.sell_out_omset)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Opname Logs */}
        {data.opname_logs.length > 0 && (
          <div className="mt-3 mb-3">
            <div className="text-[11px] font-black tracking-wider uppercase text-amber-600 border-b border-dashed border-pink-300 pb-1 mb-2">📝 STOCK OPNAME LOG</div>
            <div className="space-y-1 text-[10px]">
              {data.opname_logs.map((o, i) => (
                <div key={i} className="bg-amber-50/50 p-1.5 rounded border border-amber-200/60">
                  <div className="flex justify-between">
                    <span className="text-gray-700"><b>{o.opname_date}</b> ({o.opname_type})</span>
                    <span className={`font-mono font-bold ${o.difference < 0 ? 'text-rose-600' : o.difference > 0 ? 'text-emerald-600' : 'text-gray-600'}`}>{o.difference > 0 ? '+' : ''}{o.difference}</span>
                  </div>
                  <div className="text-gray-600">Produk: {o.product_name}</div>
                  {o.reason && <div className="text-gray-500 italic">Alasan: {o.reason}</div>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-6 pt-3 border-t-2 border-dashed border-pink-300 text-center text-[10px] text-pink-500/70 space-y-1">
          <div>*** TERIMA KASIH ***</div>
          <div>*** KEEP UP THE GOOD WORK ***</div>
          <div className="font-mono text-[9px] mt-2">Generated by NPURE SO · {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
        </div>

        <hr className="receipt-tear-line" />
        <div className="text-center text-[10px] text-gray-500 mt-4">
          <div>Diverifikasi oleh:</div>
          <div className="mt-6 border-b border-dotted border-gray-400 mx-auto w-2/3" />
          <div className="mt-1">(Nama & Tanda Tangan)</div>
        </div>
      </div>
    </div>
  )
}
