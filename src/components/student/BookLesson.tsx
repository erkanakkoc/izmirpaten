'use client'

import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import { ChevronLeft, ChevronRight, CalendarDays, Loader2 } from 'lucide-react'
import type { Enrollment } from '@/types'
import { createClient } from '@/lib/supabase/client'

const MONTHS_TR = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık']
const DAYS_SHORT = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt']

interface Slot { id: string; slot_date: string; slot_hour: number; is_booked: boolean }

interface Props {
  studentId: string
  enrollment: (Enrollment & { trainers?: { id: string; name: string } | null }) | null
}

function toDateStr(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function getDaysInMonth(year: number, month: number): Date[] {
  const days: Date[] = []
  const d = new Date(year, month, 1)
  while (d.getMonth() === month) { days.push(new Date(d)); d.setDate(d.getDate() + 1) }
  return days
}

export default function BookLesson({ studentId, enrollment }: Props) {
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())
  const [slots, setSlots] = useState<Slot[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null)
  const [note, setNote] = useState('')
  const [booking, setBooking] = useState(false)
  const [booked, setBooked] = useState(false)

  const trainerId = enrollment?.trainer_id

  const fetchSlots = useCallback(async () => {
    if (!trainerId) return
    setLoading(true)
    const supabase = createClient()
    const from = `${year}-${String(month + 1).padStart(2, '0')}-01`
    const lastDay = new Date(year, month + 1, 0).getDate()
    const to = `${year}-${String(month + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`
    const { data } = await supabase
      .from('trainer_slots')
      .select('id, slot_date, slot_hour, is_booked')
      .eq('trainer_id', trainerId)
      .gte('slot_date', from)
      .lte('slot_date', to)
      .gte('slot_date', toDateStr(today)) // Geçmiş tarihleri gösterme
    setSlots(data ?? [])
    setLoading(false)
  }, [trainerId, year, month])

  useEffect(() => { fetchSlots() }, [fetchSlots])

  const prevMonth = () => { if (month === 0) { setMonth(11); setYear(y => y - 1) } else setMonth(m => m - 1); setSelectedDate(null); setSelectedSlot(null) }
  const nextMonth = () => { if (month === 11) { setMonth(0); setYear(y => y + 1) } else setMonth(m => m + 1); setSelectedDate(null); setSelectedSlot(null) }

  const book = async () => {
    if (!selectedSlot || !enrollment) return
    setBooking(true)
    try {
      const scheduled_at = new Date(`${selectedSlot.slot_date}T${String(selectedSlot.slot_hour).padStart(2, '0')}:00:00`).toISOString()
      const res = await fetch('/api/student/book-lesson', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          enrollment_id: enrollment.id,
          trainer_id: enrollment.trainer_id,
          slot_id: selectedSlot.id,
          scheduled_at,
          student_note: note,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setBooked(true)
      setSlots(p => p.map(s => s.id === selectedSlot.id ? { ...s, is_booked: true } : s))
      toast.success('Ders talebiniz gönderildi! Eğitmeninizin onayını bekleyin.')
    } catch (e: unknown) { toast.error(e instanceof Error ? e.message : 'Hata.') }
    finally { setBooking(false) }
  }

  if (!enrollment) {
    return <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center text-gray-400">Aktif paketiniz yok. Lütfen önce bir paket satın alın.</div>
  }
  if (!trainerId) {
    return <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center text-gray-400">Henüz bir eğitmen atanmamış. Lütfen yönetici ile iletişime geçin.</div>
  }
  if (enrollment.lessons_remaining <= 0) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-8 text-center">
        <p className="text-amber-700 font-semibold">Ders hakkınız kalmamış.</p>
        <a href="/student/package" className="text-[#FF6B35] text-sm font-semibold mt-2 inline-block">Paket yenile →</a>
      </div>
    )
  }

  const days = getDaysInMonth(year, month)
  const firstDayOfWeek = days[0].getDay()
  const todayStr = toDateStr(today)

  const availableOnDay = (dateStr: string) => slots.filter(s => s.slot_date === dateStr && !s.is_booked).length
  const daySlots = selectedDate ? slots.filter(s => s.slot_date === selectedDate) : []
  const trainerName = (enrollment.trainers as { name: string } | null)?.name ?? 'Eğitmen'

  return (
    <div className="space-y-5">
      {/* Paket özeti */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
        <div className="flex-1">
          <div className="font-bold text-[#1B2A4A]">{enrollment.package_name}</div>
          <div className="text-sm text-gray-500">Eğitmen: {trainerName}</div>
        </div>
        <div className="text-center">
          <div className={`text-2xl font-extrabold ${enrollment.lessons_remaining <= 1 ? 'text-red-500' : 'text-[#FF6B35]'}`}>
            {enrollment.lessons_remaining}
          </div>
          <div className="text-xs text-gray-400">kalan ders</div>
        </div>
      </div>

      {booked && (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-5 text-center">
          <div className="text-3xl mb-2">🎉</div>
          <p className="font-bold text-green-800">Ders talebiniz gönderildi!</p>
          <p className="text-sm text-green-600 mt-1">Eğitmeniniz onayladığında bildirim alacaksınız.</p>
          <button onClick={() => { setBooked(false); setSelectedSlot(null); setSelectedDate(null); fetchSlots() }}
            className="mt-3 text-sm text-[#FF6B35] font-semibold hover:underline">
            Başka ders al →
          </button>
        </div>
      )}

      {!booked && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {/* Takvim başlığı */}
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <button onClick={prevMonth} className="p-2 rounded-xl hover:bg-gray-100"><ChevronLeft size={18} /></button>
            <div className="font-extrabold text-[#1B2A4A]">{MONTHS_TR[month]} {year}</div>
            <button onClick={nextMonth} className="p-2 rounded-xl hover:bg-gray-100"><ChevronRight size={18} /></button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-10"><Loader2 size={24} className="animate-spin text-[#FF6B35]" /></div>
          ) : (
            <div className="p-4">
              {/* Gün başlıkları */}
              <div className="grid grid-cols-7 mb-2">
                {DAYS_SHORT.map(d => <div key={d} className="text-center text-xs font-bold text-gray-400 py-1">{d}</div>)}
              </div>
              {/* Takvim */}
              <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: firstDayOfWeek }, (_, i) => <div key={`e-${i}`} />)}
                {days.map(day => {
                  const dateStr = toDateStr(day)
                  const avail = availableOnDay(dateStr)
                  const isPast = dateStr < todayStr
                  const isSelected = selectedDate === dateStr
                  const isToday = dateStr === todayStr

                  return (
                    <button key={dateStr}
                      onClick={() => { if (!isPast && avail > 0) { setSelectedDate(isSelected ? null : dateStr); setSelectedSlot(null) } }}
                      disabled={isPast || avail === 0}
                      className={`
                        aspect-square flex flex-col items-center justify-center rounded-xl text-sm transition-all
                        ${isPast || avail === 0 ? 'opacity-30 cursor-not-allowed' : 'hover:bg-orange-50 cursor-pointer'}
                        ${isSelected ? 'bg-[#FF6B35] text-white' : ''}
                        ${isToday && !isSelected ? 'ring-2 ring-[#FF6B35]' : ''}
                      `}
                    >
                      <span className="font-semibold">{day.getDate()}</span>
                      {avail > 0 && (
                        <span className={`text-xs font-bold ${isSelected ? 'text-white/80' : 'text-green-500'}`}>{avail}</span>
                      )}
                    </button>
                  )
                })}
              </div>
              <div className="mt-3 text-xs text-gray-400 text-center">Yeşil sayı = o günkü müsait saat sayısı</div>
            </div>
          )}
        </div>
      )}

      {/* Saat seçimi */}
      {selectedDate && !booked && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <div className="font-bold text-[#1B2A4A]">
              {new Date(selectedDate + 'T12:00:00').toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' })}
            </div>
            <div className="text-xs text-gray-400 mt-0.5">Ders almak istediğin saati seç</div>
          </div>
          <div className="p-5">
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
              {daySlots.map(slot => {
                const isSelected = selectedSlot?.id === slot.id
                return (
                  <button key={slot.id}
                    onClick={() => !slot.is_booked && setSelectedSlot(isSelected ? null : slot)}
                    disabled={slot.is_booked}
                    className={`
                      py-3 rounded-xl text-sm font-bold transition-all border-2
                      ${slot.is_booked
                        ? 'bg-gray-50 border-gray-200 text-gray-300 cursor-not-allowed'
                        : isSelected
                          ? 'bg-[#FF6B35] border-[#FF6B35] text-white'
                          : 'bg-green-50 border-green-200 text-green-700 hover:border-green-400'
                      }
                    `}
                  >
                    {String(slot.slot_hour).padStart(2, '0')}:00
                    {slot.is_booked && <span className="block text-xs font-normal">dolu</span>}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* Onay bölümü */}
      {selectedSlot && !booked && (
        <div className="bg-orange-50 border border-orange-100 rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-2">
            <CalendarDays size={18} className="text-[#FF6B35]" />
            <span className="font-bold text-[#1B2A4A]">
              {new Date(selectedSlot.slot_date + 'T12:00:00').toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' })} — {String(selectedSlot.slot_hour).padStart(2, '0')}:00
            </span>
          </div>
          <p className="text-xs text-gray-500">
            Eğitmen: <strong>{trainerName}</strong> • Süre: 40 dakika
          </p>
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
          <p className="text-xs text-center text-gray-400">Talebiniz eğitmeninize iletilecek. Onaylandığında ders kesinleşir.</p>
        </div>
      )}
    </div>
  )
}
