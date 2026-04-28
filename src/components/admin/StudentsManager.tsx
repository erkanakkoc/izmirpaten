'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Plus, Loader2, ChevronDown, ChevronUp, Trash2, RefreshCw, History } from 'lucide-react'
import type { Student, Trainer, Package, Enrollment, Lesson } from '@/types'
import { formatDate } from '@/lib/utils'

interface TrainerChange {
  id: string
  enrollment_id: string
  old_trainer_name: string | null
  new_trainer_name: string | null
  changed_by: string
  reason: string | null
  created_at: string
}

interface TrainerChangeRequest {
  id: string
  student_id: string
  enrollment_id: string
  reason: string | null
  status: string
  created_at: string
}

interface Props {
  students: Student[]
  trainers: { id: string; name: string }[]
  packages: { id: string; name: string; price: number }[]
  enrollments: Enrollment[]
  lessons: (Lesson & { trainers?: { name: string } | null })[]
  trainerChanges: TrainerChange[]
  pendingRequests: (TrainerChangeRequest & { students?: { full_name: string } | null })[]
}

const PACKAGE_LESSONS: Record<string, number> = {
  'Birebir – Tek Ders': 1, 'Birebir – Aylık 4 Ders': 4, 'Birebir – Aylık 8 Ders': 8,
  'Grup – Aylık 4 Ders': 4, 'Grup – Aylık 8 Ders': 8, 'Mini Grup – Kişi Başı': 2,
}

type InviteForm = {
  full_name: string; email: string; phone: string
  trainer_id: string; package_id: string; package_name: string; total_lessons: string
}

