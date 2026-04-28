'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { formatDate } from '@/lib/utils'
import { Mail, Save, Send, Plus, X, Loader2 } from 'lucide-react'
import type { MailLog } from '@/types'

interface Props {
  mails: MailLog[]
  template: string
}

function statusLabel(status: string) {
  if (status === 'sent') return { label: 'Bildirim', cls: 'bg-blue-100 text-blue-700' }
  if (status === 'sent_by_admin') return { label: 'Gönderildi', cls: 'bg-green-100 text-green-700' }
  return { label: 'Hata', cls: 'bg-red-100 text-red-700' }
}

interface ComposeForm {
  to: string
  subject: string
  body: string
  applicant_name: string
}

function ComposeModal({ onClose, onSent }: { onClose: () => void; onSent: (log: MailLog) => void }) {
  const [form, setForm] = useState<ComposeForm>({ to: '', subject: 'Paten İzmir – Başvurunuz Hakkında', body: 'Merhaba,\n\n', applicant_name: '' })
  const [sending, setSending] = useState(false)

  const set = (k: keyof ComposeForm, v: string) => setForm(p => ({ ...p, [k]: v }))

  const send = async () => {
    if (!form.to || !form.subject || !form.body) { toast.error('Alıcı, konu ve içerik zorunludur.'); return }
    setSending(true)
    try {
      const res = await fetch('/api/admin/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success('Mail gönderildi!')
      onSent({
        id: Date.now().toString(),
        created_at: new Date().toISOString(),
        application_id: null,
        applicant_name: form.applicant_name || form.to,
        applicant_email: form.to,
        subject: form.subject,
        status: 'sent_by_admin',
      })
      onClose()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Mail gönderilemedi.')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="font-bold text-[#1B2A4A]">Yeni Mail Gönder</h3>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100 text-gray-400"><X size={20} /></button>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Alıcı E-posta *</label>
              <input type="email" value={form.to} onChange={(e) => set('to', e.target.value)}
                placeholder="ornek@mail.com"
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#FF6B35]" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Alıcı Adı</label>
              <input type="text" value={form.applicant_name} onChange={(e) => set('applicant_name', e.target.value)}
                placeholder="Ad Soyad (opsiyonel)"
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#FF6B35]" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Konu *</label>
            <input type="text" value={form.subject} onChange={(e) => set('subject', e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#FF6B35]" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Mesaj *</label>
            <textarea value={form.body} onChange={(e) => set('body', e.target.value)}
              rows={10} placeholder="Mesajınızı buraya yazın..."
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#FF6B35] resize-none" />
          </div>
          <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 text-xs text-amber-700">
            💡 Cevaplar <strong>{process.env.NEXT_PUBLIC_ADMIN_EMAIL_HINT ?? 'admin e-posta adresinize'}</strong> gelir. Gelen cevapları bu panelde görmek için e-posta sağlayıcınızda webhook kurulumu gerekir.
          </div>
        </div>
        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
          <button onClick={onClose} className="px-5 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold hover:bg-gray-50">İptal</button>
          <button onClick={send} disabled={sending}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#FF6B35] text-white rounded-xl text-sm font-bold hover:bg-orange-500 disabled:opacity-60">
            {sending ? <><Loader2 size={15} className="animate-spin" /> Gönderiliyor...</> : <><Send size={15} /> Gönder</>}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function MailClient({ mails: initialMails, template: initialTemplate }: Props) {
  const [mails, setMails] = useState<MailLog[]>(initialMails)
  const [template, setTemplate] = useState(initialTemplate)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<'logs' | 'compose' | 'template'>('logs')
  const [showCompose, setShowCompose] = useState(false)

  const saveTemplate = async () => {
    setSaving(true)
    const supabase = createClient()
    const { error } = await supabase
      .from('site_settings')
      .upsert({ key: 'admin_email_template', value: template, updated_at: new Date().toISOString() })
    if (error) { toast.error('Şablon kaydedilemedi.'); setSaving(false); return }
    toast.success('Mail şablonu kaydedildi.')
    setSaving(false)
  }

  return (
    <div>
      {/* Tabs + Compose button */}
      <div className="flex flex-wrap items-center gap-2 mb-5">
        <div className="flex gap-1 bg-white rounded-2xl border border-gray-100 p-1 shadow-sm">
          {(['logs', 'template'] as const).map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                activeTab === tab ? 'bg-[#FF6B35] text-white shadow' : 'text-gray-500 hover:text-gray-700'
              }`}>
              {tab === 'logs' ? '📬 Mail Geçmişi' : '✏️ Mail Şablonu'}
            </button>
          ))}
        </div>
        <button onClick={() => setShowCompose(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#1B2A4A] text-white rounded-xl text-sm font-bold hover:bg-[#2d4a8a] transition-all">
          <Plus size={15} /> Yeni Mail Gönder
        </button>
      </div>

      {activeTab === 'logs' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <span className="text-sm font-semibold text-gray-500">{mails.length} kayıt</span>
            <span className="text-xs text-gray-400">{mails.filter(m => m.status === 'sent_by_admin').length} gönderilmiş • {mails.filter(m => m.status === 'sent').length} bildirim</span>
          </div>
          <div className="divide-y divide-gray-50">
            {mails.map((m) => {
              const { label, cls } = statusLabel(m.status)
              const isSentByAdmin = m.status === 'sent_by_admin'
              return (
                <div key={m.id} className={`px-6 py-4 flex items-center justify-between gap-4 ${isSentByAdmin ? 'bg-green-50/30' : ''}`}>
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${isSentByAdmin ? 'bg-green-50' : 'bg-orange-50'}`}>
                      {isSentByAdmin
                        ? <Send size={15} className="text-green-600" />
                        : <Mail size={15} className="text-[#FF6B35]" />}
                    </div>
                    <div className="min-w-0">
                      <div className="font-semibold text-sm text-[#1B2A4A] truncate">
                        {isSentByAdmin ? `→ ${m.applicant_name}` : m.applicant_name}
                      </div>
                      <div className="text-xs text-gray-400 truncate">{m.subject}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    {m.applicant_email && !isSentByAdmin && (
                      <button
                        onClick={() => {
                          setShowCompose(true)
                          // Pre-fill compose with reply data — handled via state lifting if needed
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1B2A4A] text-white rounded-xl text-xs font-semibold hover:bg-[#2d4a8a] transition-all"
                      >
                        <Send size={12} /> Yanıtla
                      </button>
                    )}
                    <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${cls}`}>{label}</span>
                    <span className="text-xs text-gray-400 whitespace-nowrap hidden sm:block">{formatDate(m.created_at)}</span>
                  </div>
                </div>
              )
            })}
            {mails.length === 0 && (
              <div className="px-6 py-10 text-center text-gray-400 text-sm">Henüz mail kaydı yok.</div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'template' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="mb-4">
            <h3 className="font-bold text-[#1B2A4A] mb-1">Admin Bildirim Mail Şablonu</h3>
            <p className="text-sm text-gray-500">
              HTML şablonu düzenle. Değişkenler:{' '}
              {['full_name', 'phone', 'email', 'package_name', 'location_name', 'available_days', 'notes', 'video_consent'].map((v) => (
                <code key={v} className="bg-orange-50 text-orange-600 px-1.5 py-0.5 rounded text-xs mr-1">{`{{${v}}}`}</code>
              ))}
            </p>
          </div>
          <textarea value={template} onChange={(e) => setTemplate(e.target.value)} rows={20}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-[#FF6B35] font-mono text-sm resize-none"
            placeholder="HTML şablonu buraya girin..." />
          <div className="mt-4 flex justify-end">
            <button onClick={saveTemplate} disabled={saving}
              className="flex items-center gap-2 px-6 py-3 bg-[#FF6B35] text-white rounded-xl font-bold hover:bg-orange-500 disabled:opacity-60">
              <Save size={16} />{saving ? 'Kaydediliyor...' : 'Şablonu Kaydet'}
            </button>
          </div>
        </div>
      )}

      {showCompose && (
        <ComposeModal
          onClose={() => setShowCompose(false)}
          onSent={(log) => {
            setMails(p => [log, ...p])
            setShowCompose(false)
          }}
        />
      )}
    </div>
  )
}
