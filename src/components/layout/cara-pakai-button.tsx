'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import CaraPakaiContent from './cara-pakai-content'

export default function CaraPakaiButton() {
  const [showModal, setShowModal] = useState(false)
  const [mounted, setMounted] = useState(false)

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

      {/* === Modal Overlay — rendered via Portal === */}
      {showModal && mounted && createPortal(
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
          style={{
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
          }}
          onClick={() => setShowModal(false)}
        >
          {/* === Modal content — DARK frosted glass (match login page theme) === */}
          <div
            className="rounded-2xl w-full max-w-md max-h-[85vh] flex flex-col overflow-hidden"
            style={{
              background: 'rgba(6, 78, 59, 0.88)',
              backdropFilter: 'blur(24px) saturate(180%)',
              WebkitBackdropFilter: 'blur(24px) saturate(180%)',
              border: '1px solid rgba(52, 211, 153, 0.25)',
              boxShadow: '0 0 24px rgba(52, 211, 153, 0.15), 0 25px 50px rgba(0, 0, 0, 0.5)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* === Modal header === */}
            <div
              className="flex items-start justify-between p-4 flex-shrink-0"
              style={{ borderBottom: '1px solid rgba(52, 211, 153, 0.15)' }}
            >
              <div>
                <h2 className="text-base font-black tracking-tight" style={{ color: '#d1fae5' }}>
                  NPURE Playbook
                </h2>
                <p className="text-[10px] mt-0.5" style={{ color: 'rgba(209, 250, 229, 0.6)' }}>
                  Your smart guide to mastering the app
                </p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="rounded-full w-7 h-7 flex items-center justify-center transition flex-shrink-0 hover:bg-white/10"
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                }}
                aria-label="Tutup"
              >
                <span className="text-xs" style={{ color: '#d1fae5' }}>✕</span>
              </button>
            </div>

            {/* === Modal body (scrollable) === */}
            <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-2">
              <CaraPakaiContent />
            </div>

            {/* === Modal footer === */}
            <div
              className="p-3 flex-shrink-0"
              style={{ borderTop: '1px solid rgba(52, 211, 153, 0.15)' }}
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
