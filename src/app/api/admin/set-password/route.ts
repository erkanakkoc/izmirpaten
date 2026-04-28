import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Yetkisiz.' }, { status: 401 })

  const { action, user_id, password, email, redirect_to } = await req.json()
  const service = await createServiceClient()

  if (action === 'set_password') {
    if (!user_id || !password) return NextResponse.json({ error: 'user_id ve şifre zorunlu.' }, { status: 400 })
    if (password.length < 6) return NextResponse.json({ error: 'Şifre en az 6 karakter olmalı.' }, { status: 400 })

    // email_confirm: true → invited durumundaki kullanıcıyı onaylar,
    // böylece şifre ile giriş yapabilirler
    const { error } = await service.auth.admin.updateUserById(user_id, {
      password,
      email_confirm: true,
    })
    if (error) {
      console.error('set-password error:', error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    return NextResponse.json({ success: true })
  }

  if (action === 'send_reset') {
    if (!email) return NextResponse.json({ error: 'E-posta zorunlu.' }, { status: 400 })
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://patenizmir.com'
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirect_to ?? `${siteUrl}/student/reset-password`,
    })
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json({ success: true })
  }

  return NextResponse.json({ error: 'Geçersiz işlem.' }, { status: 400 })
}
