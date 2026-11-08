'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { formatRupiah } from '@/lib/utils/format'

interface MonthlyConfig {
  period: string
  discount_rate: number
  target_omset: number
}

export default function MonthlyConfigSection({
  config,
  userRole,
  period,
}: {
  config: MonthlyConfig | null
  userRole: string
  period: string
}) {
  const [editing, setEditing] = useState(false)
  const [discountRate, setDiscountRate] = useState(
    config ? String(Math.round(config.discount_rate * 100)) : '25'
  )
  const [targetOmset, setTargetOmset] = useState(
    config ? String(config.target_omset) : '35000000'
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const isAdmin = userRole === 'admin'
  const monthDisplay = new Date(period + '-01T00:00:00').toLocaleDateString('id-ID', {
    month: 'long', year: 'numeric',
  })

  async function handleSave() {
    setLoading(true)
    setError(null)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const rate = Number(discountRate) / 100
      const target = Number(targetOmset)

      if (config) {
        const updateData: any = { target_omset: target, updated_by: user.id }
        if (isAdmin) updateData.discount_rate = rate

        const { error: updateError } = await supabase
          .from('monthly_config')
          .update(updateData)
          .eq('period', period)
        if (updateError) throw new Error(updateError.message)
      } else {
        const { error: insertError } = await supabase
          .from('monthly_config')
          .insert({
            period: period,
            discount_rate: isAdmin ? rate : 0.25,
            target_omset: target,
            created_by: user.id,
          })
        if (insertError) throw new Error(insertError.message)
      }

      setEditing(false)
      router.refresh()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="glass-card rounded-2xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase text-pink-900/70">📅 Monthly Config</h3>
        <span className="text-[10px] font-bold text-pink-700 bg-pink-100 px-2 py-0.5 rounded-full">
          {monthDisplay}
        </span>
      </div>

      {!config && !editing && (
        <div className="bg-amber-50/80 border border-amber-200/60 rounded-lg p-2 text-center">
          <p className="text-[10px] text-amber-800 font-bold">⚠ Belum dikonfigurasi untuk periode ini</p>
        </div>
      )}

      {!editing ? (
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-xs text-pink-800/70">Discount Rate</span>
            <span className="text-sm font-bold text-pink-950">
              {config ? `${Math.round(config.discount_rate * 100)}%` : '—'}
              {!isAdmin && ' 🔒'}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs text-pink-800/70">Target Omset</span>
            <span className="text-sm font-bold text-pink-950">
              {config ? formatRupiah(config.target_omset) : 'Rp —'}
            </span>
          </div>
          <button
            onClick={() => setEditing(true)}
            className="w-full glass-mini rounded-lg py-2 text-xs font-bold text-pink-950 hover:bg-white/80"
          >
            ✏ Edit Config
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <div>
            <label className="block text-[10px] font-bold uppercase text-pink-900/70 mb-1">
              Discount Rate (%) {!isAdmin && '🔒 Admin Only'}
            </label>
            <input
              type="number"
              value={discountRate}
              onChange={(e) => setDiscountRate(e.target.value)}
              disabled={!isAdmin}
              className="custom-input w-full rounded-lg py-2 px-3 text-sm disabled:opacity-50"
              min="0"
              max="100"
            />
            {!isAdmin && (
              <p className="text-[9px] text-pink-700/50 mt-0.5">
                Hanya admin yang dapat mengubah discount rate.
              </p>
            )}
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase text-pink-900/70 mb-1">
              Target Omset (Rp)
            </label>
            <input
              type="number"
              value={targetOmset}
              onChange={(e) => setTargetOmset(e.target.value)}
              className="custom-input w-full rounded-lg py-2 px-3 text-sm"
              min="0"
            />
          </div>
          {error && (
            <div className="text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 rounded-lg py-2 px-3">
              ❌ {error}
            </div>
          )}
          <div className="flex gap-2">
            <button
              onClick={() => { setEditing(false); setError(null) }}
              className="flex-1 bg-white/60 rounded-lg py-2 text-xs font-bold text-pink-950 border border-pink-200/60"
            >
              Batal
            </button>
            <button
              onClick={handleSave}
              disabled={loading}
              className="flex-1 bg-gradient-to-r from-pink-400 to-rose-400 disabled:opacity-50 text-white font-bold rounded-lg py-2 text-xs"
            >
              {loading ? '⏳...' : '💾 Simpan'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
