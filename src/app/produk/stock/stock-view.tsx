'use client'

import { useState, useMemo } from 'react'

interface Product {
  id: string
  name: string
  current_stock: number
  stock_status: string
  low_stock_threshold: number
}

export default function StockView({ products }: { products: Product[] }) {
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    if (!search) return products
    const q = search.toLowerCase()
    return products.filter((p) => p.name.toLowerCase().includes(q))
  }, [products, search])

  return (
    <div className="space-y-3">
      <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="🔍 Cari produk..." className="custom-input w-full rounded-xl py-2 px-3 text-sm" />

      <div className="flex justify-between items-center px-1">
        <span className="text-[10px] text-pink-700/60 font-semibold">{filtered.length} produk</span>
        <span className="text-[10px] text-pink-700/60">{products.length} total aktif</span>
      </div>

      {filtered.length === 0 ? (
        <div className="glass-card rounded-2xl p-6 text-center"><p className="text-xs font-bold text-pink-900/70">Tidak ada produk</p></div>
      ) : (
        <div className="glass-card rounded-2xl overflow-hidden">
          {filtered.map((product, idx) => (
            <div key={product.id} className={`flex items-center justify-between py-2.5 px-3 ${idx !== filtered.length - 1 ? 'border-b border-pink-100/40' : ''}`}>
              <span className="text-xs font-medium text-pink-950 flex-1 pr-2 leading-tight">{product.name}</span>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                {product.current_stock === 0 ? (
                  <span className="text-[8px] font-bold px-1 py-0.5 rounded bg-rose-500/20 text-rose-400">Habis</span>
                ) : product.current_stock <= (product.low_stock_threshold || 10) ? (
                  <span className="text-[8px] font-bold px-1 py-0.5 rounded bg-amber-500/20 text-amber-400">Low</span>
                ) : (
                  <span className="text-[8px] font-bold px-1 py-0.5 rounded bg-emerald-500/20 text-emerald-400">OK</span>
                )}
                <span className={`text-sm font-bold font-mono ${product.current_stock === 0 ? 'text-rose-400' : product.current_stock <= (product.low_stock_threshold || 10) ? 'text-amber-400' : 'text-pink-950'}`}>{product.current_stock}</span>
                <span className="text-[9px] text-pink-700/50">pcs</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
