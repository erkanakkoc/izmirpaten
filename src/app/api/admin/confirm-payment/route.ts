import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Yetkisiz.' }, { status: 401 })

  const { payment_id, action, admin_note, trainer_id } = await req.json()
  if (!payment_id || !action) return NextResponse.json({ error: 'Eksik parametre.' }, { status: 400 })

  const service = await createServiceClient()

  const { data: payment } = await service.from('payment_requests').select('*').eq('id', payment_id).single()
  if (!payment) return NextResponse.json({ error: 'Ödeme talebi bulunamadı.' }, { status: 404 })

  if (action === 'confirm') {
    // Ödemeyi onayla
    await service.from('payment_requests').update({
      status: 'confirmed', admin_note: admin_note || null, confirmed_at: new Date().toISOString(),
    }).eq('id', payment_id)

    // Yeni enrollment oluştur
    const { data: pkg } = await service.from('packages').select('*').eq('id', payment.package_id).single()
    const totalLessons = pkg ? Math.round(pkg.price / 1200) * 2 : 4 // heuristic

    // Mevcut aktif enrollment'u pasifleştir
    await service.from('enrollments').update({ is_active: false }).eq('student_id', payment.student_id).eq('is_active', true)

    await service.from('enrollments').insert({
      student_id: payment.student_id, trainer_id: trainer_id || null,
      package_id: payment.package_id, package_name: payment.package_name,
      total_lessons: totalLessons, lessons_remaining: totalLessons, is_active: true,
    })

    // Öğrenciye bildirim
    await service.from('notifications').insert({
      type: 'payment_confirmed', target_role: 'student',
      target_user_id: payment.student_id,
      title: 'Ödemeniz onaylandı!',
      message: `${payment.package_name} paketi hesabınıza tanımlandı.`,
      link: '/student/package',
    })
  } else {
    await service.from('payment_requests').update({
      status: 'rejected', admin_note: admin_note || null,
    }).eq('id', payment_id)

    await service.from('notifications').insert({
      type: 'payment_rejected', target_role: 'student',
      target_user_id: payment.student_id,
      title: 'Ödeme talebi reddedildi',
      message: admin_note || 'Ödemeniz onaylanamadı. Lütfen iletişime geçin.',
      link: '/student/package',
    })
  }

  return NextResponse.json({ success: true })
}
