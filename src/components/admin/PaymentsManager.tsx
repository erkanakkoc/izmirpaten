'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Check, X, Loader2 } from 'lucide-react'
import type { PaymentRequest } from '@/types'
import { formatDate, formatPrice } from '@/lib/utils'

type PaymentWithStudent = PaymentRequest & { students?: { full_name: string; email: string } | null }

interface Props {
  payments: PaymentWithStudent[]
  trainers: { id: string; name: string }[]
}

export default function PaymentsManager({ payments: init, trainers }: Props) {
  const [payments, setPayments] = useState<PaymentWithStudent[]>(init)
  const [processing, setProcessing] = useState<string | null>(null)
  const [modal, setModal] = useState<{ payment: PaymentWithStudent; action: 'confirm' | 'reject' } | null>(null)
  const [adminNote, setAdminNote] = useState('')
  const [trainerId, setTrainerId] = useState('')

  const pending = payments.filter(p => p.status === 'pending').length

  const handle = async () => {
    if (!modal) return
    setProcessing(modal.payment.id)
    try {
      const res = await fetch('/api/admin/confirm-payment', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payment_id: modal.payment.id, action: modal.action, admin_note: adminNote, trainer_id: trainerId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setPayments(p => p.map(x => x.id === modal.payment.id ? { ...x, status: modal.action === 'confirm' ? 'confirmed' : 'rejected' } : x))
      toast.success(modal.action === 'confirm' ? 'Ödeme onaylandı, paket tanımlandı.' : 'Ödeme reddedildi.')
      setModal(null); setAdminNote(''); setTrainerId('')
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Hata.')
    } finally { setProcessing(null) }
  }

  const statusInfo = (s: string) => ({
    pending: { label: 'Bekliyor', cls: 'bg-amber-100 text-amber-700' },
    confirmed: { label: 'Onaylandı', cls: 'bg-green-100 text-green-700' },
    rejected: { label: 'Reddedildi', cls: 'bg-red-100 text-red-700' },
  }[s] ?? { label: s, cls: 'bg-gray-100 text-gray-600' })

  return (
    <div>
      {pending > 0 && (
        <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-2xl text-amber-800 text-sm font-semibold">
          ⚠️ {pending} bekleyen ödeme talebi var. İnceleyip onaylaman bekleniyor.
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="divide-y divide-gray-50">
          {payments.map(p => {
            const { label, cls } = statusInfo(p.status)
            return (
              <div key={p.id} className="px-6 py-4 flex flex-wrap items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm text-[#1B2A4A]">{p.students?.full_name ?? 'Bilinmiyor'}</div>
                  <div className="text-xs text-gray-400">{p.students?.email} • {formatDate(p.created_at)}</div>
                  <div className="text-sm font-semibold text-[#FF6B35] mt-0.5">{p.package_name} — {formatPrice(p.amount)}</div>
                  {p.student_note && <div className="text-xs text-gray-500 mt-1">Not: {p.student_note}</div>}
                  {p.admin_note && <div className="text-xs text-gray-500 mt-0.5">Admin notu: {p.admin_note}</div>}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${cls}`}>{label}</span>
                  {p.status === 'pending' && (
                    <>
                      <button onClick={() => { setModal({ payment: p, action: 'confirm' }); setAdminNote('') }}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-600 rounded-xl text-xs font-semibold hover:bg-green-100">
                        <Check size={13} /> Onayla
                      </button>
                      <button onClick={() => { setModal({ payment: p, action: 'reject' }); setAdminNote('') }}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-500 rounded-xl text-xs font-semibold hover:bg-red-100">
                        <X size={13} /> Reddet
                      </button>
                    </>
                  )}
                </div>
              </div>
            )
          })}
          {payments.length === 0 && (
            <div className="px-6 py-10 text-center text-gray-400 text-sm">Henüz ödeme talebi yok.</div>
          )}
        </div>
      </div>

      {modal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6">
            <h3 className="font-bold text-[#1B2A4A] text-lg mb-1">
              {modal.action === 'confirm' ? 'Ödemeyi Onayla' : 'Ödemeyi Reddet'}
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              {modal.payment.students?.full_name} — {modal.payment.package_name} ({formatPrice(modal.payment.amount)})
            </p>
            {modal.action === 'confirm' && (
              <div className="mb-4">
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Eğitmen Ata</label>
                <select value={trainerId} onChange={e => setTrainerId(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#FF6B35] bg-white">
                  <option value="">Seç (opsiyonel)</option>
                  {trainers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
            )}
            <div className="mb-4">
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Admin Notu</label>
              <textarea rows={2} value={adminNote} onChange={e => setAdminNote(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#FF6B35] resize-none" />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setModal(null)} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold hover:bg-gray-50">İptal</button>
              <button onClick={handle} disabled={!!processing}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-60 ${modal.action === 'confirm' ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600'}`}>
                {processing ? <Loader2 size={14} className="animate-spin" /> : modal.action === 'confirm' ? <Check size={14} /> : <X size={14} />}
                {modal.action === 'confirm' ? 'Onayla' : 'Reddet'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
