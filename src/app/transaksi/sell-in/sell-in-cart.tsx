'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { formatRupiah } from '@/lib/utils/format'

interface Product {
  id: string
  name: string
  current_price: number | bigint
  current_stock: number
}

interface CartItem {
  product_id: string
  name: string
  price: number
  qty: number
}

export default function SellInCart({
  products,
  defaultDate,
}: {
  products: Product[]
  defaultDate: string
}) {
  const [date, setDate] = useState(defaultDate)
  const [cart, setCart] = useState<CartItem[]>([])
  const [note, setNote] = useState('')
  const [showPicker, setShowPicker] = useState(false)
  const [search, setSearch] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  )

  function addToCart(product: Product) {
    const price = Number(product.current_price)
    setCart((prev) => {
      const existing = prev.find((item) => item.product_id === product.id)
      if (existing) {
        return prev.map((item) =>
          item.product_id === product.id ? { ...item, qty: item.qty + 1 } : item
        )
      }
      return [...prev, { product_id: product.id, name: product.name, price, qty: 1 }]
    })
  }

  function updateQty(productId: string, delta: number) {
    setCart((prev) =>
      prev
        .map((item) => (item.product_id === productId ? { ...item, qty: item.qty + delta } : item))
        .filter((item) => item.qty > 0)
    )
  }

  // ✅ FIX: Don't remove item when input is cleared. Only remove via 🗑 button.
  function setQtyDirect(productId: string, qty: number) {
    if (isNaN(qty) || qty <= 0) return
    setCart((prev) => prev.map((item) => (item.product_id === productId ? { ...item, qty } : item)))
  }

  function removeItem(productId: string) {
    setCart((prev) => prev.filter((item) => item.product_id !== productId))
  }

  function closePicker() {
    setShowPicker(false)
    setSearch('')
  }

  const totalQty = cart.reduce((sum, item) => sum + item.qty, 0)
  const totalValue = cart.reduce((sum, item) => sum + item.price * item.qty, 0)

  async function handleSave() {
    if (cart.length === 0) { setError('Keranjang masih kosong'); return }
    setSaving(true)
    setError(null)
    try {
      const response = await fetch('/api/sell-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transaction_date: date, items: cart, note: note || null }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Gagal menyimpan')
      setCart([])
      setNote('')
      router.push('/dashboard')
      router.refresh()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-3">
      {/* Date picker */}
      <div className="glass-mini rounded-xl p-3">
        <label className="block text-[10px] font-bold uppercase text-pink-900/70 mb-1">Tanggal Barang Masuk</label>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="custom-input w-full rounded-lg py-2 px-3 text-sm font-semibold" />
      </div>

      {/* Cart header */}
      <div className="flex items-center justify-between px-1">
        <h2 className="text-xs font-bold text-pink-950 flex items-center gap-1">📥 Keranjang</h2>
        <span className="text-[10px] text-pink-700/60 font-semibold">{cart.length} item{cart.length !== 1 ? 's' : ''} · {totalQty} pcs</span>
      </div>

      {products.length === 0 && (
        <div className="glass-card rounded-2xl p-4 text-center">
          <p className="text-xs text-rose-700 font-bold">⚠️ Tidak ada produk tersedia</p>
          <p className="text-[10px] text-pink-900/50 mt-1">Pastikan database sudah di-seed</p>
        </div>
      )}

      {/* Cart items */}
      {cart.length === 0 && !showPicker ? (
        <div className="glass-card rounded-2xl p-6 text-center">
          <div className="text-3xl mb-2 opacity-50">📥</div>
          <p className="text-xs font-bold text-pink-900/70">Keranjang kosong</p>
          <p className="text-[10px] text-pink-900/50 mt-1">Klik "Tambah Produk" untuk mulai</p>
        </div>
      ) : cart.length > 0 ? (
        <div className="space-y-2">
          {cart.map((item) => (
            <div key={item.product_id} className="glass-card rounded-xl p-3">
              <div className="flex items-start justify-between mb-2">
                <p className="text-xs font-bold text-pink-950 flex-1 pr-2">{item.name}</p>
                <button onClick={() => removeItem(item.product_id)} className="text-rose-500 text-sm hover:text-rose-700">🗑</button>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button onClick={() => updateQty(item.product_id, -1)} className="w-6 h-6 rounded-lg bg-white/60 text-pink-950 font-bold text-sm flex items-center justify-center hover:bg-white">−</button>
                  {/* ✅ FIX: defaultValue + key — allows free typing, remounts when +/- changes qty */}
                  <input
                    key={`${item.product_id}-${item.qty}`}
                    type="number"
                    defaultValue={item.qty}
                    onChange={(e) => {
                      const val = parseInt(e.target.value)
                      if (!isNaN(val) && val > 0) setQtyDirect(item.product_id, val)
                    }}
                    className="w-14 text-center text-sm font-bold text-pink-950 bg-white/60 rounded-lg py-0.5 border border-pink-200/60"
                    min="1"
                  />
                  <button onClick={() => updateQty(item.product_id, 1)} className="w-6 h-6 rounded-lg bg-white/60 text-pink-950 font-bold text-sm flex items-center justify-center hover:bg-white">+</button>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-pink-700/60">{formatRupiah(item.price)} × {item.qty}</p>
                  <p className="text-sm font-bold text-pink-950">{formatRupiah(item.price * item.qty)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {/* Toggle button */}
      {products.length > 0 && (
        <button
          onClick={() => showPicker ? closePicker() : setShowPicker(true)}
          className={`w-full rounded-xl py-2.5 px-4 text-sm font-bold transition ${showPicker ? 'bg-white/60 text-pink-950 border border-pink-200/60' : 'glass-mini text-pink-950 border border-pink-200/60 hover:bg-white/60'}`}
        >
          {showPicker ? '✕ Tutup Pencarian' : '+ Tambah Produk'}
        </button>
      )}

      {/* INLINE Product Picker */}
      {showPicker && (
        <div className="space-y-2">
          <div className="glass-card rounded-xl p-3">
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="🔍 Cari produk..." autoFocus className="custom-input w-full rounded-xl py-2 px-3 text-sm" />
          </div>
          <div className="max-h-[35vh] overflow-y-auto space-y-1">
            {filteredProducts.length === 0 ? (
              <p className="text-xs text-pink-900/50 text-center py-4">Produk tidak ditemukan</p>
            ) : (
              filteredProducts.map((product) => (
                <button key={product.id} onClick={() => { addToCart(product); closePicker() }} className="w-full glass-mini rounded-xl p-3 flex items-center justify-between hover:bg-white/60 transition text-left">
                  <div className="flex-1 min-w-0 pr-2">
                    <p className="text-xs font-bold text-pink-950 truncate">{product.name}</p>
                    <p className="text-[10px] text-pink-700/60">{formatRupiah(Number(product.current_price))} · Stock: {product.current_stock}</p>
                  </div>
                  <div className="text-pink-400 font-bold text-lg">+</div>
                </button>
              ))
            )}
          </div>
        </div>
      )}

      {/* Note field */}
      {cart.length > 0 && !showPicker && (
        <div className="glass-mini rounded-xl p-3">
          <label className="block text-[10px] font-bold uppercase text-pink-900/70 mb-1">Catatan (opsional)</label>
          <input type="text" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Contoh: Restock dari brand NPURE" className="custom-input w-full rounded-lg py-2 px-3 text-sm" />
        </div>
      )}

      {/* Summary */}
      {cart.length > 0 && !showPicker && (
        <div className="glass-card rounded-2xl p-4 space-y-1.5">
          <div className="flex justify-between text-xs text-pink-800/70"><span>Total Qty</span><span className="font-mono font-semibold">{totalQty} pcs</span></div>
          <div className="flex justify-between text-xs text-pink-800/70"><span>Total Nilai (HET)</span><span className="font-mono font-semibold">{formatRupiah(totalValue)}</span></div>
          <div className="border-t border-pink-200/50 pt-1.5 flex justify-between items-center"><span className="text-sm font-bold text-pink-950">TOTAL BARANG MASUK</span><span className="text-lg font-black text-emerald-600 font-mono">{totalQty} pcs</span></div>
        </div>
      )}

      {error && <div className="text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 rounded-xl py-2 px-3">❌ {error}</div>}

      {!showPicker && (
        <button onClick={handleSave} disabled={cart.length === 0 || saving} className="w-full bg-gradient-to-r from-emerald-400 to-emerald-500 hover:from-emerald-500 hover:to-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-xl text-sm transition shadow-sm">
          {saving ? '⏳ Menyimpan...' : `💾 Simpan Barang Masuk (${totalQty} pcs)`}
        </button>
      )}
    </div>
  )
}
