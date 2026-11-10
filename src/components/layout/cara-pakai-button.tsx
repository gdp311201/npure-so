'use client'

import { useState, useEffect } from 'react'
import CaraPakaiContent from './cara-pakai-content'

export default function CaraPakaiButton() {
  const [showModal, setShowModal] = useState(false)

  // Lock body scroll when modal is open (prevent background scroll)
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

      {/* === Modal Overlay === */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={() => setShowModal(false)}
        >
          {/* Modal content — click inside doesn't close */}
          <div
            className="glass-card rounded-2xl w-full max-w-md max-h-[85vh] flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* === Modal header === */}
            <div className="flex items-start justify-between p-4 border-b border-pink-200/30 flex-shrink-0">
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
                className="glass-mini rounded-full w-7 h-7 flex items-center justify-center hover:bg-white/20 transition flex-shrink-0"
                aria-label="Tutup"
              >
                <span className="text-xs">✕</span>
              </button>
            </div>

            {/* === Modal body (scrollable) === min-h-0 critical for flex scrolling */}
            <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-2">
              <CaraPakaiContent />
            </div>

            {/* === Modal footer === */}
            <div className="p-3 border-t border-pink-200/30 flex-shrink-0">
              <button
                onClick={() => setShowModal(false)}
                className="w-full bg-gradient-to-r from-pink-400 to-rose-400 text-white font-bold py-2.5 rounded-xl text-xs transition shadow-lg shadow-pink-500/30"
              >
                ✅ Mengerti, lanjut!
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
