'use client'

import { useState, useEffect, useMemo } from 'react'
import { toast } from 'sonner'
import type { Package, Location, Discipline, LocationDiscipline, OpenGroupSession } from '@/types'

interface ApplicationFormProps {
  packages: Package[]
  locations: Location[]
  disciplines: Discipline[]
  locationDisciplines: LocationDiscipline[]
  openGroupSessions: OpenGroupSession[]
  kvkkUrl?: string
}

const DAYS = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz']
const MONTHS_TR = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık']

export default function ApplicationForm({ packages, locations, disciplines, locationDisciplines, openGroupSessions, kvkkUrl }: ApplicationFormProps) {
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [isForOther, setIsForOther] = useState(false)
  const [selectedDays, setSelectedDays] = useState<string[]>([])
  const [mode, setMode] = useState<'individual' | 'group'>('individual')
  const [groupSessionId, setGroupSessionId] = useState('')

  const [form, setForm] = useState({
    discipline_id: disciplines.length === 1 ? disciplines[0].id : '',
    full_name: '',
    phone: '',
    email: '',
    age: '',
    student_name: '',
    student_age: '',
    package_id: '',
    package_name: '',
    location_id: '',
    location_name: '',
    available_hours: '',
    notes: '',
    kvkk: false,
    video_consent: false,
  })

  const set = (key: string, value: string | boolean) => setForm((p) => ({ ...p, [key]: value }))

  const packagesForDiscipline = useMemo(
    () => packages.filter((p) => p.discipline_id === form.discipline_id),
    [packages, form.discipline_id]
  )
  const locationsForDiscipline = useMemo(() => {
    const allowedIds = new Set(
      locationDisciplines.filter((ld) => ld.discipline_id === form.discipline_id).map((ld) => ld.location_id)
    )
    return locations.filter((l) => allowedIds.has(l.id))
  }, [locations, locationDisciplines, form.discipline_id])

  const groupSessionsForDiscipline = useMemo(
    () => openGroupSessions.filter((s) => s.discipline_id === form.discipline_id),
    [openGroupSessions, form.discipline_id]
  )

  const handleDisciplineChange = (id: string) => {
    setForm((p) => ({ ...p, discipline_id: id, package_id: '', package_name: '', location_id: '', location_name: '' }))
    setGroupSessionId('')
    setMode('individual')
  }

  const formatSessionLabel = (s: OpenGroupSession) => {
    const d = new Date(s.session_date + 'T12:00:00')
    return `${d.getDate()} ${MONTHS_TR[d.getMonth()]} — ${String(s.slot_hour).padStart(2, '0')}:00 — ${s.location_name} (${s.remaining} kontenjan)`
  }

  useEffect(() => {
    const handler = (e: Event) => {
      const { id, name } = (e as CustomEvent<{ id: string; name: string }>).detail
      setForm((p) => ({ ...p, package_id: id, package_name: name }))
    }
    window.addEventListener('selectPackage', handler)
    return () => window.removeEventListener('selectPackage', handler)
  }, [])

  const toggleDay = (day: string) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    )
  }

  const handlePackageChange = (id: string) => {
    const pkg = packages.find((p) => p.id === id)
    set('package_id', id)
    set('package_name', pkg?.name ?? '')
  }

  const handleLocationChange = (id: string) => {
    const loc = locations.find((l) => l.id === id)
    set('location_id', id)
    set('location_name', loc?.name ?? '')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.discipline_id) {
      toast.error('Lütfen bir branş seçin.')
      return
    }
    if (mode === 'group' && !groupSessionId) {
      toast.error('Lütfen bir grup dersi saati seçin.')
      return
    }
    if (mode === 'individual' && (!form.package_id || !form.location_id)) {
      toast.error('Lütfen paket ve lokasyon seçin.')
      return
    }
    if (!form.kvkk) {
      toast.error('Lütfen KVKK metnini onaylayın.')
      return
    }
    setLoading(true)
    try {
      const payload = {
        ...form,
        is_for_self: !isForOther,
        age: form.age ? parseInt(form.age) : null,
        student_age: form.student_age ? parseInt(form.student_age) : null,
        available_days: selectedDays,
        group_session_id: mode === 'group' ? groupSessionId : null,
      }
      const res = await fetch('/api/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Başvuru gönderilemedi.')
      }
      setSubmitted(true)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Bir hata oluştu. Lütfen tekrar deneyin.')
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <section id="basvur" className="py-24 bg-gradient-to-br from-[#1B2A4A] to-[#2d4a8a]">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <div className="bg-white rounded-3xl p-12 shadow-2xl">
            <div className="text-6xl mb-6">🎉</div>
            <h3 className="text-3xl font-extrabold text-[#1B2A4A] mb-4">Harika! Başvurun Alındı</h3>
            <p className="text-gray-600 leading-relaxed mb-8">
              Başvurun için teşekkür ederim! En kısa sürede seninle iletişime geçeceğim.
              Patenin üzerindeki ilk adımlarını birlikte atmak için sabırsızlanıyorum! 🛼
            </p>
            <button
              onClick={() => { setSubmitted(false); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
              className="px-6 py-3 bg-[#FF6B35] text-white rounded-full font-bold hover:bg-orange-500 transition-all"
            >
              Ana Sayfaya Dön
            </button>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section id="basvur" className="py-24 bg-gradient-to-br from-[#1B2A4A] to-[#2d4a8a]">
      <div className="max-w-2xl mx-auto px-4">
        <div className="text-center mb-10">
          <span className="inline-block text-orange-300 font-bold text-sm uppercase tracking-widest mb-3">
            Hadi Başlayalım
          </span>
          <h2 className="text-4xl font-extrabold text-white mb-3">Başvuru Formu</h2>
          <p className="text-blue-200">
            Formu doldur, en kısa sürede seni arayalım.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-8 shadow-2xl space-y-6">
          {/* Branş seçimi — birden fazla aktif branş varsa gösterilir */}
          {disciplines.length > 1 && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Branş <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={form.discipline_id}
                onChange={(e) => handleDisciplineChange(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-[#FF6B35] focus:ring-2 focus:ring-orange-100 transition-all text-sm bg-white"
              >
                <option value="">Branş seçin</option>
                {disciplines.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Ad Soyad & Telefon */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Ad Soyad <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={form.full_name}
                onChange={(e) => set('full_name', e.target.value)}
                placeholder="Adın Soyadın"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-[#FF6B35] focus:ring-2 focus:ring-orange-100 transition-all text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Telefon <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                required
                value={form.phone}
                onChange={(e) => set('phone', e.target.value)}
                placeholder="05XX XXX XX XX"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-[#FF6B35] focus:ring-2 focus:ring-orange-100 transition-all text-sm"
              />
            </div>
          </div>

          {/* E-posta & Yaş */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                E-posta <span className="text-gray-400 font-normal">(opsiyonel)</span>
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => set('email', e.target.value)}
                placeholder="ornek@mail.com"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-[#FF6B35] focus:ring-2 focus:ring-orange-100 transition-all text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Yaşın <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                required={!isForOther}
                min={3}
                max={99}
                value={form.age}
                onChange={(e) => set('age', e.target.value)}
                placeholder="Yaşın"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-[#FF6B35] focus:ring-2 focus:ring-orange-100 transition-all text-sm"
              />
            </div>
          </div>

          {/* Başkası için checkbox */}
          <label className="flex items-center gap-3 cursor-pointer group">
            <input
              type="checkbox"
              checked={isForOther}
              onChange={(e) => setIsForOther(e.target.checked)}
              className="w-4 h-4 accent-[#FF6B35] cursor-pointer"
            />
            <span className="text-sm text-gray-600 group-hover:text-gray-800 transition-colors">
              Başkası için başvuruyorum (çocuğum, vb.)
            </span>
          </label>

          {/* Öğrenci bilgileri */}
          {isForOther && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-orange-50 rounded-2xl border border-orange-100">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Öğrenci Adı <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required={isForOther}
                  value={form.student_name}
                  onChange={(e) => set('student_name', e.target.value)}
                  placeholder="Öğrencinin adı"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-[#FF6B35] transition-all text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Öğrenci Yaşı <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  required={isForOther}
                  min={3}
                  max={99}
                  value={form.student_age}
                  onChange={(e) => set('student_age', e.target.value)}
                  placeholder="Yaş"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-[#FF6B35] transition-all text-sm"
                />
              </div>
            </div>
          )}

          {/* Bireysel / Grup dersi seçimi — yalnızca seçili branşta açık grup oturumu varsa gösterilir */}
          {form.discipline_id && groupSessionsForDiscipline.length > 0 && (
            <div className="flex gap-2 p-1 bg-gray-100 rounded-xl">
              <button type="button" onClick={() => setMode('individual')}
                className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${mode === 'individual' ? 'bg-white text-[#FF6B35] shadow-sm' : 'text-gray-500'}`}>
                Bireysel Ders
              </button>
              <button type="button" onClick={() => setMode('group')}
                className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${mode === 'group' ? 'bg-white text-[#FF6B35] shadow-sm' : 'text-gray-500'}`}>
                Grup Dersi
              </button>
            </div>
          )}

          {/* Grup dersi: açık oturum seçimi */}
          {mode === 'group' && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Grup Dersi Saati <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={groupSessionId}
                onChange={(e) => setGroupSessionId(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-[#FF6B35] focus:ring-2 focus:ring-orange-100 transition-all text-sm bg-white"
              >
                <option value="">Saat seçin</option>
                {groupSessionsForDiscipline.map((s) => (
                  <option key={s.id} value={s.id}>{formatSessionLabel(s)}</option>
                ))}
              </select>
              <p className="text-xs text-gray-400 mt-1.5">Başvurunuz admin tarafından değerlendirilip onaylanacaktır.</p>
            </div>
          )}

          {/* Bireysel: Paket & Lokasyon */}
          {mode === 'individual' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Tercih Ettiğin Paket
                </label>
                <select
                  value={form.package_id}
                  onChange={(e) => handlePackageChange(e.target.value)}
                  disabled={!form.discipline_id}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-[#FF6B35] focus:ring-2 focus:ring-orange-100 transition-all text-sm bg-white disabled:bg-gray-50 disabled:text-gray-400"
                >
                  <option value="">Paket seçin</option>
                  {packagesForDiscipline.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Tercih Ettiğin Lokasyon
                </label>
                <select
                  value={form.location_id}
                  onChange={(e) => handleLocationChange(e.target.value)}
                  disabled={!form.discipline_id}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-[#FF6B35] focus:ring-2 focus:ring-orange-100 transition-all text-sm bg-white disabled:bg-gray-50 disabled:text-gray-400"
                >
                  <option value="">Lokasyon seçin</option>
                  {locationsForDiscipline.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name} – {l.venue}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Müsait günler */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Müsait Günler
            </label>
            <div className="flex flex-wrap gap-2">
              {DAYS.map((day) => (
                <button
                  key={day}
                  type="button"
                  onClick={() => toggleDay(day)}
                  className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                    selectedDays.includes(day)
                      ? 'bg-[#FF6B35] text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-orange-50 hover:text-[#FF6B35]'
                  }`}
                >
                  {day}
                </button>
              ))}
            </div>
          </div>

          {/* Müsait saatler */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Müsait Saatler
            </label>
            <textarea
              value={form.available_hours}
              onChange={(e) => set('available_hours', e.target.value)}
              placeholder="Örn: Hafta içi 19:00 sonrası, hafta sonu öğleden sonra"
              rows={2}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-[#FF6B35] focus:ring-2 focus:ring-orange-100 transition-all text-sm resize-none"
            />
          </div>

          {/* Ek notlar */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Ek Notlar <span className="text-gray-400 font-normal">(opsiyonel)</span>
            </label>
            <textarea
              value={form.notes}
              onChange={(e) => set('notes', e.target.value)}
              placeholder="Eklemek istediklerin..."
              rows={3}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-[#FF6B35] focus:ring-2 focus:ring-orange-100 transition-all text-sm resize-none"
            />
          </div>

          {/* Video izni */}
          <label className="flex items-start gap-3 cursor-pointer p-4 bg-blue-50 rounded-2xl border border-blue-100">
            <input
              type="checkbox"
              checked={form.video_consent}
              onChange={(e) => set('video_consent', e.target.checked)}
              className="w-4 h-4 accent-[#FF6B35] cursor-pointer mt-0.5 flex-shrink-0"
            />
            <span className="text-sm text-gray-600 leading-relaxed">
              Gelişim sürecimin video/fotoğrafla kayıt altına alınmasına ve{' '}
              <span className="font-semibold text-[#FF6B35]">@patenizmir</span> sosyal medya
              hesaplarında paylaşılmasına izin veriyorum.
            </span>
          </label>

          {/* KVKK */}
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              required
              checked={form.kvkk}
              onChange={(e) => set('kvkk', e.target.checked)}
              className="w-4 h-4 accent-[#FF6B35] cursor-pointer mt-0.5 flex-shrink-0"
            />
            <span className="text-sm text-gray-600 leading-relaxed">
              Kişisel verilerimin işlenmesine ilişkin{' '}
              {kvkkUrl ? (
                <a href={kvkkUrl} target="_blank" rel="noopener noreferrer"
                  className="text-[#FF6B35] font-semibold underline underline-offset-2 hover:text-orange-600 transition-colors">
                  KVKK aydınlatma metnini
                </a>
              ) : (
                <span className="text-[#FF6B35] font-semibold">KVKK aydınlatma metnini</span>
              )}{' '}okudum ve onaylıyorum. <span className="text-red-500">*</span>
            </span>
          </label>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-gradient-to-r from-[#FF6B35] to-orange-500 text-white rounded-2xl font-bold text-lg hover:from-orange-500 hover:to-orange-600 transition-all hover:scale-[1.02] disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-orange-200"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Gönderiliyor...
              </span>
            ) : (
              'Başvuruyu Gönder 🛼'
            )}
          </button>
        </form>
      </div>
    </section>
  )
}
