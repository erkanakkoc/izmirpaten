import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { Resend } from 'resend'

function getResend() {
  const key = process.env.RESEND_API_KEY
  return key ? new Resend(key) : null
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const {
      full_name,
      phone,
      email,
      age,
      is_for_self,
      student_name,
      student_age,
      package_id,
      package_name,
      location_id,
      location_name,
      available_days,
      available_hours,
      notes,
      video_consent,
    } = body

    if (!full_name || !phone) {
      return NextResponse.json({ error: 'Ad soyad ve telefon zorunludur.' }, { status: 400 })
    }
    if (!package_name) {
      return NextResponse.json({ error: 'Lütfen bir paket seçin.' }, { status: 400 })
    }
    if (!location_name) {
      return NextResponse.json({ error: 'Lütfen bir lokasyon seçin.' }, { status: 400 })
    }

    const supabase = await createServiceClient()

    const { data: application, error: insertError } = await supabase
      .from('applications')
      .insert({
        full_name,
        phone,
        email: email || null,
        age: age || null,
        is_for_self: is_for_self ?? true,
        student_name: student_name || null,
        student_age: student_age || null,
        package_id: package_id || null,
        package_name,
        location_id: location_id || null,
        location_name,
        available_days: available_days?.length ? available_days : null,
        available_hours: available_hours || null,
        notes: notes || null,
        video_consent: !!video_consent,
        status: 'new',
      })
      .select()
      .single()

    if (insertError) {
      console.error('Supabase insert error:', insertError)
      return NextResponse.json({ error: 'Başvuru kaydedilemedi.' }, { status: 500 })
    }

    const { data: templateSetting } = await supabase
      .from('site_settings')
      .select('value')
      .eq('key', 'admin_email_template')
      .single()

    const adminEmail = process.env.ADMIN_EMAIL
    const resend = getResend()
    if (adminEmail && resend) {
      const templateHtml = buildEmailHtml(templateSetting?.value, {
        full_name,
        phone,
        email: email || '—',
        age: age?.toString() || '—',
        package_name,
        location_name,
        available_days: available_days?.join(', ') || '—',
        available_hours: available_hours || '—',
        notes: notes || '—',
        video_consent: video_consent ? 'Evet ✅' : 'Hayır ❌',
        student_name: student_name || '—',
        student_age: student_age?.toString() || '—',
      })

      try {
        await resend.emails.send({
          from: 'Paten İzmir <noreply@patenizmir.com>',
          to: adminEmail,
          subject: `🛼 Yeni Başvuru: ${full_name} – ${package_name}`,
          html: templateHtml,
        })

        await supabase.from('mail_logs').insert({
          application_id: application.id,
          applicant_name: full_name,
          applicant_email: email || null,
          subject: `Yeni Başvuru: ${full_name} – ${package_name}`,
          status: 'sent',
        })
      } catch (mailError) {
        console.error('Resend error:', mailError)
        // Mail hatası başvuruyu engellemez
      }
    }

    return NextResponse.json({ success: true, id: application.id })
  } catch (err) {
    console.error('Apply API error:', err)
    return NextResponse.json({ error: 'Sunucu hatası.' }, { status: 500 })
  }
}

function buildEmailHtml(template: string | null | undefined, vars: Record<string, string>): string {
  const defaultTemplate = `
<div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #eee">
  <div style="background:linear-gradient(135deg,#1B2A4A,#FF6B35);padding:32px;text-align:center">
    <h1 style="color:#fff;margin:0;font-size:24px">🛼 Yeni Başvuru Geldi!</h1>
  </div>
  <div style="padding:32px">
    <table style="width:100%;border-collapse:collapse">
      <tr><td style="padding:8px 0;border-bottom:1px solid #f0f0f0;color:#888;width:140px">Ad Soyad</td><td style="padding:8px 0;border-bottom:1px solid #f0f0f0;font-weight:bold">{{full_name}}</td></tr>
      <tr><td style="padding:8px 0;border-bottom:1px solid #f0f0f0;color:#888">Telefon</td><td style="padding:8px 0;border-bottom:1px solid #f0f0f0;font-weight:bold">{{phone}}</td></tr>
      <tr><td style="padding:8px 0;border-bottom:1px solid #f0f0f0;color:#888">E-posta</td><td style="padding:8px 0;border-bottom:1px solid #f0f0f0">{{email}}</td></tr>
      <tr><td style="padding:8px 0;border-bottom:1px solid #f0f0f0;color:#888">Yaş</td><td style="padding:8px 0;border-bottom:1px solid #f0f0f0">{{age}}</td></tr>
      <tr><td style="padding:8px 0;border-bottom:1px solid #f0f0f0;color:#888">Öğrenci</td><td style="padding:8px 0;border-bottom:1px solid #f0f0f0">{{student_name}} ({{student_age}})</td></tr>
      <tr><td style="padding:8px 0;border-bottom:1px solid #f0f0f0;color:#888">Paket</td><td style="padding:8px 0;border-bottom:1px solid #f0f0f0;color:#FF6B35;font-weight:bold">{{package_name}}</td></tr>
      <tr><td style="padding:8px 0;border-bottom:1px solid #f0f0f0;color:#888">Lokasyon</td><td style="padding:8px 0;border-bottom:1px solid #f0f0f0">{{location_name}}</td></tr>
      <tr><td style="padding:8px 0;border-bottom:1px solid #f0f0f0;color:#888">Müsait Günler</td><td style="padding:8px 0;border-bottom:1px solid #f0f0f0">{{available_days}}</td></tr>
      <tr><td style="padding:8px 0;border-bottom:1px solid #f0f0f0;color:#888">Müsait Saatler</td><td style="padding:8px 0;border-bottom:1px solid #f0f0f0">{{available_hours}}</td></tr>
      <tr><td style="padding:8px 0;border-bottom:1px solid #f0f0f0;color:#888">Notlar</td><td style="padding:8px 0;border-bottom:1px solid #f0f0f0">{{notes}}</td></tr>
      <tr><td style="padding:8px 0;color:#888">Video İzni</td><td style="padding:8px 0">{{video_consent}}</td></tr>
    </table>
  </div>
  <div style="padding:16px 32px;background:#f9f9f9;text-align:center;color:#aaa;font-size:12px">
    patenizmir.com üzerinden gönderildi
  </div>
</div>`

  const html = template || defaultTemplate
  return Object.entries(vars).reduce(
    (acc, [key, value]) => acc.replaceAll(`{{${key}}}`, value),
    html
  )
}
