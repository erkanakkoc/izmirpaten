'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Check, X, CheckCircle } from 'lucide-react'
import type { Lesson } from '@/types'

type LessonWithRelations = Lesson & {
  students?: { full_name: string; email: string } | null
  locations?: { name: string } | null
  enrollments?: { package_name: string; lessons_remaining: number } | null
}

interface Props { lessons: LessonWithRelations[] }

export default function TrainerLessons({ lessons: init }: Props) {
  const [lessons, setLessons] = useState<LessonWithRelations[]>(init)
  const [modal, setModal] = useState<{ lesson: LessonWithRelations; action: string } | null>(null)
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)
  const [filter, setFilter] = useState<string>('all')

  const filtered = filter === 'all' ? lessons : lessons.filter(l => l.status === filter)

  const handle = async () => {
    if (!modal) return
    setLoading(true)
    try {
      const res = await fetch('/api/trainer/lesson', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lesson_id: modal.lesson.id, action: modal.action, trainer_note: note }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      const newStatus = modal.action === 'approve' ? 'approved' : modal.action === 'reject' ? 'cancelled' : 'completed'
      setLessons(p => p.map(l => l.id === modal.lesson.id ? { ...l, status: newStatus as Lesson['status'] } : l))
      toast.success('Güncellendi.')
      setModal(null); setNote('')
    } catch (e: unknown) { toast.error(e instanceof Error ? e.message : 'Hata.') }
    finally { setLoading(false) }
  }

  const statusInfo = (s: string) => ({
    pending: { label: 'Bekliyor', cls: 'bg-amber-100 text-amber-700' },
    approved: { label: 'Onaylandı', cls: 'bg-blue-100 text-blue-700' },
    completed: { label: 'Tamamlandı', cls: 'bg-green-100 text-green-700' },
    cancelled: { label: 'İptal', cls: 'bg-red-100 text-red-700' },
  }[s] ?? { label: s, cls: 'bg-gray-100 text-gray-600' })

  const filters = [
    { key: 'all', label: 'Tümü' }, { key: 'pending', label: 'Bekliyor' },
    { key: 'approved', label: 'Onaylı' }, { key: 'completed', label: 'Tamamlanan' },
  ]

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-5">
        {filters.map(f => (
          <button key={f.key} onClick={() => setFilter(f.key)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${filter === f.key ? 'bg-[#FF6B35] text-white' : 'bg-white border border-gray-200 text-gray-500 hover:border-orange-200'}`}>
            {f.label}
            <span className={`ml-2 text-xs px-1.5 py-0.5 rounded-full ${filter === f.key ? 'bg-white/20' : 'bg-gray-100'}`}>
              {f.key === 'all' ? lessons.length : lessons.filter(l => l.status === f.key).length}
            </span>
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="divide-y divide-gray-50">
          {filtered.map(l => {
            const { label, cls } = statusInfo(l.status)
            return (
              <div key={l.id} className="px-6 py-4 flex flex-wrap items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm text-[#1B2A4A]">{l.students?.full_name}</div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    {new Date(l.scheduled_at).toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                    {' '}{new Date(l.scheduled_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                    {l.locations && ` • ${l.locations.name}`}
                  </div>
                  {l.enrollments && (
                    <div className="text-xs text-gray-400 mt-0.5">{l.enrollments.package_name} • Kalan: {l.enrollments.lessons_remaining} ders</div>
                  )}
                  {l.trainer_note && <div className="text-xs text-gray-500 mt-0.5 italic">"{l.trainer_note}"</div>}
                  {l.student_note && <div className="text-xs text-gray-400 mt-0.5">Öğrenci notu: {l.student_note}</div>}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${cls}`}>{label}</span>
                  {l.status === 'pending' && (
                    <>
                      <button onClick={() => { setModal({ lesson: l, action: 'approve' }); setNote('') }}
                        className="p-1.5 bg-green-50 text-green-600 rounded-xl hover:bg-green-100"><Check size={15} /></button>
                      <button onClick={() => { setModal({ lesson: l, action: 'reject' }); setNote('') }}
                        className="p-1.5 bg-red-50 text-red-400 rounded-xl hover:bg-red-100"><X size={15} /></button>
                    </>
                  )}
                  {l.status === 'approved' && (
                    <button onClick={() => { setModal({ lesson: l, action: 'complete' }); setNote('') }}
                      className="flex items-center gap-1 px-3 py-1.5 bg-green-50 text-green-600 rounded-xl text-xs font-semibold hover:bg-green-100">
                      <CheckCircle size={13} /> Tamamlandı
                    </button>
                  )}
                </div>
              </div>
            )
          })}
          {filtered.length === 0 && (
            <div className="px-6 py-10 text-center text-gray-400 text-sm">Ders bulunamadı.</div>
          )}
        </div>
      </div>

      {modal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6">
            <h3 className="font-bold text-[#1B2A4A] mb-4">
              {modal.action === 'approve' ? '✅ Dersi Onayla' : modal.action === 'reject' ? '❌ Dersi Reddet' : '🎉 Ders Tamamlandı'}
            </h3>
            <p className="text-sm text-gray-500 mb-4">{modal.lesson.students?.full_name} — {new Date(modal.lesson.scheduled_at).toLocaleDateString('tr-TR')}</p>
            <div className="mb-4">
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Not (opsiyonel)</label>
              <textarea rows={2} value={note} onChange={e => setNote(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#FF6B35] resize-none" />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setModal(null)} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold">İptal</button>
              <button onClick={handle} disabled={loading}
                className={`flex-1 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-60 ${modal.action === 'approve' || modal.action === 'complete' ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600'}`}>
                {loading ? 'İşleniyor...' : 'Onayla'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
