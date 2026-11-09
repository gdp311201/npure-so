'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { BULAN_LIST, getCurrentMonth, getCurrentYear, getTodayISO, getTahunListDynamic } from '@/lib/utils/format'

interface Product {
  id: string
  name: string
}

export default function TrackingControls({
  products,
  selectedProductId,
  mode,
  searchParams,
}: {
  products: Product[]
  selectedProductId: string | null
  mode: string
  searchParams: any
}) {
  const [showPicker, setShowPicker] = useState(!selectedProductId)
  const [search, setSearch] = useState('')
  const [currentMode, setCurrentMode] = useState(mode === 'custom' ? 'custom' : 'bulanan')
  const [month, setMonth] = useState(Number(searchParams.month) || getCurrentMonth())
  const [year, setYear] = useState(Number(searchParams.year) || getCurrentYear())
  const [dateFrom, setDateFrom] = useState(searchParams.dateFrom || getTodayISO())
  const [dateTo, setDateTo] = useState(searchParams.dateTo || getTodayISO())
  const router = useRouter()

  // Safety net: when productId arrives from URL, hide picker so period selector shows
  useEffect(() => {
    if (selectedProductId) setShowPicker(false)
  }, [selectedProductId])

  const selectedProduct = products.find((p) => p.id === selectedProductId)
  const filteredProducts = search
    ? products.filter((p) => p.name.toLowerCase().includes(search.toLowerCase())).slice(0, 8)
    : []

  function buildParams(): URLSearchParams {
    const params = new URLSearchParams()
    if (selectedProductId) params.set('productId', selectedProductId)
    params.set('mode', currentMode)
    if (currentMode === 'custom') {
      params.set('dateFrom', dateFrom)
      params.set('dateTo', dateTo)
    } else {
      params.set('month', String(month))
      params.set('year', String(year))
    }
    return params
  }

  function selectProduct(productId: string) {
    const params = buildParams()
    params.set('productId', productId)
    router.push(`/produk/tracking?${params.toString()}`)
    router.refresh()
  }

  function handleShow() {
    if (!selectedProductId) return
    router.push(`/produk/tracking?${buildParams().toString()}`)
    router.refresh()
  }

  return (
    <div className="space-y-4">
      {/* === Product selector card === */}
      {!showPicker && selectedProduct ? (
        <div className="glass-card rounded-xl p-3 flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold uppercase text-pink-900/60">Produk</p>
            <p className="text-xs font-bold text-pink-950 truncate">{selectedProduct.name}</p>
          </div>
          <button
            onClick={() => { setShowPicker(true); setSearch('') }}
            className="glass-mini rounded-lg px-3 py-1.5 text-[10px] font-bold text-pink-950"
          >
            ↻ Ganti
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Search card */}
          <div className="glass-card rounded-xl p-3">
            <label className="block text-[10px] font-bold uppercase text-pink-900/70 mb-1">Pilih Produk</label>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="🔍 Ketik nama produk..."
              autoFocus
              className="custom-input w-full rounded-lg py-2 px-3 text-sm"
            />
          </div>

          {/* Dynamic results — separate card, only when search has text */}
          {search && (
            <div className="glass-mini rounded-xl p-2 max-h-[30vh] overflow-y-auto space-y-1">
              {filteredProducts.length === 0 ? (
                <p className="text-[10px] text-pink-900/50 text-center py-2">Produk tidak ditemukan</p>
              ) : (
                filteredProducts.map((product) => (
                  <button
                    key={product.id}
                    onClick={() => selectProduct(product.id)}
                    className="w-full glass-mini rounded-lg p-2 text-left hover:bg-white/10 transition"
                  >
                    <p className="text-xs font-bold text-pink-950 truncate">{product.name}</p>
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      )}

      {/* === Period selector card — only when product is selected === */}
      {selectedProductId && !showPicker && (
        <div className="glass-card rounded-xl p-3">
          {/* 2 mode buttons: Bulanan + Custom Range */}
          <div className="grid grid-cols-2 gap-2 mb-3">
            <button
              onClick={() => setCurrentMode('bulanan')}
              className={`py-2 px-2 rounded-lg text-[10px] font-bold uppercase transition ${
                currentMode === 'bulanan'
                  ? 'bg-gradient-to-r from-pink-400 to-rose-400 text-white shadow-lg shadow-pink-500/30'
                  : 'glass-mini text-pink-950/70'
              }`}
            >
              📊 Bulanan
            </button>
            <button
              onClick={() => setCurrentMode('custom')}
              className={`py-2 px-2 rounded-lg text-[10px] font-bold uppercase transition ${
                currentMode === 'custom'
                  ? 'bg-gradient-to-r from-pink-400 to-rose-400 text-white shadow-lg shadow-pink-500/30'
                  : 'glass-mini text-pink-950/70'
              }`}
            >
              🎯 Custom Range
            </button>
          </div>

          {/* Mode: Bulanan — month + year dropdowns */}
          {currentMode === 'bulanan' ? (
            <div className="grid grid-cols-2 gap-2 mb-3">
              <div>
                <label className="block text-[10px] font-bold uppercase text-pink-900/70 mb-1">Bulan</label>
                <select
                  value={month}
                  onChange={(e) => setMonth(Number(e.target.value))}
                  className="custom-input w-full rounded-lg py-2 px-3 text-sm"
                >
                  {BULAN_LIST.map((b, i) => <option key={b} value={i + 1}>{b}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase text-pink-900/70 mb-1">Tahun</label>
                <select
                  value={year}
                  onChange={(e) => setYear(Number(e.target.value))}
                  className="custom-input w-full rounded-lg py-2 px-3 text-sm"
                >
                  {getTahunListDynamic().map((y) => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
            </div>
          ) : (
            /* Mode: Custom Range — date from + date to */
            <div className="grid grid-cols-2 gap-2 mb-3">
              <div>
                <label className="block text-[10px] font-bold uppercase text-pink-900/70 mb-1">Dari Tanggal</label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="custom-input w-full rounded-lg py-2 px-3 text-sm"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase text-pink-900/70 mb-1">Sampai Tanggal</label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="custom-input w-full rounded-lg py-2 px-3 text-sm"
                />
              </div>
            </div>
          )}

          <button
            onClick={handleShow}
            className="w-full bg-gradient-to-r from-pink-400 to-rose-400 text-white font-bold py-2.5 px-4 rounded-lg text-xs shadow-lg shadow-pink-500/30"
          >
            📊 Tampilkan Mutasi
          </button>
        </div>
      )}
    </div>
  )
}
