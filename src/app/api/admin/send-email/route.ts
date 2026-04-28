import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { Resend } from 'resend'

function getResend() {
  const key = process.env.RESEND_API_KEY
  return key ? new Resend(key) : null
}

export async function POST(request: NextRequest) {
  // Auth kontrolü
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Yetkisiz.' }, { status: 401 })

  const { to, subject, body, application_id, applicant_name } = await request.json()
  if (!to || !subject || !body) {
    return NextResponse.json({ error: 'Alıcı, konu ve içerik zorunludur.' }, { status: 400 })
  }

  const resend = getResend()
  if (!resend) return NextResponse.json({ error: 'Mail servisi yapılandırılmamış.' }, { status: 500 })

  try {
    const fromName = process.env.MAIL_FROM_NAME || 'Paten İzmir'
    const fromEmail = process.env.MAIL_FROM_ADDRESS || 'noreply@patenizmir.com'

    await resend.emails.send({
      from: `${fromName} <${fromEmail}>`,
      to,
      subject,
      html: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto">${body.replace(/\n/g, '<br/>')}</div>`,
      replyTo: process.env.ADMIN_EMAIL,
    })

    // Gönderileni logla
    const service = await createServiceClient()
    await service.from('mail_logs').insert({
      application_id: application_id || null,
      applicant_name: applicant_name || to,
      applicant_email: to,
      subject,
      status: 'sent_by_admin',
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Send email error:', err)
    return NextResponse.json({ error: 'Mail gönderilemedi.' }, { status: 500 })
  }
}
