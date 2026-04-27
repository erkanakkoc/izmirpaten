'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { LayoutDashboard, ClipboardList, Mail, Settings, LogOut, Zap, ChevronRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/admin/applications', label: 'Başvurular', icon: ClipboardList },
  { href: '/admin/mail', label: 'Mail Yönetimi', icon: Mail },
  { href: '/admin/content', label: 'İçerik', icon: Settings },
]

export default function Sidebar({ logoUrl, siteTitle, logoHeight }: { logoUrl?: string; siteTitle?: string; logoHeight?: number }) {
  const pathname = usePathname()
  const router = useRouter()

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname.startsWith(href)

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    toast.success('Çıkış yapıldı.')
    router.push('/admin/login')
  }

  return (
    <aside className="w-64 flex-shrink-0 bg-[#1B2A4A] text-white flex flex-col h-screen sticky top-0">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-white/10">
        <div className="flex items-center gap-3">
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoUrl} alt={siteTitle ?? 'Logo'} style={{ height: `${logoHeight ?? 36}px` }} className="w-auto object-contain" />
          ) : (
            <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-[#FF6B35] flex-shrink-0">
              <Zap size={18} />
            </span>
          )}
          <div>
            <div className="font-extrabold text-sm">{siteTitle ?? 'Paten İzmir'}</div>
            <div className="text-xs text-blue-300">Admin Paneli</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const active = isActive(item.href, item.exact)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all group',
                active
                  ? 'bg-[#FF6B35] text-white shadow-lg shadow-orange-900/30'
                  : 'text-blue-200 hover:bg-white/10 hover:text-white'
              )}
            >
              <item.icon size={18} />
              <span className="flex-1">{item.label}</span>
              {active && <ChevronRight size={14} />}
            </Link>
          )
        })}
      </nav>

      {/* Logout */}
      <div className="px-3 py-4 border-t border-white/10">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-semibold text-blue-200 hover:bg-red-500/20 hover:text-red-300 transition-all"
        >
          <LogOut size={18} />
          Çıkış Yap
        </button>
      </div>
    </aside>
  )
}
