'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Plus, Loader2, ToggleLeft, ToggleRight, User } from 'lucide-react'
import type { Trainer, Location } from '@/types'
import { createClient } from '@/lib/supabase/client'

interface Props {
  trainers: Trainer[]
  locations: Location[]
}

export default function TrainersManager({ trainers: init, locations }: Props) {
  const [trainers, setTrainers] = useState<Trainer[]>(init)
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', phone: '', bio: '' })
  const [loading, setLoading] = useState(false)

  const invite = async () => {
    if (!form.name || !form.email) { toast.error('Ad ve e-posta zorunlu.'); return }
    setLoading(true)
    try {
      const res = await fetch('/api/admin/invite-trainer', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setTrainers(p => [data.trainer, ...p])
      setForm({ name: '', email: '', phone: '', bio: '' })
      setShowAdd(false)
      toast.success('Eğitmen eklendi, davet maili gönderildi.')
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Hata oluştu.')
    } finally { setLoading(false) }
  }

  const toggleActive = async (t: Trainer) => {
    const supabase = createClient()
    await supabase.from('trainers').update({ is_active: !t.is_active }).eq('id', t.id)
    setTrainers(p => p.map(x => x.id === t.id ? { ...x, is_active: !t.is_active } : x))
  }

  const CLS = 'w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#FF6B35]'

  return (
    <div>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <span className="font-bold text-[#1B2A4A]">{trainers.length} Eğitmen</span>
          <button onClick={() => setShowAdd(!showAdd)}
            className="flex items-center gap-2 px-4 py-2 bg-[#FF6B35] text-white rounded-xl text-sm font-bold hover:bg-orange-500">
            <Plus size={15} /> Eğitmen Ekle
          </button>
        </div>

        {showAdd && (
          <div className="p-6 bg-orange-50 border-b border-orange-100 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div><label className="block text-xs font-semibold text-gray-600 mb-1">Ad Soyad *</label>
                <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} className={CLS} placeholder="Ahmet Yılmaz" /></div>
              <div><label className="block text-xs font-semibold text-gray-600 mb-1">E-posta *</label>
                <input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} className={CLS} placeholder="egitmen@mail.com" /></div>
              <div><label className="block text-xs font-semibold text-gray-600 mb-1">Telefon</label>
                <input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} className={CLS} placeholder="05XX..." /></div>
            </div>
            <div><label className="block text-xs font-semibold text-gray-600 mb-1">Bio</label>
              <textarea rows={2} value={form.bio} onChange={e => setForm(p => ({ ...p, bio: e.target.value }))} className={`w-full ${CLS} resize-none`} /></div>
            <div className="flex gap-2">
              <button onClick={invite} disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-[#FF6B35] text-white rounded-xl text-sm font-bold disabled:opacity-60">
                {loading ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                Davet Gönder
              </button>
              <button onClick={() => setShowAdd(false)} className="px-4 py-2 border border-gray-200 rounded-xl text-sm">İptal</button>
            </div>
            <p className="text-xs text-gray-400">Eğitmene hesap oluşturma bağlantısı içeren bir e-posta gönderilecek.</p>
          </div>
        )}

        <div className="divide-y divide-gray-50">
          {trainers.map(t => (
            <div key={t.id} className="px-6 py-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-[#FF6B35]/10 flex items-center justify-center flex-shrink-0">
                <User size={18} className="text-[#FF6B35]" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm text-[#1B2A4A]">{t.name}</div>
                <div className="text-xs text-gray-400">{t.email}{t.phone ? ` • ${t.phone}` : ''}</div>
                {t.bio && <div className="text-xs text-gray-500 mt-0.5 truncate">{t.bio}</div>}
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className={`text-xs px-2 py-1 rounded-full font-semibold ${t.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                  {t.is_active ? 'Aktif' : 'Pasif'}
                </span>
                <button onClick={() => toggleActive(t)}>
                  {t.is_active ? <ToggleRight size={22} className="text-green-500" /> : <ToggleLeft size={22} className="text-gray-300" />}
                </button>
              </div>
            </div>
          ))}
          {trainers.length === 0 && (
            <div className="px-6 py-10 text-center text-gray-400 text-sm">Henüz eğitmen eklenmemiş.</div>
          )}
        </div>
      </div>
    </div>
  )
}
