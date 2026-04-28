'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

const HOURS = Array.from({ length: 15 }, (_, i) => i + 8) // 08:00 – 22:00
const DAYS_SHORT = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt']
const MONTHS_TR = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık']

interface Slot { id: string; slot_date: string; slot_hour: number; is_booked: boolean }

function toDateStr(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function getDaysInMonth(year: number, month: number): Date[] {
  const days: Date[] = []
  const d = new Date(year, month, 1)
  while (d.getMonth() === month) { days.push(new Date(d)); d.setDate(d.getDate() + 1) }
  return days
}

interface Props { trainerId: string }

export default function AvailabilityManager({ trainerId }: Props) {
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [slots, setSlots] = useState<Slot[]>([])
  const [loading, setLoading] = useState(false)
  const [toggling, setToggling] = useState<string | null>(null)

  const fetchSlots = useCallback(async () => {
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
    setSlots(data ?? [])
    setLoading(false)
  }, [trainerId, year, month])

  useEffect(() => { fetchSlots() }, [fetchSlots])

  const toggleSlot = async (date: string, hour: number) => {
    const key = `${date}-${hour}`
    setToggling(key)
    const supabase = createClient()
    const existing = slots.find(s => s.slot_date === date && s.slot_hour === hour)

    if (existing) {
      if (existing.is_booked) { toast.error('Bu saat rezerve edilmiş, silinemez.'); setToggling(null); return }
      const { error } = await supabase.from('trainer_slots').delete().eq('id', existing.id)
      if (error) { toast.error('Silinemedi.'); setToggling(null); return }
      setSlots(p => p.filter(s => s.id !== existing.id))
    } else {
      const { data, error } = await supabase.from('trainer_slots').insert({
        trainer_id: trainerId, slot_date: date, slot_hour: hour, is_booked: false,
      }).select().single()
      if (error) { toast.error('Eklenemedi.'); setToggling(null); return }
      setSlots(p => [...p, data])
    }
    setToggling(null)
  }

  // Günü tüm saatlerle doldur ya da tamamen boşalt
  const fillDay = async (date: string) => {
    const supabase = createClient()
    const daySlots = slots.filter(s => s.slot_date === date && !s.is_booked)
    if (daySlots.length === HOURS.length) {
      // Hepsini sil
      await supabase.from('trainer_slots').delete().eq('trainer_id', trainerId).eq('slot_date', date).eq('is_booked', false)
      setSlots(p => p.filter(s => s.slot_date !== date || s.is_booked))
      toast.success('Gün temizlendi.')
    } else {
      // Eksik saatleri ekle
      const existingHours = new Set(slots.filter(s => s.slot_date === date).map(s => s.slot_hour))
      const missing = HOURS.filter(h => !existingHours.has(h))
      if (missing.length === 0) return
      const { data, error } = await supabase.from('trainer_slots').insert(
        missing.map(h => ({ trainer_id: trainerId, slot_date: date, slot_hour: h, is_booked: false }))
      ).select()
      if (error) { toast.error('Eklenemedi.'); return }
      setSlots(p => [...p, ...(data ?? [])])
      toast.success('Tüm saatler eklendi.')
    }
  }

  const prevMonth = () => { if (month === 0) { setMonth(11); setYear(y => y - 1) } else setMonth(m => m - 1); setSelectedDate(null) }
  const nextMonth = () => { if (month === 11) { setMonth(0); setYear(y => y + 1) } else setMonth(m => m + 1); setSelectedDate(null) }

  const days = getDaysInMonth(year, month)
  const firstDayOfWeek = days[0].getDay() // 0=Sun
  const todayStr = toDateStr(today)

  const slotCountForDay = (date: string) => slots.filter(s => s.slot_date === date).length
  const bookedCountForDay = (date: string) => slots.filter(s => s.slot_date === date && s.is_booked).length

  const selectedSlots = selectedDate ? slots.filter(s => s.slot_date === selectedDate) : []

  return (
    <div className="space-y-5">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Takvim başlığı */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <button onClick={prevMonth} className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
            <ChevronLeft size={18} />
          </button>
          <div className="font-extrabold text-[#1B2A4A] text-lg">
            {MONTHS_TR[month]} {year}
          </div>
          <button onClick={nextMonth} className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
            <ChevronRight size={18} />
          </button>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 size={24} className="animate-spin text-[#FF6B35]" />
          </div>
        )}

        {!loading && (
          <div className="p-4">
            {/* Gün başlıkları */}
            <div className="grid grid-cols-7 mb-2">
              {DAYS_SHORT.map(d => (
                <div key={d} className="text-center text-xs font-bold text-gray-400 py-1">{d}</div>
              ))}
            </div>

            {/* Takvim grid */}
            <div className="grid grid-cols-7 gap-1">
              {/* Boş günler (ayın ilk gününden öncesi) */}
              {Array.from({ length: firstDayOfWeek }, (_, i) => (
                <div key={`empty-${i}`} />
              ))}
              {days.map(day => {
                const dateStr = toDateStr(day)
                const count = slotCountForDay(dateStr)
                const booked = bookedCountForDay(dateStr)
                const isPast = dateStr < todayStr
                const isSelected = selectedDate === dateStr
                const isToday = dateStr === todayStr

                return (
                  <button
                    key={dateStr}
                    onClick={() => !isPast && setSelectedDate(isSelected ? null : dateStr)}
                    disabled={isPast}
                    className={`
                      relative aspect-square flex flex-col items-center justify-center rounded-xl text-sm transition-all
                      ${isPast ? 'opacity-30 cursor-not-allowed' : 'hover:bg-orange-50 cursor-pointer'}
                      ${isSelected ? 'bg-[#FF6B35] text-white hover:bg-[#FF6B35]' : ''}
                      ${isToday && !isSelected ? 'ring-2 ring-[#FF6B35]' : ''}
                    `}
                  >
                    <span className="font-semibold text-sm">{day.getDate()}</span>
                    {count > 0 && (
                      <span className={`text-xs font-bold mt-0.5 ${isSelected ? 'text-white/80' : booked > 0 ? 'text-amber-500' : 'text-green-500'}`}>
                        {count - booked}/{count}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Seçili gün — saat seçimi */}
      {selectedDate && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <div>
              <div className="font-bold text-[#1B2A4A]">
                {new Date(selectedDate + 'T12:00:00').toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </div>
              <div className="text-xs text-gray-400 mt-0.5">
                {selectedSlots.filter(s => !s.is_booked).length} müsait • {selectedSlots.filter(s => s.is_booked).length} rezerve
              </div>
            </div>
            <button onClick={() => fillDay(selectedDate)}
              className="px-4 py-2 text-xs font-bold rounded-xl border border-gray-200 hover:bg-orange-50 hover:border-orange-200 hover:text-[#FF6B35] transition-all">
              {selectedSlots.filter(s => !s.is_booked).length === HOURS.length ? 'Tümünü Kaldır' : 'Tümünü Ekle'}
            </button>
          </div>

          <div className="p-5">
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
              {HOURS.map(hour => {
                const slot = selectedSlots.find(s => s.slot_hour === hour)
                const key = `${selectedDate}-${hour}`
                const isBooked = slot?.is_booked ?? false
                const isAvailable = !!slot && !isBooked
                const isLoading = toggling === key

                return (
                  <button
                    key={hour}
                    onClick={() => !isBooked && toggleSlot(selectedDate, hour)}
                    disabled={isBooked || isLoading}
                    className={`
                      relative py-3 rounded-xl text-sm font-bold transition-all border-2
                      ${isBooked
                        ? 'bg-red-50 border-red-200 text-red-500 cursor-not-allowed'
                        : isAvailable
                          ? 'bg-green-50 border-green-300 text-green-700 hover:bg-green-100'
                          : 'bg-gray-50 border-gray-200 text-gray-400 hover:bg-orange-50 hover:border-orange-200 hover:text-[#FF6B35]'
                      }
                    `}
                  >
                    {isLoading ? <Loader2 size={14} className="animate-spin mx-auto" /> : (
                      <>
                        <span>{String(hour).padStart(2, '0')}:00</span>
                        {isBooked && <span className="block text-xs font-normal">rezerve</span>}
                        {isAvailable && <span className="block text-xs font-normal">müsait ✓</span>}
                      </>
                    )}
                  </button>
                )
              })}
            </div>

            <div className="mt-4 flex flex-wrap gap-3 text-xs text-gray-400">
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-green-100 border border-green-300 inline-block" /> Müsait</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-gray-100 border border-gray-200 inline-block" /> Müsait değil</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-red-100 border border-red-200 inline-block" /> Rezerve (değiştirilemez)</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
