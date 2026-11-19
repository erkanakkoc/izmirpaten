import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { sendMail, brandedEmailHtml } from '@/lib/mail'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Yetkisiz.' }, { status: 401 })

  const { application_id, full_name, email, phone, trainer_id, package_id, package_name, total_lessons } = await req.json()
  if (!email || !full_name) return NextResponse.json({ error: 'Ad ve e-posta zorunlu.' }, { status: 400 })

  const service = await createServiceClient()
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://patenizmir.com'

  // Önce davet (invite) linki üretmeyi dene — kullanıcı yoksa oluşturur.
  let linkType: 'invite' | 'recovery' = 'invite'
  let { data: linkData, error: linkErr } = await service.auth.admin.generateLink({
    type: 'invite', email, options: { redirectTo: `${siteUrl}/student/login` },
  })

  // Kullanıcı zaten kayıtlıysa (örn. daha önce başvuru sırasında e-posta ile
  // temas edilmiş), invite linki üretilemez — bunun yerine şifre belirleme
  // (recovery) linki üret.
  if (linkErr) {
    linkType = 'recovery'
    const retry = await service.auth.admin.generateLink({
      type: 'recovery', email, options: { redirectTo: `${siteUrl}/student/login` },
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

  // Markalı davet maili — kendi SMTP'mizden
  const mailResult = await sendMail({
    to: email,
    subject: linkType === 'invite' ? '🛼 Paten İzmir — Öğrenci Hesabın Hazır!' : '🛼 Paten İzmir — Şifre Belirleme',
    html: brandedEmailHtml(
      linkType === 'invite' ? 'Hoş Geldin! 🛼' : 'Şifre Belirleme',
      `<p>Merhaba ${full_name},</p>
       <p>${linkType === 'invite'
          ? 'Paten İzmir öğrenci hesabın oluşturuldu. Aşağıdaki bağlantıya tıklayarak şifreni belirleyip giriş yapabilirsin:'
          : 'Hesabın için bir şifre belirleme bağlantısı oluşturuldu. Aşağıdaki bağlantıya tıklayarak giriş yapabilirsin:'}</p>
       <p style="text-align:center;margin:28px 0">
         <a href="${actionLink}" style="background:#FF6B35;color:#fff;padding:14px 28px;border-radius:10px;text-decoration:none;font-weight:bold">Hesabımı Aç</a>
       </p>
       <p style="color:#888;font-size:13px">Bağlantı çalışmazsa şu adresi tarayıcına yapıştır:<br/>${actionLink}</p>`
    ),
  })

  // Students tablosuna ekle
  const { data: student, error: studentErr } = await service.from('students').upsert({
    user_id: authUserId, application_id: application_id || null,
    full_name, email, phone: phone || null,
  }, { onConflict: 'email' }).select().single()
  if (studentErr) return NextResponse.json({ error: studentErr.message }, { status: 400 })

  // Enrollment oluştur
  if (package_name && total_lessons) {
    let discipline_id: string | null = null
    if (package_id) {
      const { data: pkg } = await service.from('packages').select('discipline_id').eq('id', package_id).single()
      discipline_id = pkg?.discipline_id ?? null
    }
    if (!discipline_id) {
      return NextResponse.json({ error: 'Paketin branşı belirlenemedi.' }, { status: 400 })
    }
    await service.from('enrollments').insert({
      student_id: student.id, trainer_id: trainer_id || null,
      package_id: package_id || null, package_name,
      total_lessons, lessons_remaining: total_lessons, is_active: true,
      discipline_id,
    })
  }

  // Uygulamayı güncelle
  if (application_id) {
    await service.from('applications').update({ status: 'approved' }).eq('id', application_id)
  }

  // Admin bildirimi
  await service.from('notifications').insert({
    type: 'student_created', target_role: 'admin',
    title: 'Öğrenci hesabı oluşturuldu',
    message: `${full_name} için öğrenci hesabı ve kayıt oluşturuldu.`,
    link: '/admin/students',
  })

  return NextResponse.json({
    success: true,
    student,
    mail_sent: mailResult.success,
    mail_error: mailResult.success ? null : mailResult.error,
    // Mail gitmese bile admin bağlantıyı elle iletebilsin
    invite_link: actionLink,
  })
}
