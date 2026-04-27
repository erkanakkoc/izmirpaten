'use client'

import { useState, useMemo } from 'react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import {
  Search, Filter, Download, Phone, MessageCircle, Mail, Eye,
  ChevronLeft, ChevronRight, Trash2, CheckCircle
} from 'lucide-react'
import type { Application, ApplicationStatus } from '@/types'
import { formatDate, statusLabel, statusColor, buildWhatsAppUrl } from '@/lib/utils'
import ApplicationDetailDrawer from './ApplicationDetailDrawer'

interface Props {
  initialApplications: Application[]
  packages: { id: string; name: string }[]
  locations: { id: string; name: string }[]
}

const STATUS_OPTIONS: ApplicationStatus[] = ['new', 'reviewed', 'approved', 'rejected']
const PAGE_SIZE = 20

export default function ApplicationsClient({ initialApplications, packages, locations }: Props) {
  const [apps, setApps] = useState<Application[]>(initialApplications)
  const [search, setSearch] = useState('')
  const [filterPkg, setFilterPkg] = useState('')
  const [filterLoc, setFilterLoc] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [page, setPage] = useState(1)
  const [selectedApp, setSelectedApp] = useState<Application | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const filtered = useMemo(() => {
    return apps.filter((a) => {
      const q = search.toLowerCase()
      if (q && !a.full_name.toLowerCase().includes(q) && !a.phone.includes(q) && !(a.email?.toLowerCase().includes(q))) return false
      if (filterPkg && a.package_name !== filterPkg) return false
      if (filterLoc && a.location_name !== filterLoc) return false
      if (filterStatus && a.status !== filterStatus) return false
      return true
    })
  }, [apps, search, filterPkg, filterLoc, filterStatus])

  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)

  const updateStatus = async (id: string, status: ApplicationStatus) => {
    const supabase = createClient()
    const { error } = await supabase.from('applications').update({ status }).eq('id', id)
    if (error) { toast.error('Durum güncellenemedi.'); return }
    setApps((prev) => prev.map((a) => a.id === id ? { ...a, status } : a))
    toast.success('Durum güncellendi.')
  }

  const deleteApp = async (id: string) => {
    const supabase = createClient()
    const { error } = await supabase.from('applications').delete().eq('id', id)
    if (error) { toast.error('Başvuru silinemedi.'); return }
    setApps((prev) => prev.filter((a) => a.id !== id))
    setDeleteId(null)
    toast.success('Başvuru silindi.')
  }

  const exportCSV = () => {
    const headers = ['Ad Soyad', 'Telefon', 'E-posta', 'Paket', 'Lokasyon', 'Durum', 'Tarih']
    const rows = filtered.map((a) => [
      a.full_name, a.phone, a.email ?? '', a.package_name, a.location_name,
      statusLabel(a.status), formatDate(a.created_at)
    ])
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(',')).join('\n')
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'basvurular.csv'; a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div>
      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-5">
        <div className="flex flex-wrap gap-3">
          <div className="flex-1 min-w-48 relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              placeholder="Ad, telefon veya e-posta ara..."
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#FF6B35]"
            />
          </div>
          <select
            value={filterPkg}
            onChange={(e) => { setFilterPkg(e.target.value); setPage(1) }}
            className="px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#FF6B35] bg-white"
          >
            <option value="">Tüm Paketler</option>
            {packages.map((p) => <option key={p.id} value={p.name}>{p.name}</option>)}
          </select>
          <select
            value={filterLoc}
            onChange={(e) => { setFilterLoc(e.target.value); setPage(1) }}
            className="px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#FF6B35] bg-white"
          >
            <option value="">Tüm Lokasyonlar</option>
            {locations.map((l) => <option key={l.id} value={l.name}>{l.name}</option>)}
          </select>
          <select
            value={filterStatus}
            onChange={(e) => { setFilterStatus(e.target.value); setPage(1) }}
            className="px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#FF6B35] bg-white"
          >
            <option value="">Tüm Durumlar</option>
            {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{statusLabel(s)}</option>)}
          </select>
          <button
            onClick={exportCSV}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#1B2A4A] text-white rounded-xl text-sm font-semibold hover:bg-[#2d4a8a] transition-all"
          >
            <Download size={15} /> CSV
          </button>
        </div>
        <div className="mt-2 text-xs text-gray-400">
          {filtered.length} başvuru • {apps.filter(a => a.status === 'new').length} yeni
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['Ad Soyad', 'Telefon', 'Paket', 'Lokasyon', 'Tarih', 'Durum', 'İşlemler'].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {paginated.map((app) => (
                <tr key={app.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-semibold text-[#1B2A4A]">{app.full_name}</div>
                    {app.email && <div className="text-xs text-gray-400">{app.email}</div>}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{app.phone}</td>
                  <td className="px-4 py-3 text-gray-600 max-w-36">
                    <span className="truncate block text-xs">{app.package_name}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-600 text-xs">{app.location_name}</td>
                  <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">{formatDate(app.created_at)}</td>
                  <td className="px-4 py-3">
                    <select
                      value={app.status}
                      onChange={(e) => updateStatus(app.id, e.target.value as ApplicationStatus)}
                      className={`text-xs px-2 py-1 rounded-full font-semibold border-0 outline-none cursor-pointer ${statusColor(app.status)}`}
                    >
                      {STATUS_OPTIONS.map((s) => (
                        <option key={s} value={s}>{statusLabel(s)}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setSelectedApp(app)}
                        title="Detay"
                        className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-500 transition-colors"
                      >
                        <Eye size={15} />
                      </button>
                      <button
                        onClick={() => { navigator.clipboard.writeText(app.phone); toast.success('Telefon kopyalandı!') }}
                        title="Telefonu kopyala"
                        className="p-1.5 rounded-lg hover:bg-orange-50 text-[#FF6B35] transition-colors"
                      >
                        <Phone size={15} />
                      </button>
                      <a
                        href={buildWhatsAppUrl(app.phone)}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="WhatsApp'ta aç"
                        className="p-1.5 rounded-lg hover:bg-green-50 text-green-500 transition-colors"
                      >
                        <MessageCircle size={15} />
                      </a>
                      {app.email && (
                        <a
                          href={`mailto:${app.email}?subject=Paten İzmir – Başvurunuz Hakkında`}
                          title="Mail gönder"
                          className="p-1.5 rounded-lg hover:bg-purple-50 text-purple-500 transition-colors"
                        >
                          <Mail size={15} />
                        </a>
                      )}
                      <button
                        onClick={() => setDeleteId(app.id)}
                        title="Sil"
                        className="p-1.5 rounded-lg hover:bg-red-50 text-red-400 transition-colors"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {paginated.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-gray-400 text-sm">
                    Başvuru bulunamadı.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
            <span className="text-xs text-gray-400">{filtered.length} sonuçtan {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)}</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1.5 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="text-sm font-medium text-gray-600">{page} / {totalPages}</span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-1.5 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Detail drawer */}
      {selectedApp && (
        <ApplicationDetailDrawer app={selectedApp} onClose={() => setSelectedApp(null)} />
      )}

      {/* Delete confirm modal */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <h3 className="font-bold text-[#1B2A4A] text-lg mb-2">Başvuruyu Sil</h3>
            <p className="text-gray-500 text-sm mb-5">Bu başvuruyu kalıcı olarak silmek istediğinden emin misin?</p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteId(null)}
                className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-all"
              >
                İptal
              </button>
              <button
                onClick={() => deleteApp(deleteId)}
                className="flex-1 py-2.5 bg-red-500 text-white rounded-xl text-sm font-bold hover:bg-red-600 transition-all"
              >
                Sil
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
