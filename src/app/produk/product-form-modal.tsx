'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatRupiah } from '@/lib/utils/format'

interface Product {
  id: string
  name: string
  is_active: boolean
  current_price: number | bigint | null
  current_stock: number
  stock_status: string
  low_stock_threshold: number
}

export default function ProductFormModal({
  mode,
  product,
  onClose,
  onSaved,
}: {
  mode: 'add' | 'edit'
  product?: Product | null
  onClose: () => void
  onSaved: () => void
}) {
  const [name, setName] = useState(product?.name || '')
  const [price, setPrice] = useState(product?.current_price ? String(Number(product.current_price)) : '')
  const [initialStock, setInitialStock] = useState('0')
  const [showPriceChange, setShowPriceChange] = useState(false)
  const [newPrice, setNewPrice] = useState('')
  const [effectiveDate, setEffectiveDate] = useState(
    new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Jakarta' })
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleAdd() {
    if (!name.trim()) { setError('Nama produk wajib diisi'); return }
    if (!price || Number(price) <= 0) { setError('Harga wajib diisi dan lebih dari 0'); return }
    setLoading(true)
    setError(null)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const today = new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Jakarta' })

      // 1. Insert product
      const { data: newProduct, error: prodError } = await supabase
        .from('products')
        .insert({ name: name.trim(), is_active: true, created_by: user.id })
        .select('id')
        .single()
      if (prodError) throw new Error(prodError.message)

      // 2. Insert price
      const { error: priceError } = await supabase
        .from('product_prices')
        .insert({ product_id: newProduct.id, price: Number(price), effective_date: today, created_by: user.id })
      if (priceError) throw new Error(priceError.message)

      // 3. Optional initial stock
      const stockQty = Number(initialStock) || 0
      if (stockQty > 0) {
        const { error: stockError } = await supabase
          .from('stock_transactions')
          .insert({
            product_id: newProduct.id, type: 'initial_stock', qty: stockQty,
            transaction_date: today, unit_price: Number(price),
            note: 'Initial stock saat tambah produk', created_by: user.id,
          })
        if (stockError) throw new Error(stockError.message)
      }

      onSaved()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleEdit() {
    if (!product) return
    if (!name.trim()) { setError('Nama produk wajib diisi'); return }
    setLoading(true)
    setError(null)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Update name if changed
      if (name.trim() !== product.name) {
        const { error: nameError } = await supabase
          .from('products')
          .update({ name: name.trim(), updated_by: user.id })
          .eq('id', product.id)
        if (nameError) throw new Error(nameError.message)
      }

      // Add new price if provided
      if (showPriceChange && newPrice && Number(newPrice) > 0) {
        const { error: priceError } = await supabase
          .from('product_prices')
          .insert({
            product_id: product.id, price: Number(newPrice),
            effective_date: effectiveDate, created_by: user.id,
          })
        if (priceError) throw new Error(priceError.message)
      }

      onSaved()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 glass-modal-backdrop flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        className="glass-modal-card rounded-t-2xl sm:rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-pink-950">
              {mode === 'add' ? '➕ Tambah Produk Baru' : '✏ Edit Produk'}
            </h3>
            <button onClick={onClose} className="text-pink-700/60 hover:text-pink-950 text-lg">✕</button>
          </div>

          {/* Name */}
          <div>
            <label className="block text-[10px] font-bold uppercase text-pink-900/70 mb-1">Nama Produk *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contoh: Cica Clear Pad 100gr"
              className="custom-input w-full rounded-lg py-2 px-3 text-sm"
            />
          </div>

          {mode === 'add' ? (
            <>
              <div>
                <label className="block text-[10px] font-bold uppercase text-pink-900/70 mb-1">Harga (Rp) *</label>
                <input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="Contoh: 99000"
                  className="custom-input w-full rounded-lg py-2 px-3 text-sm"
                  min="1"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase text-pink-900/70 mb-1">Stok Awal (opsional)</label>
                <input
                  type="number"
                  value={initialStock}
                  onChange={(e) => setInitialStock(e.target.value)}
                  className="custom-input w-full rounded-lg py-2 px-3 text-sm"
                  min="0"
                />
                <p className="text-[9px] text-pink-700/50 mt-0.5">Default 0. Isi kalau ada barang fisik.</p>
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="block text-[10px] font-bold uppercase text-pink-900/70 mb-1">Harga Saat Ini</label>
                <div className="glass-mini rounded-lg py-2 px-3 text-sm font-bold text-pink-950">
                  {product?.current_price ? formatRupiah(Number(product.current_price)) : 'Rp —'}
                </div>
              </div>
              <button
                onClick={() => setShowPriceChange(!showPriceChange)}
                className="text-xs font-bold text-pink-600 hover:text-pink-700"
              >
                {showPriceChange ? '− Batal Ubah Harga' : '+ Ubah Harga'}
              </button>
              {showPriceChange && (
                <div className="space-y-2 pl-2 border-l-2 border-pink-200/50">
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-pink-900/70 mb-1">Harga Baru (Rp) *</label>
                    <input
                      type="number"
                      value={newPrice}
                      onChange={(e) => setNewPrice(e.target.value)}
                      placeholder="Contoh: 109000"
                      className="custom-input w-full rounded-lg py-2 px-3 text-sm"
                      min="1"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-pink-900/70 mb-1">Efektif Tanggal</label>
                    <input
                      type="date"
                      value={effectiveDate}
                      onChange={(e) => setEffectiveDate(e.target.value)}
                      className="custom-input w-full rounded-lg py-2 px-3 text-sm"
                    />
                  </div>
                  <p className="text-[9px] text-pink-700/50">
                    Harga lama tetap tersimpan. Harga baru berlaku dari tanggal efektif.
                  </p>
                </div>
              )}
            </>
          )}

          {error && (
            <div className="text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 rounded-lg py-2 px-3">
              ❌ {error}
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <button
              onClick={onClose}
              className="flex-1 bg-white/60 rounded-lg py-2.5 text-xs font-bold text-pink-950 border border-pink-200/60"
            >
              Batal
            </button>
            <button
              onClick={mode === 'add' ? handleAdd : handleEdit}
              disabled={loading}
              className="flex-1 bg-gradient-to-r from-pink-400 to-rose-400 hover:from-pink-500 hover:to-rose-500 disabled:opacity-50 text-white font-bold rounded-lg py-2.5 text-xs"
            >
              {loading ? '⏳...' : '💾 Simpan'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
