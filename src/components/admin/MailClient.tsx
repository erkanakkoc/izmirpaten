'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { formatDate } from '@/lib/utils'
import { Mail, Save, RefreshCw } from 'lucide-react'
import type { MailLog } from '@/types'

interface Props {
  mails: MailLog[]
  template: string
}

export default function MailClient({ mails, template: initialTemplate }: Props) {
  const [template, setTemplate] = useState(initialTemplate)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<'logs' | 'template'>('logs')

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
      {/* Tabs */}
      <div className="flex gap-2 mb-5 bg-white rounded-2xl border border-gray-100 p-1 w-fit shadow-sm">
        {(['logs', 'template'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-2 rounded-xl text-sm font-semibold transition-all ${
              activeTab === tab ? 'bg-[#FF6B35] text-white shadow' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab === 'logs' ? '📬 Bildirim Geçmişi' : '✏️ Mail Şablonu'}
          </button>
        ))}
      </div>

      {activeTab === 'logs' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <span className="text-sm font-semibold text-gray-500">{mails.length} bildirim</span>
          </div>
          <div className="divide-y divide-gray-50">
            {mails.map((m) => (
              <div key={m.id} className="px-6 py-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-orange-50 flex items-center justify-center flex-shrink-0">
                    <Mail size={16} className="text-[#FF6B35]" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-semibold text-sm text-[#1B2A4A] truncate">{m.applicant_name}</div>
                    <div className="text-xs text-gray-400 truncate">{m.subject}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  {m.applicant_email && (
                    <a
                      href={`mailto:${m.applicant_email}?subject=Paten İzmir – Başvurunuz Hakkında&body=Merhaba ${m.applicant_name},`}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 text-purple-600 rounded-xl text-xs font-semibold hover:bg-purple-100 transition-all"
                    >
                      <RefreshCw size={12} /> Yanıtla
                    </a>
                  )}
                  <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                    m.status === 'sent' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {m.status === 'sent' ? 'Gönderildi' : 'Hata'}
                  </span>
                  <span className="text-xs text-gray-400 whitespace-nowrap">{formatDate(m.created_at)}</span>
                </div>
              </div>
            ))}
            {mails.length === 0 && (
              <div className="px-6 py-10 text-center text-gray-400 text-sm">Henüz bildirim gönderilmedi.</div>
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
          <textarea
            value={template}
            onChange={(e) => setTemplate(e.target.value)}
            rows={20}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-[#FF6B35] font-mono text-sm resize-none"
            placeholder="HTML şablonu buraya girin..."
          />
          <div className="mt-4 flex justify-end">
            <button
              onClick={saveTemplate}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-3 bg-[#FF6B35] text-white rounded-xl font-bold hover:bg-orange-500 transition-all disabled:opacity-60"
            >
              <Save size={16} />
              {saving ? 'Kaydediliyor...' : 'Şablonu Kaydet'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
