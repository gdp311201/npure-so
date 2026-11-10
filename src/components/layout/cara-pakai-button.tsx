'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import CaraPakaiContent from './cara-pakai-content'

export default function CaraPakaiButton() {
  const [showModal, setShowModal] = useState(false)
  const [mounted, setMounted] = useState(false)

  // Mount check — needed for createPortal (SSR safe)
  useEffect(() => {
    setMounted(true)
  }, [])

  // Lock body scroll when modal is open
  useEffect(() => {
    if (showModal) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [showModal])

  return (
    <>
      {/* === 💡 Button === */}
      <button
        onClick={() => setShowModal(true)}
        className="glass-mini rounded-full w-8 h-8 flex items-center justify-center hover:bg-white/20 transition flex-shrink-0"
        aria-label="NPURE Playbook"
      >
        <span className="text-sm">💡</span>
      </button>

      {/* === Modal Overlay — rendered via Portal to escape header stacking context === */}
      {showModal && mounted && createPortal(
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
          style={{
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
          }}
          onClick={() => setShowModal(false)}
        >
          {/* === Modal content — frosted glass, HIGH opacity === */}
          <div
            className="rounded-2xl w-full max-w-md max-h-[85vh] flex flex-col overflow-hidden"
            style={{
              background: 'rgba(255, 255, 255, 0.96)',
              backdropFilter: 'blur(24px) saturate(180%)',
              WebkitBackdropFilter: 'blur(24px) saturate(180%)',
              border: '1px solid rgba(255, 255, 255, 0.4)',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(0, 0, 0, 0.05)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* === Modal header === */}
            <div
              className="flex items-start justify-between p-4 flex-shrink-0"
              style={{ borderBottom: '1px solid rgba(0, 0, 0, 0.08)' }}
            >
              <div>
                <h2 className="text-base font-black text-pink-950 tracking-tight">
                  NPURE Playbook
                </h2>
                <p className="text-[10px] text-pink-900/60 mt-0.5">
                  Your smart guide to mastering the app
                </p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="rounded-full w-7 h-7 flex items-center justify-center hover:bg-black/5 transition flex-shrink-0"
                style={{ background: 'rgba(0, 0, 0, 0.04)' }}
                aria-label="Tutup"
              >
                <span className="text-xs text-pink-950">✕</span>
              </button>
            </div>

            {/* === Modal body (scrollable) === */}
            <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-2">
              <CaraPakaiContent />
            </div>

            {/* === Modal footer === */}
            <div
              className="p-3 flex-shrink-0"
              style={{ borderTop: '1px solid rgba(0, 0, 0, 0.08)' }}
            >
              <button
                onClick={() => setShowModal(false)}
                className="w-full bg-gradient-to-r from-pink-400 to-rose-400 text-white font-bold py-2.5 rounded-xl text-xs transition shadow-lg shadow-pink-500/30"
              >
                ✅ Mengerti, lanjut!
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  )
}
