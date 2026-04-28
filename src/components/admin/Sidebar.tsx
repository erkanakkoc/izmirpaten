'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { LayoutDashboard, ClipboardList, Mail, Settings, LogOut, Zap, ChevronRight, Menu, X, Star, Users, GraduationCap, CreditCard } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

const ALL_NAV_ITEMS = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true, restrictedHide: true },
  { href: '/admin/applications', label: 'Başvurular', icon: ClipboardList, exact: false, restrictedHide: false },
  { href: '/admin/trainers', label: 'Eğitmenler', icon: GraduationCap, exact: false, restrictedHide: true },
  { href: '/admin/students', label: 'Öğrenciler', icon: Users, exact: false, restrictedHide: true },
  { href: '/admin/payments', label: 'Ödemeler', icon: CreditCard, exact: false, restrictedHide: true },
  { href: '/admin/reviews', label: 'Yorumlar', icon: Star, exact: false, restrictedHide: true },
  { href: '/admin/mail', label: 'Mail', icon: Mail, exact: false, restrictedHide: true },
  { href: '/admin/content', label: 'İçerik', icon: Settings, exact: false, restrictedHide: true },
]

interface SidebarProps {
  logoUrl?: string
  siteTitle?: string
  logoHeight?: number
  locationFilter?: string | null
}

function SidebarContent({ logoUrl, siteTitle, logoHeight, locationFilter, onClose }: SidebarProps & { onClose?: () => void }) {
  const navItems = locationFilter
    ? ALL_NAV_ITEMS.filter(item => !item.restrictedHide)
    : ALL_NAV_ITEMS
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
    <div className="w-64 bg-[#1B2A4A] text-white flex flex-col h-full">
      {/* Logo */}
      <div className="px-6 py-4 border-b border-white/10 flex flex-col items-center gap-1.5 relative">
        {onClose && (
          <button onClick={onClose} className="absolute right-3 top-3 p-1.5 rounded-lg hover:bg-white/10 text-white/60 md:hidden">
            <X size={18} />
          </button>
        )}
        {logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={logoUrl} alt={siteTitle ?? 'Logo'} style={{ height: `${logoHeight ?? 36}px` }} className="w-auto object-contain" />
        ) : (
          <span className="flex items-center justify-center w-9 h-9 rounded-xl bg-[#FF6B35]">
            <Zap size={20} />
          </span>
        )}
        <div className="text-center">
          <div className="font-extrabold text-sm leading-tight">{siteTitle ?? 'Paten İzmir'}</div>
          <div className="text-xs text-blue-300">Admin Paneli</div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const active = isActive(item.href, item.exact)
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all',
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

      {/* Lokasyon kısıtı rozeti */}
      {locationFilter && (
        <div className="px-4 pb-2">
          <div className="bg-amber-500/20 border border-amber-500/30 text-amber-200 text-xs font-semibold px-3 py-2 rounded-xl text-center">
            📍 {locationFilter} Görünümü
          </div>
        </div>
      )}

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
    </div>
  )
}

export default function Sidebar({ logoUrl, siteTitle, logoHeight, locationFilter }: SidebarProps) {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-shrink-0 h-screen sticky top-0">
        <SidebarContent logoUrl={logoUrl} siteTitle={siteTitle} logoHeight={logoHeight} locationFilter={locationFilter} />
      </aside>

      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-[#1B2A4A] text-white flex items-center gap-3 px-4 h-14 border-b border-white/10">
        <button onClick={() => setMobileOpen(true)} className="p-2 rounded-lg hover:bg-white/10">
          <Menu size={22} />
        </button>
        {logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={logoUrl} alt={siteTitle ?? 'Logo'} className="h-7 w-auto object-contain" />
        ) : (
          <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-[#FF6B35]">
            <Zap size={16} />
          </span>
        )}
        <span className="font-extrabold text-sm">{siteTitle ?? 'Paten İzmir'}</span>
      </div>

      {/* Mobile drawer overlay */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMobileOpen(false)} />
          <div className="relative z-10 h-full">
            <SidebarContent logoUrl={logoUrl} siteTitle={siteTitle} logoHeight={logoHeight} locationFilter={locationFilter} onClose={() => setMobileOpen(false)} />
          </div>
        </div>
      )}
    </>
  )
}
