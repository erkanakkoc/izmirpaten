'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Plus, Loader2, Check, X, UserPlus, Ban } from 'lucide-react'
import type { Discipline, Location, LocationDiscipline, Trainer, TrainerDiscipline, Application, GroupSessionParticipant } from '@/types'

interface GroupSessionRow {
  id: string
  discipline_id: string
  location_id: string
  session_date: string
  slot_hour: number
  max_participants: number
  trainer_id: string | null
  lesson_id: string | null
  status: 'open' | 'confirmed' | 'cancelled' | 'completed'
  created_at: string
  locations: { name: string; venue: string } | { name: string; venue: string }[] | null
  trainers: { name: string } | { name: string }[] | null
}

interface Props {
  sessions: GroupSessionRow[]
  disciplines: Discipline[]
  locations: Location[]
  locationDisciplines: LocationDiscipline[]
  trainers: Trainer[]
  trainerDisciplines: TrainerDiscipline[]
  applications: Application[]
  participants: GroupSessionParticipant[]
}

const MONTHS_TR = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık']
const CLS = 'w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#FF6B35]'

function one<T>(v: T | T[] | null): T | null {
  return Array.isArray(v) ? (v[0] ?? null) : v
}

export default function GroupSessionsManager({
  sessions: init, disciplines, locations, locationDisciplines, trainers, trainerDisciplines, applications: initApps, participants: initParticipants,
}: Props) {
  const [sessions, setSessions] = useState(init)
  const [applications, setApplications] = useState(initApps)
  const [participants, setParticipants] = useState(initParticipants)
  const [showAdd, setShowAdd] = useState(false)
  const [busy, setBusy] = useState<string | null>(null)
  const [trainerPick, setTrainerPick] = useState<Record<string, string>>({})

  const [newSession, setNewSession] = useState({
    discipline_id: disciplines[0]?.id ?? '', location_id: '', session_date: '', slot_hour: '17', max_participants: '',
  })

  const locationsForDiscipline = (disciplineId: string) => {
    const allowed = new Set(locationDisciplines.filter(ld => ld.discipline_id === disciplineId).map(ld => ld.location_id))
    return locations.filter(l => allowed.has(l.id))
  }
  const trainersForDiscipline = (disciplineId: string) => {
    const allowed = new Set(trainerDisciplines.filter(td => td.discipline_id === disciplineId).map(td => td.trainer_id))
    return trainers.filter(t => allowed.has(t.id))
  }
  const disciplineName = (id: string) => disciplines.find(d => d.id === id)?.name ?? '—'

  const createSession = async () => {
    if (!newSession.discipline_id || !newSession.location_id || !newSession.session_date) {
      toast.error('Branş, lokasyon ve tarih zorunlu.'); return
    }
    const maxP = newSession.max_participants || disciplines.find(d => d.id === newSession.discipline_id)?.max_group_size?.toString() || '5'
    setBusy('create')
    try {
      const res = await fetch('/api/admin/group-sessions', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create', ...newSession, max_participants: maxP }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setSessions(p => [data.session, ...p])
      setNewSession({ discipline_id: disciplines[0]?.id ?? '', location_id: '', session_date: '', slot_hour: '17', max_participants: '' })
      setShowAdd(false)
      toast.success('Grup oturumu açıldı.')
    } catch (e: unknown) { toast.error(e instanceof Error ? e.message : 'Hata.') }
    finally { setBusy(null) }
  }

  const approveApplicant = async (applicationId: string, groupSessionId: string) => {
    setBusy(applicationId)
    try {
      const res = await fetch('/api/admin/group-sessions', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'approve_applicant', application_id: applicationId, group_session_id: groupSessionId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setApplications(p => p.map(a => a.id === applicationId ? { ...a, status: 'approved' } : a))
      setParticipants(p => {
        const exists = p.some(x => x.application_id === applicationId && x.group_session_id === groupSessionId)
        if (exists) return p.map(x => x.application_id === applicationId && x.group_session_id === groupSessionId ? { ...x, status: 'approved' } : x)
        return [...p, { id: `tmp-${applicationId}`, group_session_id: groupSessionId, application_id: applicationId, student_id: null, enrollment_id: null, status: 'approved', created_at: new Date().toISOString() }]
      })
      toast.success('Başvuru onaylandı.')
    } catch (e: unknown) { toast.error(e instanceof Error ? e.message : 'Hata.') }
    finally { setBusy(null) }
  }

  const rejectApplicant = async (applicationId: string, groupSessionId: string) => {
    setBusy(applicationId)
    try {
      const res = await fetch('/api/admin/group-sessions', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reject_applicant', application_id: applicationId, group_session_id: groupSessionId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setApplications(p => p.map(a => a.id === applicationId ? { ...a, status: 'rejected' } : a))
      toast.success('Başvuru reddedildi.')
    } catch (e: unknown) { toast.error(e instanceof Error ? e.message : 'Hata.') }
    finally { setBusy(null) }
  }

  const assignTrainer = async (groupSessionId: string) => {
    const trainerId = trainerPick[groupSessionId]
    if (!trainerId) { toast.error('Lütfen bir eğitmen seçin.'); return }
    setBusy(groupSessionId)
    try {
      const res = await fetch('/api/admin/group-sessions', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'assign_trainer', group_session_id: groupSessionId, trainer_id: trainerId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      const trainer = trainers.find(t => t.id === trainerId)
      setSessions(p => p.map(s => s.id === groupSessionId ? { ...s, status: 'confirmed', trainer_id: trainerId, trainers: trainer ? { name: trainer.name } : null } : s))
      toast.success('Eğitmen atandı, ders takvime işlendi.')
    } catch (e: unknown) { toast.error(e instanceof Error ? e.message : 'Hata.') }
    finally { setBusy(null) }
  }

  const cancelSession = async (groupSessionId: string) => {
    setBusy(groupSessionId)
    try {
      const res = await fetch('/api/admin/group-sessions', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'cancel', group_session_id: groupSessionId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setSessions(p => p.map(s => s.id === groupSessionId ? { ...s, status: 'cancelled' } : s))
      toast.success('Oturum iptal edildi.')
    } catch (e: unknown) { toast.error(e instanceof Error ? e.message : 'Hata.') }
    finally { setBusy(null) }
  }

  const statusBadge = (status: GroupSessionRow['status']) => ({
    open: <span className="text-xs bg-blue-50 text-blue-600 px-2.5 py-1 rounded-full font-semibold">Açık</span>,
    confirmed: <span className="text-xs bg-green-50 text-green-600 px-2.5 py-1 rounded-full font-semibold">Onaylandı</span>,
    cancelled: <span className="text-xs bg-gray-100 text-gray-500 px-2.5 py-1 rounded-full font-semibold">İptal</span>,
    completed: <span className="text-xs bg-purple-50 text-purple-600 px-2.5 py-1 rounded-full font-semibold">Tamamlandı</span>,
  })[status]

  return (
    <div className="space-y-5">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <span className="font-bold text-[#1B2A4A]">{sessions.length} Grup Oturumu</span>
          <button onClick={() => setShowAdd(!showAdd)}
            className="flex items-center gap-2 px-4 py-2 bg-[#FF6B35] text-white rounded-xl text-sm font-bold hover:bg-orange-500">
            <Plus size={15} /> Yeni Oturum Aç
          </button>
        </div>

        {showAdd && (
          <div className="p-6 bg-orange-50 border-b border-orange-100 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <select value={newSession.discipline_id}
                onChange={e => setNewSession(p => ({ ...p, discipline_id: e.target.value, location_id: '' }))} className={CLS}>
                {disciplines.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
              <select value={newSession.location_id}
                onChange={e => setNewSession(p => ({ ...p, location_id: e.target.value }))} className={CLS}>
                <option value="">Lokasyon seçin</option>
                {locationsForDiscipline(newSession.discipline_id).map(l => <option key={l.id} value={l.id}>{l.name} – {l.venue}</option>)}
              </select>
              <input type="date" value={newSession.session_date}
                onChange={e => setNewSession(p => ({ ...p, session_date: e.target.value }))} className={CLS} />
              <select value={newSession.slot_hour} onChange={e => setNewSession(p => ({ ...p, slot_hour: e.target.value }))} className={CLS}>
                {Array.from({ length: 15 }, (_, i) => i + 8).map(h => <option key={h} value={h}>{String(h).padStart(2, '0')}:00</option>)}
              </select>
              <input type="number" placeholder={`Kontenjan (varsayılan: ${disciplines.find(d => d.id === newSession.discipline_id)?.max_group_size ?? 5})`}
                value={newSession.max_participants}
                onChange={e => setNewSession(p => ({ ...p, max_participants: e.target.value }))} className={CLS} />
            </div>
            <div className="flex gap-2">
              <button onClick={createSession} disabled={busy === 'create'}
                className="flex items-center gap-2 px-4 py-2.5 bg-[#FF6B35] text-white rounded-xl text-sm font-bold disabled:opacity-60">
                {busy === 'create' ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />} Aç
              </button>
              <button onClick={() => setShowAdd(false)} className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold">İptal</button>
            </div>
          </div>
        )}

        <div className="divide-y divide-gray-50">
          {sessions.map(s => {
            const loc = one(s.locations)
            const trainerInfo = one(s.trainers)
            const sessionApps = applications.filter(a => a.group_session_id === s.id)
            const pending = sessionApps.filter(a => a.status === 'new' || a.status === 'reviewed')
            const approvedParticipants = participants.filter(p => p.group_session_id === s.id && p.status === 'approved')
            const d = new Date(s.session_date + 'T12:00:00')
            const eligibleTrainers = trainersForDiscipline(s.discipline_id)

            return (
              <div key={s.id} className="px-6 py-5">
                <div className="flex items-start justify-between gap-4 flex-wrap mb-3">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-bold text-[#1B2A4A]">{disciplineName(s.discipline_id)}</span>
                      {statusBadge(s.status)}
                      <span className="text-xs text-gray-400">
                        {approvedParticipants.length}/{s.max_participants} kontenjan
                      </span>
                    </div>
                    <div className="text-sm text-gray-500">
                      {d.getDate()} {MONTHS_TR[d.getMonth()]} {d.getFullYear()} — {String(s.slot_hour).padStart(2, '0')}:00 — {loc ? `${loc.name} (${loc.venue})` : 'Lokasyon'}
                      {trainerInfo && <span className="ml-2 text-[#1B2A4A] font-semibold">• Eğitmen: {trainerInfo.name}</span>}
                    </div>
                  </div>
                  {s.status === 'open' && (
                    <button onClick={() => cancelSession(s.id)} disabled={busy === s.id}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-red-500 border border-red-200 rounded-xl hover:bg-red-50 disabled:opacity-60">
                      <Ban size={13} /> Oturumu İptal Et
                    </button>
                  )}
                  {s.status === 'confirmed' && (
                    <button onClick={() => cancelSession(s.id)} disabled={busy === s.id}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-red-500 border border-red-200 rounded-xl hover:bg-red-50 disabled:opacity-60">
                      <Ban size={13} /> Dersi İptal Et
                    </button>
                  )}
                </div>

                {s.status === 'open' && (
                  <div className="space-y-3 mt-3">
                    {pending.length > 0 && (
                      <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 space-y-2">
                        <div className="text-xs font-bold text-amber-700 uppercase tracking-wide">Değerlendirme Bekleyen Başvurular ({pending.length})</div>
                        {pending.map(a => (
                          <div key={a.id} className="flex items-center justify-between gap-3 bg-white rounded-lg px-3 py-2">
                            <div className="text-sm">
                              <span className="font-semibold text-[#1B2A4A]">{a.full_name}</span>
                              <span className="text-gray-400 text-xs ml-2">{a.phone}</span>
                            </div>
                            <div className="flex gap-1.5 flex-shrink-0">
                              <button onClick={() => approveApplicant(a.id, s.id)} disabled={busy === a.id}
                                className="p-1.5 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 disabled:opacity-60"><Check size={14} /></button>
                              <button onClick={() => rejectApplicant(a.id, s.id)} disabled={busy === a.id}
                                className="p-1.5 bg-red-50 text-red-500 rounded-lg hover:bg-red-100 disabled:opacity-60"><X size={14} /></button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    {approvedParticipants.length > 0 && (
                      <div className="text-xs text-gray-500">
                        Onaylı: {approvedParticipants.map(p => applications.find(a => a.id === p.application_id)?.full_name).filter(Boolean).join(', ')}
                      </div>
                    )}
                    {approvedParticipants.length > 0 && (
                      <div className="flex items-center gap-2 pt-2">
                        <select value={trainerPick[s.id] ?? ''} onChange={e => setTrainerPick(p => ({ ...p, [s.id]: e.target.value }))}
                          className={`flex-1 ${CLS}`}>
                          <option value="">Eğitmen seçin</option>
                          {eligibleTrainers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                        </select>
                        <button onClick={() => assignTrainer(s.id)} disabled={busy === s.id}
                          className="flex items-center gap-1.5 px-4 py-2.5 bg-[#1B2A4A] text-white rounded-xl text-sm font-bold hover:bg-[#2d4a8a] disabled:opacity-60 flex-shrink-0">
                          {busy === s.id ? <Loader2 size={14} className="animate-spin" /> : <UserPlus size={14} />} Eğitmen Ata
                        </button>
                      </div>
                    )}
                    {eligibleTrainers.length === 0 && (
                      <p className="text-xs text-amber-600">Bu branşa atanmış eğitmen yok — önce Eğitmenler sayfasından atama yapın.</p>
                    )}
                  </div>
                )}
              </div>
            )
          })}
          {sessions.length === 0 && (
            <div className="px-6 py-10 text-center text-gray-400 text-sm">Henüz grup oturumu açılmamış.</div>
          )}
        </div>
      </div>
    </div>
  )
}
