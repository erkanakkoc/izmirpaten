'use client'

import { X, Phone, MessageCircle, Mail, Video } from 'lucide-react'
import type { Application } from '@/types'
import { formatDate, statusLabel, statusColor, buildWhatsAppUrl } from '@/lib/utils'
import { toast } from 'sonner'

interface Props {
  app: Application
  onClose: () => void
}

export default function ApplicationDetailDrawer({ app, onClose }: Props) {
  const Row = ({ label, value }: { label: string; value?: string | null | boolean }) => {
    if (value === null || value === undefined || value === '') return null
    return (
      <div className="flex gap-3 py-2.5 border-b border-gray-50 last:border-0">
        <span className="text-xs text-gray-400 font-medium w-36 flex-shrink-0 pt-0.5">{label}</span>
        <span className="text-sm text-[#1B2A4A] font-medium">{String(value)}</span>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white w-full max-w-md h-full overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between z-10">
          <div>
            <h2 className="font-bold text-[#1B2A4A] text-lg">{app.full_name}</h2>
            <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${statusColor(app.status)}`}>
              {statusLabel(app.status)}
            </span>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Quick actions */}
        <div className="px-6 py-4 flex gap-2 border-b border-gray-100 bg-gray-50">
          <button
            onClick={() => { navigator.clipboard.writeText(app.phone); toast.success('Kopyalandı!') }}
            className="flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-semibold hover:border-orange-200 transition-all"
          >
            <Phone size={13} className="text-[#FF6B35]" /> {app.phone}
          </button>
          <a
            href={buildWhatsAppUrl(app.phone)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-2 bg-green-50 border border-green-200 text-green-700 rounded-xl text-xs font-semibold hover:bg-green-100 transition-all"
          >
            <MessageCircle size={13} /> WhatsApp
          </a>
          {app.email && (
            <a
              href={`mailto:${app.email}?subject=İzmir Paten – Başvurunuz Hakkında&body=Merhaba ${app.full_name},`}
              className="flex items-center gap-1.5 px-3 py-2 bg-purple-50 border border-purple-200 text-purple-700 rounded-xl text-xs font-semibold hover:bg-purple-100 transition-all"
            >
              <Mail size={13} /> E-posta
            </a>
          )}
        </div>

        {/* Details */}
        <div className="px-6 py-5 space-y-1">
          <h3 className="font-bold text-xs text-gray-400 uppercase tracking-widest mb-3">Kişisel Bilgiler</h3>
          <Row label="Ad Soyad" value={app.full_name} />
          <Row label="Telefon" value={app.phone} />
          <Row label="E-posta" value={app.email} />
          <Row label="Yaş" value={app.age?.toString()} />
          {!app.is_for_self && (
            <>
              <div className="pt-4 pb-2">
                <h3 className="font-bold text-xs text-gray-400 uppercase tracking-widest">Öğrenci Bilgileri</h3>
              </div>
              <Row label="Öğrenci Adı" value={app.student_name} />
              <Row label="Öğrenci Yaşı" value={app.student_age?.toString()} />
            </>
          )}

          <div className="pt-4 pb-2">
            <h3 className="font-bold text-xs text-gray-400 uppercase tracking-widest">Ders Tercihleri</h3>
          </div>
          <Row label="Paket" value={app.package_name} />
          <Row label="Lokasyon" value={app.location_name} />
          <Row label="Müsait Günler" value={app.available_days?.join(', ')} />
          <Row label="Müsait Saatler" value={app.available_hours} />
          <Row label="Notlar" value={app.notes} />

          <div className="pt-4 pb-2">
            <h3 className="font-bold text-xs text-gray-400 uppercase tracking-widest">Diğer</h3>
          </div>
          <div className="flex gap-3 py-2.5 border-b border-gray-50">
            <span className="text-xs text-gray-400 font-medium w-36 flex-shrink-0 pt-0.5">Video İzni</span>
            <span className={`flex items-center gap-1 text-sm font-medium ${app.video_consent ? 'text-green-600' : 'text-gray-400'}`}>
              <Video size={14} />
              {app.video_consent ? 'İzin verildi ✅' : 'İzin verilmedi'}
            </span>
          </div>
          <Row label="Başvuru Tarihi" value={formatDate(app.created_at)} />
        </div>
      </div>
    </div>
  )
}
