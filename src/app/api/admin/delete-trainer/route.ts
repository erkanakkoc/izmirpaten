import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Yetkisiz.' }, { status: 401 })

  const { trainer_id } = await req.json()
  if (!trainer_id) return NextResponse.json({ error: 'trainer_id zorunlu.' }, { status: 400 })

  const service = await createServiceClient()

  // Eğitmeni bul
  const { data: trainer } = await service.from('trainers').select('user_id, name').eq('id', trainer_id).single()
  if (!trainer) return NextResponse.json({ error: 'Eğitmen bulunamadı.' }, { status: 404 })

  // Bağlı enrollment'ları null'a çek (trainer_id = null)
  await service.from('enrollments').update({ trainer_id: null }).eq('trainer_id', trainer_id)
  await service.from('lessons').update({ trainer_id: null }).eq('trainer_id', trainer_id).in('status', ['pending', 'approved'])
  await service.from('trainer_availability').delete().eq('trainer_id', trainer_id)

  // Trainer kaydını sil
  await service.from('trainers').delete().eq('id', trainer_id)

  // Supabase Auth kullanıcısını sil
  if (trainer.user_id) {
    await service.auth.admin.deleteUser(trainer.user_id)
  }

  return NextResponse.json({ success: true })
}
