import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { sendMail, brandedEmailHtml } from '@/lib/mail'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Yetkisiz.' }, { status: 401 })

  const { name, email, phone, bio } = await req.json()
  if (!name || !email) return NextResponse.json({ error: 'Ad ve e-posta zorunlu.' }, { status: 400 })

  const service = await createServiceClient()
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://patenizmir.com'

  let linkType: 'invite' | 'recovery' = 'invite'
  let { data: linkData, error: linkErr } = await service.auth.admin.generateLink({
    type: 'invite', email, options: { redirectTo: `${siteUrl}/trainer/login` },
  })
  if (linkErr) {
    linkType = 'recovery'
    const retry = await service.auth.admin.generateLink({
      type: 'recovery', email, options: { redirectTo: `${siteUrl}/trainer/login` },
    })
    linkData = retry.data
    linkErr = retry.error
  }
  if (linkErr || !linkData?.user) {
    console.error('generateLink error:', linkErr)
    return NextResponse.json({ error: `Hesap/bağlantı oluşturulamadı: ${linkErr?.message ?? 'bilinmeyen hata'}` }, { status: 400 })
  }

  const authUserId = linkData.user.id
  const actionLink = linkData.properties.action_link

  const mailResult = await sendMail({
    to: email,
    subject: linkType === 'invite' ? '🛼 Paten İzmir — Eğitmen Hesabın Hazır!' : '🛼 Paten İzmir — Şifre Belirleme',
    html: brandedEmailHtml(
      linkType === 'invite' ? 'Hoş Geldin! 🛼' : 'Şifre Belirleme',
      `<p>Merhaba ${name},</p>
       <p>${linkType === 'invite'
          ? 'Paten İzmir eğitmen hesabın oluşturuldu. Aşağıdaki bağlantıya tıklayarak şifreni belirleyip giriş yapabilirsin:'
          : 'Hesabın için bir şifre belirleme bağlantısı oluşturuldu. Aşağıdaki bağlantıya tıklayarak giriş yapabilirsin:'}</p>
       <p style="text-align:center;margin:28px 0">
         <a href="${actionLink}" style="background:#FF6B35;color:#fff;padding:14px 28px;border-radius:10px;text-decoration:none;font-weight:bold">Hesabımı Aç</a>
       </p>
       <p style="color:#888;font-size:13px">Bağlantı çalışmazsa şu adresi tarayıcına yapıştır:<br/>${actionLink}</p>`
    ),
  })

  // Trainers tablosuna ekle
  const { data, error } = await service.from('trainers').insert({
    user_id: authUserId,
    name, email, phone: phone || null, bio: bio || null, is_active: true,
  }).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  return NextResponse.json({
    success: true,
    trainer: data,
    mail_sent: mailResult.success,
    mail_error: mailResult.success ? null : mailResult.error,
    invite_link: actionLink,
  })
}