export default function StudentsManager({ students, trainers, packages, enrollments, lessons, trainerChanges, pendingRequests }: Props) {
  const [list, setList] = useState<Student[]>(students)
  const [showAdd, setShowAdd] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [changeTrainerModal, setChangeTrainerModal] = useState<{ enrollmentId: string; requestId?: string; studentName: string } | null>(null)
  const [newTrainerId, setNewTrainerId] = useState('')
  const [changeReason, setChangeReason] = useState('')
  const [changing, setChanging] = useState(false)
  const [form, setForm] = useState<InviteForm>({ full_name: '', email: '', phone: '', trainer_id: '', package_id: '', package_name: '', total_lessons: '' })

  const getEnrollment = (studentId: string) => enrollments.find(e => e.student_id === studentId)
  const getStudentLessons = (studentId: string) => lessons.filter(l => l.student_id === studentId).sort((a, b) => new Date(b.scheduled_at).getTime() - new Date(a.scheduled_at).getTime())
  const getStudentChanges = (enrollmentId: string) => trainerChanges.filter(c => c.enrollment_id === enrollmentId)
  const getTrainerName = (id: string | null) => trainers.find(t => t.id === id)?.name ?? 'Yok'

  const handlePackageChange = (pkgId: string) => {
    const pkg = packages.find(p => p.id === pkgId)
    setForm(p => ({ ...p, package_id: pkgId, package_name: pkg?.name ?? '', total_lessons: String(PACKAGE_LESSONS[pkg?.name ?? ''] ?? 4) }))
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
    } catch (e: unknown) { toast.error(e instanceof Error ? e.message : 'Hata.') }
    finally { setLoading(false) }
  }

  const deleteStudent = async (id: string) => {
    setDeleting(true)
    try {
      const res = await fetch('/api/admin/delete-student', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ student_id: id }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setList(p => p.filter(s => s.id !== id))
      setDeleteConfirm(null)
      toast.success('Öğrenci silindi.')
    } catch (e: unknown) { toast.error(e instanceof Error ? e.message : 'Hata.') }
    finally { setDeleting(false) }
  }

  const changeTrainer = async () => {
    if (!newTrainerId || !changeTrainerModal) { toast.error('Eğitmen seçin.'); return }
    setChanging(true)
    try {
      const res = await fetch('/api/admin/change-trainer', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enrollment_id: changeTrainerModal.enrollmentId, new_trainer_id: newTrainerId, reason: changeReason, request_id: changeTrainerModal.requestId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success(`Eğitmen değiştirildi: ${getTrainerName(newTrainerId)}`)
      setChangeTrainerModal(null); setNewTrainerId(''); setChangeReason('')
      // Sayfayı yenile
      window.location.reload()
    } catch (e: unknown) { toast.error(e instanceof Error ? e.message : 'Hata.') }
    finally { setChanging(false) }
  }

  const CLS = 'w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#FF6B35]'
  const lessonStatusColor = (s: string) => ({ pending: 'bg-yellow-100 text-yellow-700', approved: 'bg-blue-100 text-blue-700', completed: 'bg-green-100 text-green-700', cancelled: 'bg-red-100 text-red-700' }[s] ?? 'bg-gray-100 text-gray-600')
  const lessonStatusLabel = (s: string) => ({ pending: 'Bekliyor', approved: 'Onaylandı', completed: 'Tamamlandı', cancelled: 'İptal' }[s] ?? s)

  return (
    <div className="space-y-5">
      {/* Bekleyen eğitmen değişiklik talepleri */}
      {pendingRequests.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl overflow-hidden">
          <div className="px-6 py-3 font-bold text-amber-800 text-sm border-b border-amber-200">
            🔄 Bekleyen Eğitmen Değişiklik Talepleri ({pendingRequests.length})
          </div>
          <div className="divide-y divide-amber-100">
            {pendingRequests.map(req => (
              <div key={req.id} className="px-6 py-3 flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm text-[#1B2A4A]">{(req.students as { full_name: string } | null)?.full_name}</div>
                  {req.reason && <div className="text-xs text-gray-500 mt-0.5">Neden: {req.reason}</div>}
                  <div className="text-xs text-gray-400">{formatDate(req.created_at)}</div>
                </div>
                <button
                  onClick={() => {
                    const enrollment = enrollments.find(e => e.id === req.enrollment_id)
                    setChangeTrainerModal({ enrollmentId: req.enrollment_id, requestId: req.id, studentName: (req.students as { full_name: string } | null)?.full_name ?? '' })
                    setNewTrainerId(enrollment?.trainer_id ?? '')
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[#FF6B35] text-white rounded-xl text-xs font-semibold hover:bg-orange-500">
                  <RefreshCw size={12} /> Eğitmen Ata
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

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
            const studentLessons = getStudentLessons(student.id)
            const changes = enrollment ? getStudentChanges(enrollment.id) : []
            const isOpen = expanded === student.id
            return (
              <div key={student.id}>
                <button onClick={() => setExpanded(isOpen ? null : student.id)}
                  className="w-full px-6 py-4 flex items-center gap-4 hover:bg-gray-50 transition-colors text-left">
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm text-[#1B2A4A]">{student.full_name}</div>
                    <div className="text-xs text-gray-400">{student.email}</div>
                    {enrollment && (
                      <div className="text-xs text-gray-500 mt-0.5">
                        {enrollment.package_name} • Eğitmen: {getTrainerName(enrollment.trainer_id)}
                      </div>
                    )}
                  </div>
                  {enrollment && (
                    <div className="text-center flex-shrink-0">
                      <div className={`text-lg font-extrabold ${enrollment.lessons_remaining <= 1 ? 'text-red-500' : 'text-[#FF6B35]'}`}>{enrollment.lessons_remaining}</div>
                      <div className="text-xs text-gray-400">ders</div>
                    </div>
                  )}
                  <button onClick={e => { e.stopPropagation(); setDeleteConfirm(student.id) }}
                    className="p-1.5 rounded-lg hover:bg-red-50 text-red-400 flex-shrink-0">
                    <Trash2 size={15} />
                  </button>
                  {isOpen ? <ChevronUp size={16} className="text-gray-400 flex-shrink-0" /> : <ChevronDown size={16} className="text-gray-400 flex-shrink-0" />}
                </button>

                {isOpen && (
                  <div className="px-6 pb-5 bg-gray-50/50 border-t border-gray-100">
                    {enrollment && (
                      <>
                        {/* Ders istatistikleri */}
                        <div className="mt-4 mb-4 grid grid-cols-3 gap-3">
                          <div className="bg-white rounded-xl p-3 text-center border border-gray-100">
                            <div className="text-xl font-extrabold text-[#1B2A4A]">{enrollment.total_lessons}</div>
                            <div className="text-xs text-gray-400">Toplam</div>
                          </div>
                          <div className="bg-white rounded-xl p-3 text-center border border-green-100">
                            <div className="text-xl font-extrabold text-green-600">{enrollment.lessons_remaining}</div>
                            <div className="text-xs text-gray-400">Kalan</div>
                          </div>
                          <div className="bg-white rounded-xl p-3 text-center border border-orange-100">
                            <div className="text-xl font-extrabold text-[#FF6B35]">{enrollment.total_lessons - enrollment.lessons_remaining}</div>
                            <div className="text-xs text-gray-400">Alınan</div>
                          </div>
                        </div>

                        {/* Eğitmen değiştir */}
                        <div className="flex items-center justify-between mb-3">
                          <div className="text-xs font-semibold text-gray-500">
                            Mevcut Eğitmen: <span className="text-[#1B2A4A]">{getTrainerName(enrollment.trainer_id)}</span>
                          </div>
                          <button onClick={() => { setChangeTrainerModal({ enrollmentId: enrollment.id, studentName: student.full_name }); setNewTrainerId(enrollment.trainer_id ?? '') }}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-xl text-xs font-semibold hover:bg-blue-100">
                            <RefreshCw size={12} /> Eğitmen Değiştir
                          </button>
                        </div>
                      </>
                    )}

                    {/* Dersler */}
                    {studentLessons.length > 0 && (
                      <div className="mb-4">
                        <div className="text-xs font-semibold text-gray-500 mb-2">Son Dersler</div>
                        <div className="space-y-1.5">
                          {studentLessons.slice(0, 5).map(l => (
                            <div key={l.id} className="flex items-center gap-3 bg-white rounded-xl p-2.5 border border-gray-100">
                              <div className="flex-1 min-w-0">
                                <div className="text-xs font-semibold text-[#1B2A4A]">
                                  {new Date(l.scheduled_at).toLocaleDateString('tr-TR', { weekday: 'short', day: 'numeric', month: 'short' })} {new Date(l.scheduled_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                                </div>
                                <div className="text-xs text-gray-400">{l.trainers?.name}</div>
                              </div>
                              <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${lessonStatusColor(l.status)}`}>{lessonStatusLabel(l.status)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Eğitmen değişiklik geçmişi */}
                    {changes.length > 0 && (
                      <div>
                        <div className="text-xs font-semibold text-gray-500 mb-2 flex items-center gap-1.5">
                          <History size={12} /> Eğitmen Değişiklik Geçmişi
                        </div>
                        <div className="space-y-1.5">
                          {changes.map(c => (
                            <div key={c.id} className="bg-white rounded-xl p-2.5 border border-gray-100 text-xs">
                              <span className="text-gray-500">{c.old_trainer_name ?? 'Yok'}</span>
                              <span className="text-gray-400 mx-2">→</span>
                              <span className="font-semibold text-[#1B2A4A]">{c.new_trainer_name ?? 'Yok'}</span>
                              {c.reason && <span className="text-gray-400 ml-2">• {c.reason}</span>}
                              <span className="text-gray-400 ml-2">{formatDate(c.created_at)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
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

      {/* Öğrenci silme onay modalı */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-6">
            <h3 className="font-bold text-[#1B2A4A] text-lg mb-2">Öğrenciyi Sil</h3>
            <p className="text-xs text-red-600 bg-red-50 border border-red-100 p-2 rounded-xl mb-5">
              ⚠️ Öğrencinin tüm dersleri, kayıtları ve Supabase hesabı kalıcı olarak silinir.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold">İptal</button>
              <button onClick={() => deleteStudent(deleteConfirm)} disabled={deleting}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-red-500 text-white rounded-xl text-sm font-bold disabled:opacity-60">
                {deleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />} Sil
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Eğitmen değiştirme modalı */}
      {changeTrainerModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6">
            <h3 className="font-bold text-[#1B2A4A] text-lg mb-1">Eğitmen Değiştir</h3>
            <p className="text-sm text-gray-500 mb-4">{changeTrainerModal.studentName}</p>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Yeni Eğitmen *</label>
                <select value={newTrainerId} onChange={e => setNewTrainerId(e.target.value)} className={`${CLS} bg-white`}>
                  <option value="">Seç</option>
                  {trainers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Değişiklik Nedeni</label>
                <textarea rows={2} value={changeReason} onChange={e => setChangeReason(e.target.value)}
                  className={`w-full ${CLS} resize-none`} placeholder="İsteğe bağlı..." />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => { setChangeTrainerModal(null); setNewTrainerId(''); setChangeReason('') }}
                className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold">İptal</button>
              <button onClick={changeTrainer} disabled={changing || !newTrainerId}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-[#FF6B35] text-white rounded-xl text-sm font-bold disabled:opacity-60">
                {changing ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
                Değiştir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
