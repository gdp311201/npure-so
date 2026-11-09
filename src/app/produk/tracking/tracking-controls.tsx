'use client'

import { useState } from 'react'
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
  const [currentMode, setCurrentMode] = useState(mode)
  const [month, setMonth] = useState(Number(searchParams.month) || getCurrentMonth())
  const [year, setYear] = useState(Number(searchParams.year) || getCurrentYear())
  const [date, setDate] = useState(searchParams.date || getTodayISO())
  const router = useRouter()

  const selectedProduct = products.find((p) => p.id === selectedProductId)
  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  )

  function selectProduct(productId: string) {
    const params = new URLSearchParams()
    params.set('productId', productId)
    params.set('mode', currentMode)
    if (currentMode === 'harian' || currentMode === 'mingguan') {
      params.set('date', date)
    } else {
      params.set('month', String(month))
      params.set('year', String(year))
    }
    router.push(`/laporan/tracking?${params.toString()}`)
    router.refresh()
  }

  function handleShow() {
    if (!selectedProductId) return
    const params = new URLSearchParams()
    params.set('productId', selectedProductId)
    params.set('mode', currentMode)
    if (currentMode === 'harian' || currentMode === 'mingguan') {
      params.set('date', date)
    } else {
      params.set('month', String(month))
      params.set('year', String(year))
    }
    router.push(`/laporan/tracking?${params.toString()}`)
    router.refresh()
  }

  function changeProduct() {
    setShowPicker(true)
  }

  return (
    <div className="space-y-3">
      {/* Product selector */}
      {!showPicker && selectedProduct ? (
        <div className="glass-card rounded-xl p-3 flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold uppercase text-pink-900/60">Produk</p>
            <p className="text-xs font-bold text-pink-950 truncate">{selectedProduct.name}</p>
          </div>
          <button
            onClick={changeProduct}
            className="glass-mini rounded-lg px-3 py-1.5 text-[10px] font-bold text-pink-950"
          >
            ↻ Ganti
          </button>
        </div>
      ) : (
        <div className="glass-mini rounded-xl p-3">
          <label className="block text-[10px] font-bold uppercase text-pink-900/70 mb-1">
            Pilih Produk
          </label>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="🔍 Cari produk..."
            autoFocus
            className="custom-input w-full rounded-lg py-2 px-3 text-sm mb-2"
          />
          <div className="max-h-48 overflow-y-auto space-y-1">
            {filteredProducts.length === 0 ? (
              <p className="text-[10px] text-pink-900/50 text-center py-2">Produk tidak ditemukan</p>
            ) : (
              filteredProducts.slice(0, 20).map((product) => (
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
        </div>
      )}

      {/* Period selector — only show when product is selected */}
      {selectedProductId && !showPicker && (
        <div className="glass-mini rounded-xl p-3">
          {/* Mode buttons */}
          <div className="grid grid-cols-3 gap-2 mb-2">
            {(['harian', 'mingguan', 'bulanan'] as const).map((m) => (
              <button
                key={m}
                onClick={() => setCurrentMode(m)}
                className={`py-1.5 px-2 rounded-lg text-[10px] font-bold uppercase transition ${
                  currentMode === m
                    ? 'bg-gradient-to-r from-pink-400 to-rose-400 text-white'
                    : 'bg-white/60 text-pink-950/70 border border-pink-200/60'
                }`}
              >
                {m === 'harian' ? '📅 Harian' : m === 'mingguan' ? '📆 Mingguan' : '📊 Bulanan'}
              </button>
            ))}
          </div>

          {/* Mode-specific inputs */}
          {currentMode === 'bulanan' ? (
            <div className="grid grid-cols-2 gap-2 mb-2">
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
            <div className="mb-2">
              <label className="block text-[10px] font-bold uppercase text-pink-900/70 mb-1">
                {currentMode === 'harian' ? 'Tanggal' : 'Tanggal (pilih hari apapun dalam minggu itu)'}
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="custom-input w-full rounded-lg py-2 px-3 text-sm"
              />
            </div>
          )}

          <button
            onClick={handleShow}
            className="w-full bg-gradient-to-r from-pink-400 to-rose-400 text-white font-bold py-2 px-4 rounded-lg text-xs"
          >
            📊 Tampilkan Mutasi
          </button>
        </div>
      )}
    </div>
  )
}
