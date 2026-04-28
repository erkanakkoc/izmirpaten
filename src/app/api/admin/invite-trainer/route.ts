import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Yetkisiz.' }, { status: 401 })

  const { name, email, phone, bio } = await req.json()
  if (!name || !email) return NextResponse.json({ error: 'Ad ve e-posta zorunlu.' }, { status: 400 })

  const service = await createServiceClient()

  // Supabase Auth davet
  const { data: authData, error: authErr } = await service.auth.admin.inviteUserByEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/trainer`,
  })
  if (authErr) return NextResponse.json({ error: authErr.message }, { status: 400 })

  // Trainers tablosuna ekle
  const { data, error } = await service.from('trainers').insert({
    user_id: authData.user.id,
    name, email, phone: phone || null, bio: bio || null, is_active: true,
  }).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  return NextResponse.json({ success: true, trainer: data })
}
