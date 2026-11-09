'use client'

import { useState } from 'react'

interface Section {
  key: string
  icon: string
  title: string
  description: string
  subItems?: { icon: string; title: string; description: string }[]
}

const SECTIONS: Section[] = [
  {
    key: 'home',
    icon: '🏠',
    title: 'HOME (Dashboard)',
    description:
      'Pusat monitoring harian Elsa. Lihat omset hari ini, qty terjual, Monthly Target dengan progress bar, focus products, dan low stock alert yang membedakan produk sold-out vs dead stock. Quick actions untuk akses cepat ke Sell Out, Sell In, dan Opname tanpa buka menu Transaksi.',
  },
  {
    key: 'transaksi',
    icon: '🛒',
    title: 'TRANSAKSI',
    description:
      'Pusat pencatatan semua transaksi stock. Ganti workflow Google Sheet manual dengan input digital terstruktur. Berisi 3 sub-menu: Sell Out, Sell In, dan Stock Opname — masing-masing punya tab Input dan History dengan filter, delete, dan revisi.',
    subItems: [
      {
        icon: '🛒',
        title: 'SELL OUT',
        description:
          'Catat barang terjual ke customer. Pilih produk → input qty → simpan. Sistem otomatis kurangi stock dan hitung omset dengan diskon (default 25%). Kalau salah input, buka tab History → cari transaksi → klik Hapus → input ulang.',
      },
      {
        icon: '📥',
        title: 'SELL IN',
        description:
          'Catat barang masuk (restock dari brand). Pilih produk → input qty → tambah catatan opsional → simpan. Sistem otomatis tambah stock. Kalau salah input, hapus dari tab History lalu input ulang.',
      },
      {
        icon: '📋',
        title: 'STOCK OPNAME',
        description:
          'Hitung fisik stock dan bandingkan dengan data sistem. Pilih tanggal → input jumlah fisik per produk → sistem auto-hitung selisih. Kalau ada selisih, wajib isi alasan. Stock auto-adjust sesuai hasil fisik. Lakukan ~2x sebulan (Bulanan) atau per event khusus.',
      },
    ],
  },
  {
    key: 'produk',
    icon: '📦',
    title: 'PRODUK',
    description:
      'Kelola master data produk dan monitoring stock. Berisi 3 sub-menu: Manage Produk, Stock Overview, dan Product Tracking.',
    subItems: [
      {
        icon: '⚙️',
        title: 'MANAGE PRODUK',
        description:
          'CRUD produk — tambah produk baru, edit nama/harga, hide produk yang tidak aktif, unhide kalau mau aktifkan lagi. Produk yang di-hide tidak hilang dari database, hanya disembunyikan dari transaksi.',
      },
      {
        icon: '📊',
        title: 'STOCK OVERVIEW',
        description:
          'Lihat stock level semua produk aktif dalam satu layar. Setiap produk menampilkan current stock, harga, dan status (healthy/low/out of stock). Identifikasi cepat produk yang perlu restock.',
      },
      {
        icon: '🔍',
        title: 'PRODUCT TRACKING',
        description:
          'Trace mutasi stock per produk. Pilih produk → pilih periode (Bulanan atau Custom Range) → lihat kartu stock (awal, masuk, keluar, akhir) + tabel transaksi detail. Investigasi selisih stock per produk dengan audit trail lengkap.',
      },
    ],
  },
  {
    key: 'laporan',
    icon: '📊',
    title: 'LAPORAN',
    description:
      'Analisis dan reporting bisnis. Berisi 4 sub-menu: Interactive Summary, Sales Analytics, E-Receipt Generator, dan Export Excel.',
    subItems: [
      {
        icon: '📈',
        title: 'INTERACTIVE SUMMARY',
        description:
          'Ringkasan omset, qty terjual, dan selisih per periode (Harian/Mingguan/Bulanan). Stat cards interaktif dengan breakdown transaksi. Quick overview performa periode tertentu.',
      },
      {
        icon: '🏆',
        title: 'SALES ANALYTICS',
        description:
          'Analisis mendalam penjualan. Top 10 Sellers (produk terlaris), Slow Movers (produk lambat), Demand Consistency (konsistensi penjualan), weekday summary (pola per hari), dan restock alert. Data-driven decision untuk restock dan promosi.',
      },
      {
        icon: '🧾',
        title: 'E-RECEIPT GENERATOR',
        description:
          'Generate receipt digital (PNG) per bulan. Laporan visual berisi omset, qty, target achievement, focus products, dan stock opname log. Bisa di-share ke brand atau management. Arsip digital bulanan.',
      },
      {
        icon: '📑',
        title: 'EXPORT EXCEL',
        description:
          'Download data transaksi (sell-out, sell-in, opname) ke format Excel (.xlsx). Backup data untuk olah lebih lanjut di Excel atau Google Sheets. Arsip offline yang bisa dibuka kapan saja.',
      },
    ],
  },
  {
    key: 'setting',
    icon: '⚙️',
    title: 'SETTING',
    description:
      'Konfigurasi parameter bulanan dan focus products. Atur discount rate per bulan (admin only) dan target omset bulanan. Tambah/hapus focus products per bulan untuk tracking produk prioritas brand.',
  },
]

