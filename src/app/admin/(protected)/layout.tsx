import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Sidebar from '@/components/admin/Sidebar'
import UnauthorizedPage from '@/components/admin/UnauthorizedPage'

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/admin/login')
  }

  const [{ data: allowed }, { data: settingsData }] = await Promise.all([
    supabase.from('allowed_emails').select('email').eq('email', user.email).single(),
    supabase.from('site_settings').select('key, value').in('key', ['site_title', 'logo_url', 'logo_height']),
  ])

  if (!allowed) {
    return <UnauthorizedPage email={user.email ?? ''} />
  }

  const settings = Object.fromEntries((settingsData ?? []).map((s) => [s.key, s.value]))

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar
        logoUrl={settings.logo_url ?? undefined}
        siteTitle={settings.site_title ?? undefined}
        logoHeight={settings.logo_height ? parseInt(settings.logo_height) : undefined}
      />
      {/* pt-14 = mobil top bar yüksekliği */}
      <main className="flex-1 overflow-y-auto pt-14 md:pt-0">
        {children}
      </main>
    </div>
  )
}
