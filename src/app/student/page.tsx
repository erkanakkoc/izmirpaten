import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { formatDate } from '@/lib/utils'

export const revalidate = 0

export default async function StudentDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/student/login')

  const { data: student } = await supabase.from('students').select('id, full_name').eq('user_id', user.id).single()
  if (!student) redirect('/student/login?error=notfound')

  const [enrollmentRes, lessonsRes, notifRes] = await Promise.all([
    supabase.from('enrollments').select('*, trainers(name)').eq('student_id', student.id).eq('is_active', true).single(),
    supabase.from('lessons').select('*, trainers(name), locations(name)').eq('student_id', student.id).order('scheduled_at', { ascending: false }).limit(10),
    supabase.from('notifications').select('*').eq('target_role', 'student').eq('target_user_id', student.id).eq('is_read', false).order('created_at', { ascending: false }).limit(5),
  ])

  const enrollment = enrollmentRes.data
  const lessons = lessonsRes.data ?? []
  const notifications = notifRes.data ?? []

  // Bildirimleri okundu işaretle
  if (notifications.length > 0) {
    await supabase.from('notifications').update({ is_read: true }).eq('target_user_id', student.id).eq('is_read', false)
  }

  const statusInfo = (s: string) => ({
    pending: { label: 'Onay Bekliyor', cls: 'bg-amber-100 text-amber-700' },
    approved: { label: 'Onaylandı', cls: 'bg-blue-100 text-blue-700' },
    completed: { label: 'Tamamlandı', cls: 'bg-green-100 text-green-700' },
    cancelled: { label: 'İptal', cls: 'bg-red-100 text-red-700' },
  }[s] ?? { label: s, cls: 'bg-gray-100 text-gray-600' })

  return (
    <div className="p-6 md:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-[#1B2A4A]">Merhaba, {student.full_name}!</h1>
      </div>

      {/* Bildirimler */}
      {notifications.length > 0 && (
        <div className="mb-6 bg-orange-50 border border-orange-200 rounded-2xl overflow-hidden">
          <div className="px-5 py-3 font-bold text-[#FF6B35] text-sm">🔔 Yeni Bildirimler</div>
          <div className="divide-y divide-orange-100">
            {notifications.map(n => (
              <div key={n.id} className="px-5 py-3">
                <div className="font-semibold text-sm text-[#1B2A4A]">{n.title}</div>
                {n.message && <div className="text-xs text-gray-600 mt-0.5">{n.message}</div>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Paket durumu */}
      {enrollment ? (
        <div className="mb-6 bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <h2 className="font-bold text-[#1B2A4A]">{enrollment.package_name}</h2>
              {(enrollment.trainers as { name: string } | null) && (
                <p className="text-sm text-gray-500">Eğitmen: {(enrollment.trainers as { name: string }).name}</p>
              )}
            </div>
            <div className="text-right">
              <div className={`text-3xl font-extrabold ${enrollment.lessons_remaining <= 1 ? 'text-red-500' : 'text-[#FF6B35]'}`}>
                {enrollment.lessons_remaining}
              </div>
              <div className="text-xs text-gray-400">/ {enrollment.total_lessons} ders</div>
            </div>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2">
            <div className={`h-2 rounded-full transition-all ${enrollment.lessons_remaining <= 1 ? 'bg-red-400' : 'bg-[#FF6B35]'}`}
              style={{ width: `${(enrollment.lessons_remaining / enrollment.total_lessons) * 100}%` }} />
          </div>
          {enrollment.lessons_remaining <= 1 && (
            <div className="mt-4 p-3 bg-red-50 border border-red-100 rounded-xl">
              <p className="text-sm text-red-700 font-semibold">⚠️ Son {enrollment.lessons_remaining} ders hakkınız kaldı!</p>
              <a href="/student/package" className="text-xs text-red-600 underline mt-1 inline-block">Paketi yenile →</a>
            </div>
          )}
        </div>
      ) : (
        <div className="mb-6 bg-gray-50 border border-gray-200 rounded-2xl p-6 text-center text-gray-400 text-sm">
          Aktif paket bulunamadı. Eğitmeninizle iletişime geçin.
        </div>
      )}

      {/* Dersler */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-bold text-[#1B2A4A]">Derslerim</h2>
          <a href="/student/book" className="text-sm text-[#FF6B35] font-semibold hover:underline">+ Ders Al</a>
        </div>
        <div className="divide-y divide-gray-50">
          {lessons.map(l => {
            const { label, cls } = statusInfo(l.status)
            return (
              <div key={l.id} className="px-6 py-4 flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm text-[#1B2A4A]">
                    {new Date(l.scheduled_at).toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' })}
                  </div>
                  <div className="text-xs text-gray-500">
                    {new Date(l.scheduled_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                    {' '} • {(l.trainers as { name: string } | null)?.name ?? 'Eğitmen'}
                    {(l.locations as { name: string } | null) && ` • ${(l.locations as { name: string }).name}`}
                  </div>
                </div>
                <span className={`text-xs px-2.5 py-1 rounded-full font-semibold flex-shrink-0 ${cls}`}>{label}</span>
              </div>
            )
          })}
          {lessons.length === 0 && (
            <div className="px-6 py-8 text-center text-gray-400 text-sm">Henüz ders yok. <a href="/student/book" className="text-[#FF6B35] font-semibold">Ders al →</a></div>
          )}
        </div>
      </div>
    </div>
  )
}