const TIPS = [
  'Input sell-out/sell-in sehabis transaksi, jangan ditumpuk',
  'Stock opname minimal 2x sebulan (awal & akhir bulan)',
  'Cek Product Tracking kalau ada selisih stock mencurigakan',
  'Export Excel bulanan buat backup data',
  'Focus products di-set awal bulan biar tracking accurate',
  'Kalau salah input, langsung hapus dari History jangan ditunda',
]

export default function CaraPakaiContent() {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set())

  function toggleSection(key: string) {
    setExpandedSections((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(key)) {
        newSet.delete(key)
      } else {
        newSet.add(key)
      }
      return newSet
    })
  }

  return (
    <div className="space-y-2">
      {/* === Collapsible menu sections === */}
      {SECTIONS.map((section) => {
        const isExpanded = expandedSections.has(section.key)
        return (
          <div key={section.key} className="glass-mini rounded-xl overflow-hidden">
            {/* Section header — clickable */}
            <button
              onClick={() => toggleSection(section.key)}
              className="w-full flex items-center justify-between p-3 text-left hover:bg-white/10 transition"
            >
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <span className="text-lg flex-shrink-0">{section.icon}</span>
                <span className="text-xs font-bold text-pink-950 truncate">{section.title}</span>
              </div>
              <span className="text-sm ml-2 flex-shrink-0">{isExpanded ? '🔼' : '🔽'}</span>
            </button>

            {/* Expanded content */}
            {isExpanded && (
              <div className="px-3 pb-3 space-y-2">
                <p className="text-[11px] text-pink-900/70 leading-relaxed">{section.description}</p>

                {/* Sub-items */}
                {section.subItems && section.subItems.length > 0 && (
                  <div className="space-y-2 mt-2">
                    {section.subItems.map((sub) => (
                      <div key={sub.title} className="glass-card rounded-lg p-2.5">
                        <p className="text-[11px] font-bold text-pink-950 mb-1">
                          {sub.icon} {sub.title}
                        </p>
                        <p className="text-[10px] text-pink-900/70 leading-relaxed">{sub.description}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )
      })}

      {/* === Tips section (always visible) === */}
      <div className="glass-card rounded-xl p-3 mt-3">
        <p className="text-xs font-bold text-pink-950 mb-2">💡 Tips Cepat</p>
        <ul className="space-y-1">
          {TIPS.map((tip, i) => (
            <li key={i} className="text-[10px] text-pink-900/70 leading-relaxed flex items-start gap-1.5">
              <span className="text-emerald-500 flex-shrink-0">•</span>
              <span>{tip}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
