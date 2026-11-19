import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { sendMail, brandedEmailHtml } from '@/lib/mail'

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
    const { data: linkData, error: linkErr } = await service.auth.admin.generateLink({
      type: 'recovery', email, options: { redirectTo: redirect_to ?? `${siteUrl}/student/reset-password` },
    })
    if (linkErr || !linkData?.properties?.action_link) {
      return NextResponse.json({ error: linkErr?.message ?? 'Bağlantı oluşturulamadı.' }, { status: 400 })
    }
    const actionLink = linkData.properties.action_link
    const result = await sendMail({
      to: email,
      subject: '🛼 Paten İzmir — Şifre Sıfırlama',
      html: brandedEmailHtml('Şifre Sıfırlama', `
        <p>Merhaba,</p>
        <p>Şifreni sıfırlamak için aşağıdaki bağlantıya tıkla:</p>
        <p style="text-align:center;margin:28px 0">
          <a href="${actionLink}" style="background:#FF6B35;color:#fff;padding:14px 28px;border-radius:10px;text-decoration:none;font-weight:bold">Şifremi Sıfırla</a>
        </p>
        <p style="color:#888;font-size:13px">Bağlantı çalışmazsa şu adresi tarayıcına yapıştır:<br/>${actionLink}</p>`),
    })
    if (!result.success) {
      return NextResponse.json({ error: result.error ?? 'Mail gönderilemedi.', invite_link: actionLink }, { status: 502 })
    }
    return NextResponse.json({ success: true })
  }

  return NextResponse.json({ error: 'Geçersiz işlem.' }, { status: 400 })
}
