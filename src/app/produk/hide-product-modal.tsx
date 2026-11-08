'use client'

import { useState } from 'react'

interface Product {
  id: string
  name: string
  is_active: boolean
  current_price: number | bigint | null
  current_stock: number
  stock_status: string
  low_stock_threshold: number
}

export default function HideProductModal({
  product,
  loading,
  onClose,
  onConfirm,
}: {
  product: Product
  loading: boolean
  onClose: () => void
  onConfirm: (reason: string) => void
}) {
  const [reason, setReason] = useState('')

  return (
    <div
      className="fixed inset-0 z-50 glass-modal-backdrop flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        className="glass-modal-card rounded-t-2xl sm:rounded-2xl w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-rose-700">🗑 Sembunyikan Produk?</h3>
            <button onClick={onClose} className="text-pink-700/60 hover:text-pink-950 text-lg">✕</button>
          </div>

          <div className="glass-mini rounded-lg p-3">
            <p className="text-xs font-bold text-pink-950">{product.name}</p>
            <p className="text-[10px] text-pink-700/60 mt-0.5">Stock: {product.current_stock} pcs</p>
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase text-pink-900/70 mb-1">Alasan (opsional)</label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Contoh: Discontinued, rusak, dll"
              className="custom-input w-full rounded-lg py-2 px-3 text-sm"
            />
          </div>

          <div className="bg-amber-50/80 border border-amber-200/60 rounded-lg p-3">
            <p className="text-[10px] text-amber-800/80">
              ⚠ Produk disembunyikan dari view utama, tapi data historis transaksi tetap dipertahankan untuk audit.
            </p>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              onClick={onClose}
              className="flex-1 bg-white/60 rounded-lg py-2.5 text-xs font-bold text-pink-950 border border-pink-200/60"
            >
              Batal
            </button>
            <button
              onClick={() => onConfirm(reason)}
              disabled={loading}
              className="flex-1 bg-gradient-to-r from-rose-400 to-rose-500 hover:from-rose-500 hover:to-rose-600 disabled:opacity-50 text-white font-bold rounded-lg py-2.5 text-xs"
            >
              {loading ? '⏳...' : '✓ Konfirmasi Hide'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
