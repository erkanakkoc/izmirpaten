'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Plus, Trash2 } from 'lucide-react'
import type { TrainerAvailability, Location } from '@/types'
import { createClient } from '@/lib/supabase/client'
import { DAYS_TR } from '@/types'

interface Props {
  trainerId: string
  availability: TrainerAvailability[]
  locations: Location[]
}

export default function AvailabilityManager({ trainerId, availability: init, locations }: Props) {
  const [slots, setSlots] = useState<TrainerAvailability[]>(init)
  const [form, setForm] = useState({ day_of_week: '1', start_time: '09:00', end_time: '21:00', location_id: '' })
  const [adding, setAdding] = useState(false)

  const add = async () => {
    setAdding(true)
    const supabase = createClient()
    const { data, error } = await supabase.from('trainer_availability').insert({
      trainer_id: trainerId,
      day_of_week: parseInt(form.day_of_week),
      start_time: form.start_time,
      end_time: form.end_time,
      location_id: form.location_id || null,
      is_active: true,
    }).select().single()
    if (error) { toast.error(error.message); setAdding(false); return }
    setSlots(p => [...p, data])
    toast.success('Müsaitlik eklendi.')
    setAdding(false)
  }

  const remove = async (id: string) => {
    const supabase = createClient()
    await supabase.from('trainer_availability').delete().eq('id', id)
    setSlots(p => p.filter(s => s.id !== id))
    toast.success('Silindi.')
  }

  const toggle = async (slot: TrainerAvailability) => {
    const supabase = createClient()
    await supabase.from('trainer_availability').update({ is_active: !slot.is_active }).eq('id', slot.id)
    setSlots(p => p.map(s => s.id === slot.id ? { ...s, is_active: !slot.is_active } : s))
  }

  const grouped = DAYS_TR.map((day, i) => ({
    day, dayIndex: i,
    slots: slots.filter(s => s.day_of_week === i),
  }))

  const CLS = 'px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#FF6B35] bg-white'

  return (
    <div className="space-y-4">
      {/* Yeni ekle */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <h3 className="font-bold text-[#1B2A4A] mb-4">Müsaitlik Ekle</h3>
        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Gün</label>
            <select value={form.day_of_week} onChange={e => setForm(p => ({ ...p, day_of_week: e.target.value }))} className={CLS}>
              {DAYS_TR.map((d, i) => <option key={i} value={i}>{d}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Başlangıç</label>
            <input type="time" value={form.start_time} onChange={e => setForm(p => ({ ...p, start_time: e.target.value }))} className={CLS} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Bitiş</label>
            <input type="time" value={form.end_time} onChange={e => setForm(p => ({ ...p, end_time: e.target.value }))} className={CLS} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Lokasyon</label>
            <select value={form.location_id} onChange={e => setForm(p => ({ ...p, location_id: e.target.value }))} className={CLS}>
              <option value="">Tümü</option>
              {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
            </select>
          </div>
          <button onClick={add} disabled={adding}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#FF6B35] text-white rounded-xl text-sm font-bold hover:bg-orange-500 disabled:opacity-60">
            <Plus size={15} /> Ekle
          </button>
        </div>
      </div>

      {/* Haftalık görünüm */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {grouped.map(({ day, dayIndex, slots: daySlots }) => (
          <div key={dayIndex} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className={`px-4 py-3 font-bold text-sm ${daySlots.length > 0 ? 'bg-[#FF6B35]/10 text-[#FF6B35]' : 'bg-gray-50 text-gray-400'}`}>
              {day}
              {daySlots.length > 0 && <span className="ml-2 text-xs bg-[#FF6B35] text-white px-1.5 py-0.5 rounded-full">{daySlots.length}</span>}
            </div>
            <div className="divide-y divide-gray-50">
              {daySlots.map(slot => {
                const loc = locations.find(l => l.id === slot.location_id)
                return (
                  <div key={slot.id} className={`px-4 py-3 flex items-center gap-2 ${!slot.is_active ? 'opacity-50' : ''}`}>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-[#1B2A4A]">{slot.start_time.slice(0,5)} – {slot.end_time.slice(0,5)}</div>
                      {loc && <div className="text-xs text-gray-400">{loc.name}</div>}
                    </div>
                    <button onClick={() => toggle(slot)} className={`text-xs px-2 py-0.5 rounded-full font-semibold ${slot.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {slot.is_active ? 'Aktif' : 'Pasif'}
                    </button>
                    <button onClick={() => remove(slot.id)} className="p-1.5 hover:bg-red-50 text-red-400 rounded-lg">
                      <Trash2 size={14} />
                    </button>
                  </div>
                )
              })}
              {daySlots.length === 0 && (
                <div className="px-4 py-3 text-xs text-gray-400">Müsaitlik yok</div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
