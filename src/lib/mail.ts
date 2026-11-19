import nodemailer, { type Transporter } from 'nodemailer'

interface SendMailParams {
  to: string
  subject: string
  html: string
  text?: string
  replyTo?: string
}

export interface SendMailResult {
  success: boolean
  error?: string
}

let transporter: Transporter | null = null
let transporterConfigured = false

function getTransporter(): Transporter | null {
  if (transporterConfigured) return transporter
  transporterConfigured = true

  const { SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_USER, SMTP_PASS } = process.env
  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS) {
    transporter = null
    return null
  }

  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: parseInt(SMTP_PORT, 10),
    secure: SMTP_SECURE === 'true', // 465 -> true, 587/25 -> false (STARTTLS)
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  })
  return transporter
}

/**
 * Tüm giden mailler bu fonksiyondan geçmeli. Supabase'in kendi mail
 * gönderimine (inviteUserByEmail/resetPasswordForEmail'in gönderdiği mail)
 * ve Resend'e bağımlı kalmamak için tek SMTP taşıyıcısı (Güzel Hosting).
 * Hata yutulmaz — çağıran taraf `success: false` durumunda kullanıcıya
 * gerçek hatayı göstermeli.
 */
export async function sendMail({ to, subject, html, text, replyTo }: SendMailParams): Promise<SendMailResult> {
  const t = getTransporter()
  if (!t) {
    const msg = 'Mail servisi yapılandırılmamış (SMTP_HOST/SMTP_PORT/SMTP_USER/SMTP_PASS env değişkenlerini kontrol edin).'
    console.error('sendMail:', msg)
    return { success: false, error: msg }
  }

  const from = process.env.MAIL_FROM || 'Paten İzmir <info@patenizmir.com>'

  try {
    await t.sendMail({
      from,
      to,
      subject,
      html,
      text,
      replyTo: replyTo || process.env.ADMIN_EMAIL || undefined,
    })
    return { success: true }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Mail gönderilemedi.'
    console.error('sendMail error:', message)
    return { success: false, error: message }
  }
}

/** Ortak marka şablonu — başlık + serbest içerik. */
export function brandedEmailHtml(title: string, bodyHtml: string): string {
  return `
<div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #eee">
  <div style="background:linear-gradient(135deg,#1B2A4A,#FF6B35);padding:32px;text-align:center">
    <h1 style="color:#fff;margin:0;font-size:22px">${title}</h1>
  </div>
  <div style="padding:32px">
    ${bodyHtml}
  </div>
  <div style="padding:16px 32px;background:#f9f9f9;text-align:center;color:#aaa;font-size:12px">
    patenizmir.com üzerinden gönderildi
  </div>
</div>`
}
