import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Sidebar from '@/components/admin/Sidebar'
import UnauthorizedPage from '@/components/admin/UnauthorizedPage'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/admin/login')
  }

  // allowed_emails kontrolü
  const { data: allowed } = await supabase
    .from('allowed_emails')
    .select('email')
    .eq('email', user.email)
    .single()

  if (!allowed) {
    // Redirect yerine hata sayfası göster — redirect döngüsünü önler
    return <UnauthorizedPage email={user.email ?? ''} />
  }

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}
