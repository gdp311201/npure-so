'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'

interface Product {
  id: string
  name: string
  current_stock: number
}

// ✅ Single product row — sub-component for clean local state management
function ProductRow({
  product,
  physical,
  onSetPhysical,
}: {
  product: Product
  physical: number | null
  onSetPhysical: (productId: string, value: number | null) => void
}) {
  const system = product.current_stock
  const diff = physical === null ? null : physical - system
  const isMismatch = diff !== null && diff !== 0

  return (
    <div className="glass-card rounded-xl p-3">
      <div className="flex items-start justify-between mb-2">
        <p className="text-xs font-bold text-pink-950 flex-1 pr-2 leading-tight">{product.name}</p>
        {isMismatch && (
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap ${
            diff! > 0 ? 'bg-rose-100/80 text-rose-700' : 'bg-amber-100/80 text-amber-700'
          }`}>
            {diff! > 0 ? `+${diff}` : diff} selisih
          </span>
        )}
      </div>
      <div className="grid grid-cols-2 gap-2 items-center">
        <div>
          <p className="text-[9px] font-bold uppercase text-pink-900/60">System</p>
          <p className="text-sm font-bold text-pink-950 font-mono">{system}</p>
        </div>
        <div>
          <p className="text-[9px] font-bold uppercase text-pink-900/60 mb-0.5">Fisik</p>
          <input
            type="number"
            inputMode="numeric"
            value={physical ?? ''}
            onChange={(e) => {
              const val = e.target.value
              if (val === '') {
                onSetPhysical(product.id, null)
              } else {
                const n = parseInt(val)
                if (!isNaN(n) && n >= 0) onSetPhysical(product.id, n)
              }
            }}
            placeholder="..."
            className="custom-input w-full rounded-lg py-1 px-2 text-sm font-bold font-mono text-pink-950"
            min="0"
          />
        </div>
      </div>
    </div>
  )
}

export default function InputOpname({
  products,
  defaultDate,
}: {
  products: Product[]
  defaultDate: string
}) {
  const [date, setDate] = useState(defaultDate)
  const [opnameType, setOpnameType] = useState<'bulanan' | 'event'>('bulanan')
  const [physicalCounts, setPhysicalCounts] = useState<Record<string, number | null>>({})
  const [search, setSearch] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  // Filtered products based on search
  const filteredProducts = useMemo(() => {
    if (!search) return products
    return products.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()))
  }, [products, search])

  // Stats
  const filledCount = Object.values(physicalCounts).filter((v) => v !== null).length
  const mismatchCount = products.filter((p) => {
    const phys = physicalCounts[p.id]
    return phys !== null && phys !== p.current_stock
  }).length
  const matchCount = filledCount - mismatchCount

  function setPhysical(productId: string, value: number | null) {
    setPhysicalCounts((prev) => ({ ...prev, [productId]: value }))
  }

  function fillAllWithSystem() {
    const all: Record<string, number | null> = {}
    products.forEach((p) => { all[p.id] = p.current_stock })
    setPhysicalCounts(all)
  }

  function clearAll() {
    setPhysicalCounts({})
  }

  async function handleSave() {
    if (filledCount === 0) {
      setError('Belum ada produk yang dihitung fisiknya')
      return
    }
    setSaving(true)
    setError(null)
    try {
      const items = products
        .filter((p) => physicalCounts[p.id] !== null)
        .map((p) => ({
          product_id: p.id,
          physical_count: physicalCounts[p.id] as number,
          system_count: p.current_stock,
          difference: (physicalCounts[p.id] as number) - p.current_stock,
        }))

      const response = await fetch('/api/opname', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          opname_date: date,
          opname_type: opnameType,
          items,
        }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Gagal menyimpan opname')

      // Switch to history tab after save
      router.push('/transaksi/opname?tab=history')
      router.refresh()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-3">
      {/* === Top: Date + Type === */}
      <div className="glass-card rounded-xl p-3 space-y-3">
        <div>
          <label className="block text-[10px] font-bold uppercase text-pink-900/70 mb-1">Tanggal Opname</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="custom-input w-full rounded-lg py-2 px-3 text-sm font-semibold"
          />
        </div>
        <div>
          <label className="block text-[10px] font-bold uppercase text-pink-900/70 mb-1">Tipe Opname</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setOpnameType('bulanan')}
              className={`py-2 rounded-lg text-[11px] font-bold uppercase transition ${
                opnameType === 'bulanan'
                  ? 'bg-gradient-to-r from-pink-400 to-rose-400 text-white'
                  : 'glass-mini text-pink-950/70'
              }`}
            >
              📅 Bulanan
            </button>
            <button
              onClick={() => setOpnameType('event')}
              className={`py-2 rounded-lg text-[11px] font-bold uppercase transition ${
                opnameType === 'event'
                  ? 'bg-gradient-to-r from-pink-400 to-rose-400 text-white'
                  : 'glass-mini text-pink-950/70'
              }`}
            >
              🎉 Event
            </button>
          </div>
        </div>
      </div>

      {/* === Progress + Actions === */}
      <div className="glass-mini rounded-xl p-3 space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase text-pink-900/60">Progress</p>
            <p className="text-sm font-bold text-pink-950">
              {filledCount}/{products.length} produk
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-bold uppercase text-pink-900/60">Status</p>
            <p className={`text-sm font-bold ${mismatchCount > 0 ? 'text-amber-600' : 'text-emerald-500'}`}>
              {mismatchCount > 0 ? `${mismatchCount} selisih` : filledCount > 0 ? '✓ Semua match' : 'Belum mulai'}
            </p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={fillAllWithSystem}
            className="py-2 rounded-lg text-[10px] font-bold bg-white/60 text-pink-950 border border-pink-200/60"
          >
            ⚡ Isi Semua = System
          </button>
          <button
            onClick={clearAll}
            disabled={filledCount === 0}
            className="py-2 rounded-lg text-[10px] font-bold bg-white/60 text-pink-950 border border-pink-200/60 disabled:opacity-40"
          >
            🗑 Reset Semua
          </button>
        </div>
      </div>

      {/* === Search === */}
      <div className="glass-card rounded-xl p-2">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="🔍 Cari produk..."
          className="custom-input w-full rounded-lg py-2 px-3 text-sm"
        />
      </div>

      {/* === Product list === */}
      {filteredProducts.length === 0 ? (
        <div className="glass-card rounded-2xl p-6 text-center">
          <p className="text-xs text-pink-900/50">Produk tidak ditemukan</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredProducts.map((product) => (
            <ProductRow
              key={product.id}
              product={product}
              physical={physicalCounts[product.id] ?? null}
              onSetPhysical={setPhysical}
            />
          ))}
        </div>
      )}

      {/* === Error === */}
      {error && (
        <div className="text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 rounded-xl py-2 px-3">
          ❌ {error}
        </div>
      )}

      {/* === Sticky Simpan button — stays visible while scrolling === */}
      {/* Spacer to prevent button overlapping last product when fully scrolled */}
      <div className="h-24" aria-hidden />

      <div className="fixed bottom-24 left-0 right-0 z-30 px-4 pb-2 pointer-events-none">
        <div className="max-w-md mx-auto pointer-events-auto">
          <div className="glass-card rounded-2xl p-3 shadow-2xl shadow-pink-500/20 backdrop-blur-xl">
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="text-[10px] font-bold uppercase text-pink-900/70">Progress</p>
                <p className="text-xs font-bold text-pink-950">
                  {filledCount}/{products.length} diisi · {mismatchCount} selisih
                </p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold uppercase text-pink-900/70">Status</p>
                <p className={`text-xs font-bold ${mismatchCount > 0 ? 'text-amber-500' : 'text-emerald-400'}`}>
                  {mismatchCount > 0 ? '⚠ Ada Selisih' : filledCount > 0 ? '✓ Match' : 'Kosong'}
                </p>
              </div>
            </div>
            <button
              onClick={handleSave}
              disabled={filledCount === 0 || saving}
              className="w-full bg-gradient-to-r from-pink-400 to-rose-400 hover:from-pink-500 hover:to-rose-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-xl text-sm transition shadow-lg shadow-pink-500/30"
            >
              {saving
                ? '⏳ Menyimpan...'
                : `💾 Simpan Opname (${filledCount} produk)`}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
