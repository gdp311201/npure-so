'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'

interface Product {
  id: string
  name: string
  current_stock: number
}

interface OpnameItem {
  product_id: string
  product_name: string
  system_count: number
  physical_count: string
  reason: string
}

export default function OpnameForm({
  products,
  defaultDate,
}: {
  products: Product[]
  defaultDate: string
}) {
  const [date, setDate] = useState(defaultDate)
  const [opnameType, setOpnameType] = useState<'bulanan' | 'event'>('bulanan')
  const [search, setSearch] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const router = useRouter()

  const [items, setItems] = useState<OpnameItem[]>(
    products.map((p) => ({
      product_id: p.id,
      product_name: p.name,
      system_count: p.current_stock,
      physical_count: '',
      reason: '',
    }))
  )

  const filteredItems = useMemo(
    () =>
      items.filter((item) =>
        item.product_name.toLowerCase().includes(search.toLowerCase())
      ),
    [items, search]
  )

  const countedCount = items.filter((item) => item.physical_count !== '').length
  const diffCount = items.filter((item) => {
    if (item.physical_count === '') return false
    return (parseInt(item.physical_count) || 0) !== item.system_count
  }).length

  function updatePhysicalCount(productId: string, value: string) {
    setItems((prev) =>
      prev.map((item) => {
        if (item.product_id === productId) {
          const phys = parseInt(value) || 0
          const diff = phys - item.system_count
          return {
            ...item,
            physical_count: value,
            reason: diff === 0 ? '' : item.reason,
          }
        }
        return item
      })
    )
  }

  function updateReason(productId: string, value: string) {
    setItems((prev) =>
      prev.map((item) =>
        item.product_id === productId ? { ...item, reason: value } : item
      )
    )
  }

  function fillAllWithSystemCount() {
    setItems((prev) =>
      prev.map((item) => ({
        ...item,
        physical_count: item.system_count.toString(),
        reason: '',
      }))
    )
  }

  function getDifference(item: OpnameItem): number {
    if (item.physical_count === '') return 0
    return (parseInt(item.physical_count) || 0) - item.system_count
  }

  async function handleSave() {
    const counted = items.filter((item) => item.physical_count !== '')
    if (counted.length === 0) {
      setError('Belum ada produk yang dihitung')
      return
    }

    const itemsWithDiff = counted.filter((item) => {
      const phys = parseInt(item.physical_count) || 0
      return phys !== item.system_count
    })
    const itemsWithoutReason = itemsWithDiff.filter((item) => !item.reason)
    if (itemsWithoutReason.length > 0) {
      setError(`Ada ${itemsWithoutReason.length} produk dengan selisih tapi belum diisi alasan`)
      return
    }

    setSaving(true)
    setError(null)

    try {
      const payload = {
        opname_date: date,
        opname_type: opnameType,
        items: counted.map((item) => ({
          product_id: item.product_id,
          physical_count: parseInt(item.physical_count) || 0,
          system_count: item.system_count,
          reason: item.reason || null,
        })),
      }

      const response = await fetch('/api/opname', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Gagal menyimpan opname')

      setSuccess(
        `Opname tersimpan! ${result.opname_count} produk dihitung, ${result.adjustment_count} adjustment dibuat.`
      )
      setTimeout(() => {
        router.push('/dashboard')
        router.refresh()
      }, 2000)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-3">
      {/* Date + type */}
      <div className="glass-mini rounded-xl p-3 space-y-3">
        <div>
          <label className="block text-[10px] font-bold uppercase text-pink-900/70 mb-1">
            Tanggal Opname
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="custom-input w-full rounded-lg py-2 px-3 text-sm font-semibold"
          />
        </div>
        <div>
          <label className="block text-[10px] font-bold uppercase text-pink-900/70 mb-1">
            Tipe Opname
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setOpnameType('bulanan')}
              className={`py-2 rounded-lg text-xs font-bold transition ${
                opnameType === 'bulanan'
                  ? 'bg-gradient-to-r from-pink-400 to-rose-400 text-white'
                  : 'bg-white/60 text-pink-950 border border-pink-200/60'
              }`}
            >
              📅 Bulanan
            </button>
            <button
              onClick={() => setOpnameType('event')}
              className={`py-2 rounded-lg text-xs font-bold transition ${
                opnameType === 'event'
                  ? 'bg-gradient-to-r from-pink-400 to-rose-400 text-white'
                  : 'bg-white/60 text-pink-950 border border-pink-200/60'
              }`}
            >
              🎉 Event
            </button>
          </div>
        </div>
      </div>

      {/* Progress */}
      <div className="glass-card rounded-xl p-3">
        <div className="flex justify-between items-center text-xs">
          <span className="font-bold text-pink-950">
            Progress: {countedCount}/{items.length} produk
          </span>
          <span
            className={`font-semibold ${
              diffCount > 0 ? 'text-amber-600' : 'text-emerald-600'
            }`}
          >
            {diffCount > 0 ? `⚠️ ${diffCount} selisih` : '✓ Semua match'}
          </span>
        </div>
        <div className="progress-bar-track mt-2">
          <div
            className="progress-bar-fill"
            style={{
              width: `${items.length > 0 ? (countedCount / items.length) * 100 : 0}%`,
            }}
          />
        </div>
      </div>

      {/* Quick fill + search */}
      <div className="space-y-2">
        <button
          onClick={fillAllWithSystemCount}
          className="w-full glass-mini rounded-xl py-2 px-3 text-xs font-bold text-pink-950 border border-pink-200/60 hover:bg-white/60 transition"
        >
          ⚡ Isi Semua dengan System Count
        </button>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="🔍 Cari produk..."
          className="custom-input w-full rounded-xl py-2 px-3 text-sm"
        />
      </div>

      {/* Product list */}
      <div className="space-y-2">
        {filteredItems.length === 0 ? (
          <p className="text-xs text-pink-900/50 text-center py-4">Produk tidak ditemukan</p>
        ) : (
          filteredItems.map((item) => {
            const diff = getDifference(item)
            const isCounted = item.physical_count !== ''
            const hasDiff = isCounted && diff !== 0

            return (
              <div
                key={item.product_id}
                className={`glass-card rounded-xl p-3 ${hasDiff ? 'border-amber-300/60' : ''}`}
              >
                <div className="flex items-start justify-between mb-2">
                  <p className="text-xs font-bold text-pink-950 flex-1 pr-2">
                    {item.product_name}
                  </p>
                  <span className="text-[10px] text-pink-700/60 whitespace-nowrap">
                    System: {item.system_count}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    inputMode="numeric"
                    value={item.physical_count}
                    onChange={(e) => updatePhysicalCount(item.product_id, e.target.value)}
                    placeholder="Fisik..."
                    className="custom-input flex-1 rounded-lg py-1.5 px-2 text-sm font-semibold"
                    min="0"
                  />
                  <span className="text-[10px] text-pink-700/60">pcs</span>
                  {isCounted && (
                    <span
                      className={`text-[10px] font-bold px-2 py-1 rounded-full whitespace-nowrap ${
                        diff === 0
                          ? 'bg-emerald-100 text-emerald-700'
                          : diff > 0
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-rose-100 text-rose-700'
                      }`}
                    >
                      {diff === 0 ? '✓' : diff > 0 ? `+${diff}` : diff}
                    </span>
                  )}
                </div>
                {hasDiff && (
                  <input
                    type="text"
                    value={item.reason}
                    onChange={(e) => updateReason(item.product_id, e.target.value)}
                    placeholder="Alasan selisih (wajib)..."
                    className="custom-input w-full rounded-lg py-1.5 px-2 text-xs mt-2 border-amber-300/60"
                  />
                )}
              </div>
            )
          })
        )}
      </div>

      {/* Error / Success */}
      {error && (
        <div className="text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 rounded-xl py-2 px-3">
          ❌ {error}
        </div>
      )}
      {success && (
        <div className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl py-2 px-3">
          ✅ {success}
        </div>
      )}

      {/* Save button — sticky + amber theme */}
      <button
        onClick={handleSave}
        disabled={countedCount === 0 || saving}
        className="w-full bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-xl text-sm transition shadow-sm sticky bottom-20 z-30"
      >
        {saving
          ? '⏳ Menyimpan...'
          : `💾 Simpan Opname (${countedCount}/${items.length} produk)`}
      </button>
    </div>
  )
}
