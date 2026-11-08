'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface FocusProduct {
  product_id: string
  product_name: string
  target_qty: number
  sold_qty: number
  achievement_pct: number
  remaining_qty: number
  contribution_to_sales_pct: number
}

interface Product {
  id: string
  name: string
}

export default function FocusProductsSection({
  focusProducts,
  allProducts,
  defaultPeriod,
}: {
  focusProducts: FocusProduct[]
  allProducts: Product[]
  defaultPeriod: string
}) {
  const [showPicker, setShowPicker] = useState(false)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const focusProductIds = new Set(focusProducts.map((fp) => fp.product_id))
  const availableProducts = useMemo(
    () =>
      allProducts
        .filter((p) => !focusProductIds.has(p.id))
        .filter((p) => p.name.toLowerCase().includes(search.toLowerCase())),
    [allProducts, focusProductIds, search]
  )

  async function handleAddFocus(productId: string, productName: string) {
    const targetStr = prompt(`Target qty untuk ${productName}?`, '20')
    if (!targetStr) return
    const target = parseInt(targetStr)
    if (!target || target <= 0) {
      setError('Target qty harus lebih dari 0')
      return
    }

    setLoading(true)
    setError(null)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { error: insertError } = await supabase
        .from('focus_product_targets')
        .insert({
          period: defaultPeriod,
          product_id: productId,
          target_qty: target,
          created_by: user.id,
        })
      if (insertError) throw new Error(insertError.message)

      setShowPicker(false)
      setSearch('')
      router.refresh()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleUpdateTarget(productId: string, currentTarget: number) {
    const newTargetStr = prompt('Target qty baru:', String(currentTarget))
    if (!newTargetStr) return
    const newTarget = parseInt(newTargetStr)
    if (!newTarget || newTarget <= 0) {
      setError('Target qty harus lebih dari 0')
      return
    }

    setLoading(true)
    setError(null)
    try {
      const supabase = createClient()
      const { error: updateError } = await supabase
        .from('focus_product_targets')
        .update({ target_qty: newTarget })
        .eq('period', defaultPeriod)
        .eq('product_id', productId)
      if (updateError) throw new Error(updateError.message)
      router.refresh()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleRemoveFocus(productId: string) {
    setLoading(true)
    setError(null)
    try {
      const supabase = createClient()
      const { error: deleteError } = await supabase
        .from('focus_product_targets')
        .delete()
        .eq('period', defaultPeriod)
        .eq('product_id', productId)
      if (deleteError) throw new Error(deleteError.message)
      router.refresh()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="glass-card rounded-2xl p-4 space-y-3">
      <h3 className="text-xs font-bold uppercase text-pink-900/70">🌟 Focus Products</h3>

      {error && (
        <div className="text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 rounded-lg py-2 px-3">
          ❌ {error}
        </div>
      )}

      {focusProducts.length === 0 ? (
        <div className="text-center py-4">
          <p className="text-xs text-pink-900/50">Belum ada focus product bulan ini</p>
        </div>
      ) : (
        <div className="space-y-2">
          {focusProducts.map((fp) => (
            <div key={fp.product_id} className="glass-focus rounded-xl p-3">
              <div className="flex items-start justify-between mb-2">
                <p className="text-xs font-bold text-pink-950 flex-1 pr-2">{fp.product_name}</p>
                <button
                  onClick={() => handleRemoveFocus(fp.product_id)}
                  disabled={loading}
                  className="text-rose-500 text-sm hover:text-rose-700"
                >
                  🗑
                </button>
              </div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] text-pink-700/60">
                  Target: {fp.target_qty} · Terjual: {fp.sold_qty} · Sisa: {fp.remaining_qty}
                </span>
                <span className="text-[10px] font-bold text-violet-600">
                  {Number(fp.achievement_pct).toFixed(0)}%
                </span>
              </div>
              <div className="progress-bar-track">
                <div
                  className="progress-bar-fill"
                  style={{ width: `${Math.min(Number(fp.achievement_pct), 100)}%` }}
                />
              </div>
              <button
                onClick={() => handleUpdateTarget(fp.product_id, fp.target_qty)}
                disabled={loading}
                className="mt-2 text-[10px] font-bold text-pink-600 hover:text-pink-700"
              >
                ✏ Edit Target
              </button>
            </div>
          ))}
        </div>
      )}

      <button
        onClick={() => setShowPicker(true)}
        disabled={loading}
        className="w-full glass-mini rounded-lg py-2 text-xs font-bold text-pink-950 hover:bg-white/80"
      >
        + Tambah Focus Product
      </button>

      {showPicker && (
        <div
          className="fixed inset-0 z-50 glass-modal-backdrop flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={() => setShowPicker(false)}
        >
          <div
            className="glass-modal-card rounded-t-2xl sm:rounded-2xl w-full max-w-md max-h-[80vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-pink-200/50 flex items-center justify-between">
              <h3 className="text-sm font-bold text-pink-950">Pilih Focus Product</h3>
              <button onClick={() => setShowPicker(false)} className="text-pink-700/60 text-lg">✕</button>
            </div>
            <div className="p-3 border-b border-pink-200/50">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="🔍 Cari produk..."
                autoFocus
                className="custom-input w-full rounded-xl py-2 px-3 text-sm"
              />
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {availableProducts.length === 0 ? (
                <p className="text-xs text-pink-900/50 text-center py-4">Tidak ada produk tersedia</p>
              ) : (
                availableProducts.map((product) => (
                  <button
                    key={product.id}
                    onClick={() => handleAddFocus(product.id, product.name)}
                    className="w-full glass-mini rounded-xl p-3 flex items-center justify-between hover:bg-white/60 transition text-left"
                  >
                    <p className="text-xs font-bold text-pink-950 flex-1 truncate">{product.name}</p>
                    <span className="text-pink-400 font-bold text-lg ml-2">+</span>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
