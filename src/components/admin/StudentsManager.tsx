'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Plus, Loader2, ChevronDown, ChevronUp } from 'lucide-react'
import type { Student, Trainer, Package, Enrollment, Lesson } from '@/types'
import { formatDate } from '@/lib/utils'

interface Props {
  students: Student[]
  trainers: { id: string; name: string }[]
  packages: { id: string; name: string; price: number }[]
  enrollments: Enrollment[]
  lessons: (Lesson & { trainers?: { name: string } | null })[]
}

type InviteForm = {
  application_id: string; full_name: string; email: string; phone: string
  trainer_id: string; package_id: string; package_name: string; total_lessons: string
}

const PACKAGE_LESSONS: Record<string, number> = {
  'Birebir – Tek Ders': 1, 'Birebir – Aylık 4 Ders': 4, 'Birebir – Aylık 8 Ders': 8,
  'Grup – Aylık 4 Ders': 4, 'Grup – Aylık 8 Ders': 8, 'Mini Grup – Kişi Başı': 2,
}

export default function StudentsManager({ students, trainers, packages, enrollments, lessons }: Props) {
  const [list, setList] = useState<Student[]>(students)
  const [showAdd, setShowAdd] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState<InviteForm>({
    application_id: '', full_name: '', email: '', phone: '',
    trainer_id: '', package_id: '', package_name: '', total_lessons: '',
  })

  const getEnrollment = (studentId: string) => enrollments.find(e => e.student_id === studentId)
  const getLessons = (studentId: string) => lessons.filter(l => l.student_id === studentId).sort((a, b) => new Date(b.scheduled_at).getTime() - new Date(a.scheduled_at).getTime())

  const handlePackageChange = (pkgId: string) => {
    const pkg = packages.find(p => p.id === pkgId)
    setForm(p => ({
      ...p, package_id: pkgId,
      package_name: pkg?.name ?? '',
      total_lessons: String(PACKAGE_LESSONS[pkg?.name ?? ''] ?? 4),
    }))
  }

  const invite = async () => {
    if (!form.full_name || !form.email) { toast.error('Ad ve e-posta zorunlu.'); return }
    setLoading(true)
    try {
      const res = await fetch('/api/admin/invite-student', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, total_lessons: parseInt(form.total_lessons) || 4 }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setList(p => [data.student, ...p])
      setShowAdd(false)
      toast.success('Öğrenci eklendi, davet maili gönderildi.')
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Hata oluştu.')
    } finally { setLoading(false) }
  }

  const CLS = 'w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#FF6B35]'

  const lessonStatusColor = (s: string) => ({
    pending: 'bg-yellow-100 text-yellow-700', approved: 'bg-blue-100 text-blue-700',
    completed: 'bg-green-100 text-green-700', cancelled: 'bg-red-100 text-red-700',
  }[s] ?? 'bg-gray-100 text-gray-600')

  const lessonStatusLabel = (s: string) => ({
    pending: 'Bekliyor', approved: 'Onaylandı', completed: 'Tamamlandı', cancelled: 'İptal',
  }[s] ?? s)

  return (
    <div>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <span className="font-bold text-[#1B2A4A]">{list.length} Öğrenci</span>
          <button onClick={() => setShowAdd(!showAdd)}
            className="flex items-center gap-2 px-4 py-2 bg-[#FF6B35] text-white rounded-xl text-sm font-bold hover:bg-orange-500">
            <Plus size={15} /> Öğrenci Ekle
          </button>
        </div>

        {showAdd && (
          <div className="p-6 bg-orange-50 border-b border-orange-100 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div><label className="block text-xs font-semibold text-gray-600 mb-1">Ad Soyad *</label>
                <input value={form.full_name} onChange={e => setForm(p => ({ ...p, full_name: e.target.value }))} className={CLS} /></div>
              <div><label className="block text-xs font-semibold text-gray-600 mb-1">E-posta *</label>
                <input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} className={CLS} /></div>
              <div><label className="block text-xs font-semibold text-gray-600 mb-1">Telefon</label>
                <input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} className={CLS} /></div>
              <div><label className="block text-xs font-semibold text-gray-600 mb-1">Eğitmen</label>
                <select value={form.trainer_id} onChange={e => setForm(p => ({ ...p, trainer_id: e.target.value }))} className={`${CLS} bg-white`}>
                  <option value="">Seç</option>
                  {trainers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select></div>
              <div><label className="block text-xs font-semibold text-gray-600 mb-1">Paket</label>
                <select value={form.package_id} onChange={e => handlePackageChange(e.target.value)} className={`${CLS} bg-white`}>
                  <option value="">Seç</option>
                  {packages.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select></div>
              <div><label className="block text-xs font-semibold text-gray-600 mb-1">Toplam Ders</label>
                <input type="number" min={1} value={form.total_lessons} onChange={e => setForm(p => ({ ...p, total_lessons: e.target.value }))} className={CLS} /></div>
            </div>
            <div className="flex gap-2">
              <button onClick={invite} disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-[#FF6B35] text-white rounded-xl text-sm font-bold disabled:opacity-60">
                {loading ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                Davet Gönder
              </button>
              <button onClick={() => setShowAdd(false)} className="px-4 py-2 border border-gray-200 rounded-xl text-sm">İptal</button>
            </div>
          </div>
        )}

        <div className="divide-y divide-gray-50">
          {list.map(student => {
            const enrollment = getEnrollment(student.id)
            const studentLessons = getLessons(student.id)
            const isOpen = expanded === student.id
            return (
              <div key={student.id}>
                <button onClick={() => setExpanded(isOpen ? null : student.id)}
                  className="w-full px-6 py-4 flex items-center gap-4 hover:bg-gray-50 transition-colors text-left">
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm text-[#1B2A4A]">{student.full_name}</div>
                    <div className="text-xs text-gray-400">{student.email}</div>
                  </div>
                  {enrollment && (
                    <div className="text-center flex-shrink-0">
                      <div className="text-lg font-extrabold text-[#FF6B35]">{enrollment.lessons_remaining}</div>
                      <div className="text-xs text-gray-400">ders hakkı</div>
                    </div>
                  )}
                  {enrollment && (
                    <div className="text-xs text-gray-500 flex-shrink-0 hidden sm:block">
                      {enrollment.package_name}
                    </div>
                  )}
                  {!enrollment && <span className="text-xs text-gray-400 flex-shrink-0">Kayıt yok</span>}
                  {isOpen ? <ChevronUp size={16} className="text-gray-400 flex-shrink-0" /> : <ChevronDown size={16} className="text-gray-400 flex-shrink-0" />}
                </button>

                {isOpen && (
                  <div className="px-6 pb-5 bg-gray-50/50 border-t border-gray-100">
                    {enrollment && (
                      <div className="mt-4 mb-4 grid grid-cols-3 gap-3">
                        <div className="bg-white rounded-xl p-3 text-center border border-gray-100">
                          <div className="text-xl font-extrabold text-[#1B2A4A]">{enrollment.total_lessons}</div>
                          <div className="text-xs text-gray-400">Toplam Ders</div>
                        </div>
                        <div className="bg-white rounded-xl p-3 text-center border border-green-100">
                          <div className="text-xl font-extrabold text-green-600">{enrollment.lessons_remaining}</div>
                          <div className="text-xs text-gray-400">Kalan Ders</div>
                        </div>
                        <div className="bg-white rounded-xl p-3 text-center border border-orange-100">
                          <div className="text-xl font-extrabold text-[#FF6B35]">{enrollment.total_lessons - enrollment.lessons_remaining}</div>
                          <div className="text-xs text-gray-400">Alınan Ders</div>
                        </div>
                      </div>
                    )}

                    {studentLessons.length > 0 && (
                      <div>
                        <div className="text-xs font-semibold text-gray-500 mb-2">Dersler</div>
                        <div className="space-y-2">
                          {studentLessons.slice(0, 5).map(l => (
                            <div key={l.id} className="flex items-center gap-3 bg-white rounded-xl p-3 border border-gray-100">
                              <div className="flex-1 min-w-0">
                                <div className="text-xs font-semibold text-[#1B2A4A]">{new Date(l.scheduled_at).toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' })}</div>
                                <div className="text-xs text-gray-400">{new Date(l.scheduled_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })} • {l.trainers?.name ?? 'Eğitmen atanmamış'}</div>
                              </div>
                              <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${lessonStatusColor(l.status)}`}>
                                {lessonStatusLabel(l.status)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {studentLessons.length === 0 && <p className="text-xs text-gray-400 mt-2">Henüz ders yok.</p>}
                  </div>
                )}
              </div>
            )
          })}
          {list.length === 0 && (
            <div className="px-6 py-10 text-center text-gray-400 text-sm">Henüz öğrenci yok.</div>
          )}
        </div>
      </div>
    </div>
  )
}
