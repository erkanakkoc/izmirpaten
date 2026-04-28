'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { CalendarDays, Clock, Loader2 } from 'lucide-react'
import type { TrainerAvailability, Enrollment, Location } from '@/types'
import { DAYS_TR } from '@/types'

type AvailWithRelations = TrainerAvailability & {
  trainers?: { id: string; name: string } | null
  locations?: { id: string; name: string } | null
}

interface Props {
  studentId: string
  enrollment: (Enrollment & { trainers?: { id: string; name: string } | null }) | null
  availability: AvailWithRelations[]
  locations: Location[]
}

function getNextDates(dayOfWeek: number, count = 4): Date[] {
  const dates: Date[] = []
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  let d = new Date(today)
  while (dates.length < count) {
    d = new Date(d.getTime() + 24 * 60 * 60 * 1000)
    if (d.getDay() === dayOfWeek) dates.push(new Date(d))
  }
  return dates
}

function getTimeSlots(start: string, end: string): string[] {
  const slots: string[] = []
  const [sh, sm] = start.split(':').map(Number)
  const [eh, em] = end.split(':').map(Number)
  let h = sh, m = sm
  while (h < eh || (h === eh && m < em)) {
    slots.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`)
    m += 40
    if (m >= 60) { h++; m -= 60 }
  }
  return slots
}

export default function BookLesson({ studentId, enrollment, availability, locations }: Props) {
  const [selectedDate, setSelectedDate] = useState<string>('')
  const [selectedTime, setSelectedTime] = useState<string>('')
  const [selectedAvail, setSelectedAvail] = useState<AvailWithRelations | null>(null)
  const [note, setNote] = useState('')
  const [booking, setBooking] = useState(false)

  if (!enrollment) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center text-gray-400">
        Aktif paketiniz yok. Lütfen önce bir paket satın alın.
      </div>
    )
  }

  if (enrollment.lessons_remaining <= 0) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-8 text-center">
        <p className="text-amber-700 font-semibold">Ders hakkınız kalmamış.</p>
        <a href="/student/package" className="text-[#FF6B35] text-sm font-semibold mt-2 inline-block">Paket yenile →</a>
      </div>
    )
  }

  // Öğrencinin eğitmeni varsa sadece onun müsaitliklerini göster
  const filteredAvail = enrollment.trainer_id
    ? availability.filter(a => (a.trainers as { id: string } | null)?.id === enrollment.trainer_id)
    : availability

  const book = async () => {
    if (!selectedDate || !selectedTime || !selectedAvail) { toast.error('Lütfen bir zaman seçin.'); return }
    setBooking(true)
    try {
      const scheduled_at = new Date(`${selectedDate}T${selectedTime}:00`).toISOString()
      const res = await fetch('/api/student/book-lesson', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          enrollment_id: enrollment.id,
          trainer_id: (selectedAvail.trainers as { id: string } | null)?.id,
          location_id: (selectedAvail.locations as { id: string } | null)?.id,
          scheduled_at, student_note: note,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success('Ders talebiniz gönderildi! Eğitmeninizin onayını bekleyin.')
      setSelectedDate(''); setSelectedTime(''); setSelectedAvail(null); setNote('')
    } catch (e: unknown) { toast.error(e instanceof Error ? e.message : 'Hata.') }
    finally { setBooking(false) }
  }

  return (
    <div className="space-y-5">
      {/* Paket özeti */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
        <div className="flex-1">
          <div className="font-bold text-[#1B2A4A]">{enrollment.package_name}</div>
          {(enrollment.trainers as { name: string } | null) && (
            <div className="text-sm text-gray-500">Eğitmen: {(enrollment.trainers as { name: string }).name}</div>
          )}
        </div>
        <div className="text-center">
          <div className="text-2xl font-extrabold text-[#FF6B35]">{enrollment.lessons_remaining}</div>
          <div className="text-xs text-gray-400">kalan ders</div>
        </div>
      </div>

      {/* Müsait zaman dilimleri */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <h3 className="font-bold text-[#1B2A4A] mb-4 flex items-center gap-2"><CalendarDays size={18} className="text-[#FF6B35]" /> Müsait Günler</h3>
        {filteredAvail.length === 0 ? (
          <p className="text-gray-400 text-sm">Eğitmeninizin müsait olduğu zaman bulunmuyor.</p>
        ) : (
          <div className="space-y-4">
            {filteredAvail.map(avail => {
              const trainer = avail.trainers as { id: string; name: string } | null
              const location = avail.locations as { id: string; name: string } | null
              const dates = getNextDates(avail.day_of_week)
              const timeSlots = getTimeSlots(avail.start_time.slice(0, 5), avail.end_time.slice(0, 5))
              return (
                <div key={avail.id} className="border border-gray-100 rounded-2xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="font-semibold text-sm text-[#1B2A4A]">{DAYS_TR[avail.day_of_week]}ları</span>
                    <span className="text-xs text-gray-400">{avail.start_time.slice(0,5)} – {avail.end_time.slice(0,5)}</span>
                    {trainer && <span className="text-xs bg-orange-50 text-orange-600 px-2 py-0.5 rounded-full">{trainer.name}</span>}
                    {location && <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">{location.name}</span>}
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
                    {dates.map(d => {
                      const ds = d.toISOString().split('T')[0]
                      return (
                        <button key={ds} onClick={() => { setSelectedDate(ds); setSelectedAvail(avail); setSelectedTime('') }}
                          className={`py-2 rounded-xl text-xs font-semibold transition-all border ${selectedDate === ds && selectedAvail?.id === avail.id ? 'bg-[#FF6B35] text-white border-[#FF6B35]' : 'border-gray-200 hover:border-orange-200'}`}>
                          {d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}
                        </button>
                      )
                    })}
                  </div>
                  {selectedDate && selectedAvail?.id === avail.id && (
                    <div>
                      <div className="flex items-center gap-2 mb-2 text-xs font-semibold text-gray-500"><Clock size={12} /> Saat Seç</div>
                      <div className="flex flex-wrap gap-2">
                        {timeSlots.map(t => (
                          <button key={t} onClick={() => setSelectedTime(t)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${selectedTime === t ? 'bg-[#FF6B35] text-white border-[#FF6B35]' : 'border-gray-200 hover:border-orange-200'}`}>
                            {t}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Not + Gönder */}
      {selectedDate && selectedTime && (
        <div className="bg-white rounded-2xl border border-orange-100 shadow-sm p-5 space-y-4">
          <h3 className="font-bold text-[#1B2A4A]">Seçilen Zaman: {new Date(`${selectedDate}T${selectedTime}`).toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' })} — {selectedTime}</h3>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Not (opsiyonel)</label>
            <textarea value={note} onChange={e => setNote(e.target.value)} rows={2}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#FF6B35] resize-none" />
          </div>
          <button onClick={book} disabled={booking}
            className="w-full flex items-center justify-center gap-2 py-3 bg-[#FF6B35] text-white rounded-xl font-bold hover:bg-orange-500 disabled:opacity-60">
            {booking ? <Loader2 size={16} className="animate-spin" /> : <CalendarDays size={16} />}
            {booking ? 'Gönderiliyor...' : 'Ders Talep Et'}
          </button>
          <p className="text-xs text-center text-gray-400">Talebiniz eğitmeninize iletilecek. Onayladıktan sonra ders kesinleşir.</p>
        </div>
      )}
    </div>
  )
}
