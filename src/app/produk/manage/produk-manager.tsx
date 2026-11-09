'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { formatRupiah } from '@/lib/utils/format'
import ProductFormModal from '../product-form-modal'
import HideProductModal from '../hide-product-modal'

interface Product {
  id: string
  name: string
  is_active: boolean
  current_price: number | bigint | null
  current_stock: number
  stock_status: string
  low_stock_threshold: number
}

export default function ProdukManager({ products }: { products: Product[] }) {
  const [filter, setFilter] = useState<'aktif' | 'semua'>('aktif')
  const [search, setSearch] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [hidingProduct, setHidingProduct] = useState<Product | null>(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const activeCount = products.filter((p) => p.is_active).length

  const filteredProducts = useMemo(() => {
    let result = products
    if (filter === 'aktif') result = result.filter((p) => p.is_active)
    if (search) {
      const q = search.toLowerCase()
      result = result.filter((p) => p.name.toLowerCase().includes(q))
    }
    return result
  }, [products, filter, search])

  async function handleUnhide(productId: string) {
    setActionLoading(true)
    setError(null)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')
      const { error: updateError } = await supabase
        .from('products')
        .update({ is_active: true, unhidden_at: new Date().toISOString(), unhidden_by: user.id })
        .eq('id', productId)
      if (updateError) throw new Error(updateError.message)
      router.refresh()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setActionLoading(false)
    }
  }

  async function handleHideConfirm(productId: string, reason: string) {
    setActionLoading(true)
    setError(null)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')
      const { error: updateError } = await supabase
        .from('products')
        .update({ is_active: false, hidden_at: new Date().toISOString(), hidden_by: user.id, hidden_reason: reason || null })
        .eq('id', productId)
      if (updateError) throw new Error(updateError.message)
      setHidingProduct(null)
      router.refresh()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setActionLoading(false)
    }
  }

  function getStockBadge(product: Product) {
    if (!product.is_active) return null
    if (product.current_stock === 0) return <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-rose-100 text-rose-700">Habis</span>
    if (product.current_stock <= product.low_stock_threshold) return <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700">Low</span>
    return <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700">OK</span>
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <button onClick={() => setShowAddModal(true)} className="bg-gradient-to-r from-pink-400 to-rose-400 hover:from-pink-500 hover:to-rose-500 text-white font-bold py-2 px-3 rounded-xl text-xs transition shadow-sm whitespace-nowrap">+ Produk Baru</button>
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="🔍 Cari..." className="custom-input flex-1 rounded-xl py-2 px-3 text-sm" />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button onClick={() => setFilter('aktif')} className={`py-2 rounded-xl text-xs font-bold transition ${filter === 'aktif' ? 'bg-gradient-to-r from-pink-400 to-rose-400 text-white' : 'bg-white/60 text-pink-950 border border-pink-200/60'}`}>● Aktif ({activeCount})</button>
        <button onClick={() => setFilter('semua')} className={`py-2 rounded-xl text-xs font-bold transition ${filter === 'semua' ? 'bg-gradient-to-r from-pink-400 to-rose-400 text-white' : 'bg-white/60 text-pink-950 border border-pink-200/60'}`}>○ Semua ({products.length})</button>
      </div>

      {error && (<div className="text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 rounded-xl py-2 px-3">❌ {error}</div>)}

      {filteredProducts.length === 0 ? (
        <div className="glass-card rounded-2xl p-6 text-center"><p className="text-xs font-bold text-pink-900/70">Tidak ada produk</p></div>
      ) : (
        <div className="space-y-2">
          {filteredProducts.map((product) => (
            <div key={product.id} className={`glass-card rounded-xl p-3 ${!product.is_active ? 'product-card-hidden' : ''}`}>
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1 pr-2">
                  <p className={`text-xs font-bold ${product.is_active ? 'text-pink-950' : 'product-name'}`}>{product.name}</p>
                  <p className="text-[10px] text-pink-700/60">{product.current_price ? formatRupiah(Number(product.current_price)) : 'Rp —'} · Stock: {product.current_stock}</p>
                </div>
                <div className="flex items-center gap-1">
                  {getStockBadge(product)}
                  {!product.is_active && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-slate-200 text-slate-600">Hidden</span>}
                </div>
              </div>
              <div className="flex gap-1.5">
                {product.is_active ? (
                  <>
                    <button onClick={() => setEditingProduct(product)} className="flex-1 glass-mini rounded-lg py-1.5 text-[10px] font-bold text-pink-950 hover:bg-white/80">✏ Edit</button>
                    <button onClick={() => setHidingProduct(product)} disabled={actionLoading} className="flex-1 glass-mini rounded-lg py-1.5 text-[10px] font-bold text-rose-600 hover:bg-rose-50">🗑 Hide</button>
                  </>
                ) : (
                  <button onClick={() => handleUnhide(product.id)} disabled={actionLoading} className="flex-1 glass-mini rounded-lg py-1.5 text-[10px] font-bold text-emerald-600 hover:bg-emerald-50">👁 Unhide</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showAddModal && (<ProductFormModal mode="add" onClose={() => setShowAddModal(false)} onSaved={() => { setShowAddModal(false); router.refresh() }} />)}
      {editingProduct && (<ProductFormModal mode="edit" product={editingProduct} onClose={() => setEditingProduct(null)} onSaved={() => { setEditingProduct(null); router.refresh() }} />)}
      {hidingProduct && (<HideProductModal product={hidingProduct} loading={actionLoading} onClose={() => setHidingProduct(null)} onConfirm={(reason) => handleHideConfirm(hidingProduct.id, reason)} />)}
    </div>
  )
}
