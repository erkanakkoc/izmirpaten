'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Loader2, CreditCard, CheckCircle2, RefreshCw } from 'lucide-react'
import type { Enrollment, Package, PaymentRequest } from '@/types'
import { formatPrice } from '@/lib/utils'

interface Props {
  studentId: string
  enrollments: Enrollment[]
  packages: Package[]
  paymentRequests: PaymentRequest[]
}

export default function PackageRenewal({ studentId, enrollments, packages, paymentRequests }: Props) {
  const [selectedPkg, setSelectedPkg] = useState<Package | null>(null)
  const [note, setNote] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [changeReason, setChangeReason] = useState('')
  const [requestingChange, setRequestingChange] = useState(false)
  const [changeRequested, setChangeRequested] = useState(false)

  const active = enrollments.find(e => e.is_active)

  const requestTrainerChange = async () => {
    setRequestingChange(true)
    try {
      const res = await fetch('/api/student/request-trainer-change', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: changeReason }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setChangeRequested(true)
      toast.success('Eğitmen değişikliği talebiniz gönderildi.')
    } catch (e: unknown) { toast.error(e instanceof Error ? e.message : 'Hata.') }
    finally { setRequestingChange(false) }
  }
  const pending = paymentRequests.find(p => p.status === 'pending')

  const submit = async () => {
    if (!selectedPkg) { toast.error('Paket seçin.'); return }
    setSubmitting(true)
    try {
      const res = await fetch('/api/student/payment-request', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ package_id: selectedPkg.id, package_name: selectedPkg.name, amount: selectedPkg.price, student_note: note }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setSubmitted(true)
    } catch (e: unknown) { toast.error(e instanceof Error ? e.message : 'Hata.') }
    finally { setSubmitting(false) }
  }

  const statusInfo = (s: string) => ({
    pending: { label: 'Admin Onayı Bekleniyor', cls: 'bg-amber-100 text-amber-700', icon: '⏳' },
    confirmed: { label: 'Onaylandı', cls: 'bg-green-100 text-green-700', icon: '✅' },
    rejected: { label: 'Reddedildi', cls: 'bg-red-100 text-red-700', icon: '❌' },
  }[s] ?? { label: s, cls: 'bg-gray-100 text-gray-600', icon: '' })

  return (
    <div className="space-y-5">
      {/* Aktif paket */}
      {active && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="font-bold text-[#1B2A4A] mb-4">Aktif Paket</h2>
          <div className="flex items-center gap-6">
            <div className="flex-1">
              <div className="text-lg font-extrabold text-[#1B2A4A]">{active.package_name}</div>
              <div className="text-sm text-gray-500 mt-1">Toplam {active.total_lessons} ders</div>
            </div>
            <div className="text-center">
              <div className={`text-4xl font-extrabold ${active.lessons_remaining <= 1 ? 'text-red-500' : active.lessons_remaining <= 2 ? 'text-amber-500' : 'text-green-600'}`}>
                {active.lessons_remaining}
              </div>
              <div className="text-xs text-gray-400">ders hakkı kaldı</div>
            </div>
          </div>
          <div className="mt-4 w-full bg-gray-100 rounded-full h-3">
            <div className={`h-3 rounded-full transition-all ${active.lessons_remaining <= 1 ? 'bg-red-400' : active.lessons_remaining <= 2 ? 'bg-amber-400' : 'bg-green-400'}`}
              style={{ width: `${(active.lessons_remaining / active.total_lessons) * 100}%` }} />
          </div>
          {active.lessons_remaining <= 1 && (
            <div className="mt-4 p-3 bg-red-50 border border-red-100 rounded-xl">
              <p className="text-sm text-red-700 font-semibold">⚠️ Son {active.lessons_remaining} ders hakkınız kaldı!</p>
              <p className="text-xs text-red-600 mt-0.5">Aşağıdan paketinizi yenileyin.</p>
            </div>
          )}
        </div>
      )}

      {/* Eğitmen değişikliği talebi */}
      {active && !changeRequested && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h2 className="font-bold text-[#1B2A4A] mb-2 flex items-center gap-2">
            <RefreshCw size={16} className="text-[#FF6B35]" /> Eğitmen Değişikliği Talep Et
          </h2>
          <p className="text-sm text-gray-500 mb-4">Eğitmeninizin değiştirilmesini talep edebilirsiniz. Admin inceleyip onaylayacaktır.</p>
          <div className="mb-4">
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Neden? (opsiyonel)</label>
            <textarea rows={2} value={changeReason} onChange={e => setChangeReason(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#FF6B35] resize-none" />
          </div>
          <button onClick={requestTrainerChange} disabled={requestingChange}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-500 text-white rounded-xl text-sm font-bold hover:bg-blue-600 disabled:opacity-60">
            {requestingChange ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
            Talep Gönder
          </button>
        </div>
      )}
      {changeRequested && (
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5 text-center">
          <CheckCircle2 size={28} className="text-blue-500 mx-auto mb-2" />
          <p className="font-semibold text-blue-800 text-sm">Eğitmen değişikliği talebiniz alındı. Admin inceleyecek.</p>
        </div>
      )}

      {/* Bekleyen ödeme */}
      {pending && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
          <div className="flex items-start gap-3">
            <span className="text-2xl">⏳</span>
            <div>
              <h3 className="font-bold text-amber-800">Ödeme Onayı Bekleniyor</h3>
              <p className="text-sm text-amber-700 mt-1">{pending.package_name} paketi için ödeme talebiniz admin tarafından inceleniyor.</p>
              <p className="text-xs text-amber-600 mt-1">Onaylandığında ders haklarınız otomatik tanımlanacak.</p>
            </div>
          </div>
        </div>
      )}

      {/* Paket yenileme formu */}
      {!submitted && !pending && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="font-bold text-[#1B2A4A] mb-4 flex items-center gap-2">
            <CreditCard size={18} className="text-[#FF6B35]" /> Paket Yenile
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-5">
            {packages.map(pkg => (
              <button key={pkg.id} onClick={() => setSelectedPkg(pkg)}
                className={`p-4 rounded-2xl border-2 text-left transition-all ${selectedPkg?.id === pkg.id ? 'border-[#FF6B35] bg-orange-50' : 'border-gray-100 hover:border-orange-200'}`}>
                <div className="font-bold text-[#1B2A4A] text-sm">{pkg.name}</div>
                <div className="text-[#FF6B35] font-extrabold mt-1">{formatPrice(pkg.price)}</div>
                {pkg.description && <div className="text-xs text-gray-400 mt-1 leading-relaxed line-clamp-2">{pkg.description}</div>}
              </button>
            ))}
          </div>

          {selectedPkg && (
            <div className="border border-orange-100 rounded-2xl p-4 mb-4 bg-orange-50">
              <h3 className="font-bold text-[#1B2A4A] mb-2">Ödeme Bilgisi</h3>
              <p className="text-sm text-gray-600 mb-3">
                <strong>{selectedPkg.name}</strong> paketini seçtiniz. Ödeme tutarı: <strong className="text-[#FF6B35]">{formatPrice(selectedPkg.price)}</strong>
              </p>
              <div className="bg-white rounded-xl p-3 text-xs text-gray-500 border border-orange-100">
                Ödemeyi yaptıktan sonra aşağıdaki butona tıklayın. Admin ödemenizi banka hesabından kontrol ettikten sonra paketiniz aktif edilecek.
              </div>
            </div>
          )}

          <div className="mb-4">
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Not (opsiyonel — ödeme makbuzunu belirtebilirsiniz)</label>
            <textarea rows={2} value={note} onChange={e => setNote(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#FF6B35] resize-none" />
          </div>

          <button onClick={submit} disabled={!selectedPkg || submitting}
            className="w-full flex items-center justify-center gap-2 py-3 bg-[#FF6B35] text-white rounded-xl font-bold hover:bg-orange-500 disabled:opacity-60">
            {submitting ? <Loader2 size={16} className="animate-spin" /> : <CreditCard size={16} />}
            {submitting ? 'Gönderiliyor...' : 'Ödeme Yaptım, Onay Bekle'}
          </button>
        </div>
      )}

      {submitted && (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-8 text-center">
          <CheckCircle2 size={40} className="text-green-500 mx-auto mb-3" />
          <h3 className="font-bold text-green-800 text-lg mb-2">Talebiniz Alındı!</h3>
          <p className="text-green-700 text-sm">Admin ödemenizi kontrol ettikten sonra paketiniz aktif edilecek. Bildirim alacaksınız.</p>
        </div>
      )}

      {/* Ödeme geçmişi */}
      {paymentRequests.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 font-bold text-[#1B2A4A] text-sm">Ödeme Geçmişi</div>
          <div className="divide-y divide-gray-50">
            {paymentRequests.map(pr => {
              const { label, cls, icon } = statusInfo(pr.status)
              return (
                <div key={pr.id} className="px-6 py-3 flex items-center gap-3">
                  <span className="text-lg">{icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-[#1B2A4A]">{pr.package_name}</div>
                    <div className="text-xs text-gray-400">{formatPrice(pr.amount)} • {new Date(pr.created_at).toLocaleDateString('tr-TR')}</div>
                    {pr.admin_note && <div className="text-xs text-gray-500 mt-0.5">Admin: {pr.admin_note}</div>}
                  </div>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-semibold flex-shrink-0 ${cls}`}>{label}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
