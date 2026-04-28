import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Yetkisiz.' }, { status: 401 })

  const { package_id, package_name, amount, student_note } = await req.json()
  if (!package_name || !amount) return NextResponse.json({ error: 'Paket ve tutar zorunlu.' }, { status: 400 })

  const service = await createServiceClient()

  const { data: student } = await service.from('students').select('id').eq('user_id', user.id).single()
  if (!student) return NextResponse.json({ error: 'Öğrenci bulunamadı.' }, { status: 403 })

  const { data: pr, error } = await service.from('payment_requests').insert({
    student_id: student.id, package_id: package_id || null,
    package_name, amount, status: 'pending',
    student_note: student_note || null,
  }).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  // Admin bildirimi
  await service.from('notifications').insert({
    type: 'payment_pending', target_role: 'admin',
    title: 'Yeni ödeme talebi',
    message: `${package_name} paketi için ödeme yapıldı bildirimi geldi.`,
    link: '/admin/payments',
    data: { payment_id: pr.id },
  })

  return NextResponse.json({ success: true })
}
