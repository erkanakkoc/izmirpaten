import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { formatDate } from '@/lib/utils'

export const revalidate = 0

export default async function TrainerDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/trainer/login')

  const { data: trainer } = await supabase.from('trainers').select('id, name').eq('user_id', user.id).single()
  if (!trainer) redirect('/trainer/login')

  const [lessonsRes, studentsRes, notifRes] = await Promise.all([
    supabase.from('lessons').select('*, students(full_name), locations(name)').eq('trainer_id', trainer.id).in('status', ['pending', 'approved']).order('scheduled_at'),
    supabase.from('enrollments').select('*, students(full_name, email)').eq('trainer_id', trainer.id).eq('is_active', true),
    supabase.from('notifications').select('*').eq('target_role', 'trainer').eq('target_user_id', user.id).eq('is_read', false).order('created_at', { ascending: false }).limit(10),
  ])

  const pending = (lessonsRes.data ?? []).filter(l => l.status === 'pending')
  const upcoming = (lessonsRes.data ?? []).filter(l => l.status === 'approved')

  return (
    <div className="p-6 md:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-[#1B2A4A]">Merhaba, {trainer.name}!</h1>
        <p className="text-gray-500 text-sm mt-1">Bugünkü ders durumun</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Bekleyen Talep', value: pending.length, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'Yaklaşan Ders', value: upcoming.length, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Aktif Öğrenci', value: studentsRes.data?.length ?? 0, color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'Bildirim', value: notifRes.data?.length ?? 0, color: 'text-[#FF6B35]', bg: 'bg-orange-50' },
        ].map(s => (
          <div key={s.label} className={`${s.bg} rounded-2xl p-5`}>
            <div className={`text-3xl font-extrabold ${s.color}`}>{s.value}</div>
            <div className="text-sm text-gray-600 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Bildirimler */}
      {(notifRes.data?.length ?? 0) > 0 && (
        <div className="mb-8 bg-white rounded-2xl border border-orange-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 font-bold text-[#1B2A4A]">🔔 Bildirimler</div>
          <div className="divide-y divide-gray-50">
            {notifRes.data?.map(n => (
              <div key={n.id} className="px-6 py-3 flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-[#FF6B35] mt-2 flex-shrink-0" />
                <div>
                  <div className="text-sm font-semibold text-[#1B2A4A]">{n.title}</div>
                  {n.message && <div className="text-xs text-gray-500">{n.message}</div>}
                  <div className="text-xs text-gray-400 mt-0.5">{formatDate(n.created_at)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bekleyen talepler */}
      {pending.length > 0 && (
        <div className="mb-6 bg-white rounded-2xl border border-amber-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 font-bold text-[#1B2A4A]">⏳ Onay Bekleyen Dersler ({pending.length})</div>
          <div className="divide-y divide-gray-50">
            {pending.map(l => (
              <div key={l.id} className="px-6 py-4 flex items-center justify-between gap-4">
                <div>
                  <div className="font-semibold text-sm text-[#1B2A4A]">{(l.students as { full_name: string } | null)?.full_name}</div>
                  <div className="text-xs text-gray-500">
                    {new Date(l.scheduled_at).toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' })} {new Date(l.scheduled_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                    {' '} • {(l.locations as { name: string } | null)?.name ?? ''}
                  </div>
                </div>
                <a href="/trainer/lessons" className="text-xs px-3 py-1.5 bg-[#FF6B35] text-white rounded-xl font-semibold">İncele</a>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Yaklaşan dersler */}
      {upcoming.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 font-bold text-[#1B2A4A]">📅 Onaylanan Dersler</div>
          <div className="divide-y divide-gray-50">
            {upcoming.map(l => (
              <div key={l.id} className="px-6 py-4 flex items-center justify-between gap-4">
                <div>
                  <div className="font-semibold text-sm text-[#1B2A4A]">{(l.students as { full_name: string } | null)?.full_name}</div>
                  <div className="text-xs text-gray-500">
                    {new Date(l.scheduled_at).toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' })} {new Date(l.scheduled_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
                <span className="text-xs px-2.5 py-1 rounded-full bg-blue-100 text-blue-700 font-semibold">Onaylandı</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
