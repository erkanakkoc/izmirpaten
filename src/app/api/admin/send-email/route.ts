import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { sendMail } from '@/lib/mail'

export async function POST(request: NextRequest) {
  // Auth kontrolü
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Yetkisiz.' }, { status: 401 })

  const { to, subject, body, application_id, applicant_name } = await request.json()
  if (!to || !subject || !body) {
    return NextResponse.json({ error: 'Alıcı, konu ve içerik zorunludur.' }, { status: 400 })
  }

  const service = await createServiceClient()

  const result = await sendMail({
    to,
    subject,
    html: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto">${body.replace(/\n/g, '<br/>')}</div>`,
    text: body,
  })

  // "Gönderildi" yalnızca SMTP gerçekten kabul ettikten sonra loglanır/gösterilir
  await service.from('mail_logs').insert({
    application_id: application_id || null,
    applicant_name: applicant_name || to,
    applicant_email: to,
    subject,
    status: result.success ? 'sent_by_admin' : 'failed',
    error_text: result.success ? null : result.error,
  })

  if (!result.success) {
    return NextResponse.json({ error: result.error ?? 'Mail gönderilemedi.' }, { status: 502 })
  }

  return NextResponse.json({ success: true })
}
