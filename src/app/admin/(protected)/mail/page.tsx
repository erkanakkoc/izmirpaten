import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getAdminPermissions } from '@/lib/admin-auth'
import MailClient from '@/components/admin/MailClient'

export const revalidate = 0

export default async function MailPage() {
  const { locationFilter } = await getAdminPermissions()
  if (locationFilter) redirect('/admin/applications')

  const supabase = await createClient()

  const [mailsRes, templateRes] = await Promise.all([
    supabase
      .from('mail_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100),
    supabase
      .from('site_settings')
      .select('value')
      .eq('key', 'admin_email_template')
      .single(),
  ])

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-[#1B2A4A]">Mail Yönetimi</h1>
        <p className="text-gray-500 text-sm mt-1">Bildirim geçmişi ve mail şablonu.</p>
      </div>
      <MailClient
        mails={mailsRes.data ?? []}
        template={templateRes.data?.value ?? ''}
      />
    </div>
  )
}
