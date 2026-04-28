'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { LayoutDashboard, CalendarPlus, Package, LogOut, Zap, ChevronRight, Menu, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/student', label: 'Derslerim', icon: LayoutDashboard, exact: true },
  { href: '/student/book', label: 'Ders Al', icon: CalendarPlus },
  { href: '/student/package', label: 'Paketim', icon: Package },
]

function NavContent({ studentName, onClose }: { studentName: string; onClose?: () => void }) {
  const pathname = usePathname()
  const router = useRouter()

  const handleLogout = async () => {
    await createClient().auth.signOut()
    toast.success('Çıkış yapıldı.')
    router.push('/student/login')
  }

  return (
    <div className="w-64 bg-gradient-to-b from-[#1B2A4A] to-[#2d4a8a] text-white flex flex-col h-full">
      <div className="px-6 py-4 border-b border-white/10 flex flex-col items-center gap-1.5 relative">
        {onClose && (
          <button onClick={onClose} className="absolute right-3 top-3 p-1.5 rounded-lg hover:bg-white/10 text-white/60 md:hidden">
            <X size={18} />
          </button>
        )}
        <span className="flex items-center justify-center w-9 h-9 rounded-xl bg-[#FF6B35]"><Zap size={20} /></span>
        <div className="text-center">
          <div className="font-extrabold text-sm">{studentName}</div>
          <div className="text-xs text-blue-300">Öğrenci Paneli</div>
        </div>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(item => {
          const active = item.exact ? pathname === item.href : pathname.startsWith(item.href)
          return (
            <Link key={item.href} href={item.href} onClick={onClose}
              className={cn('flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all',
                active ? 'bg-[#FF6B35] text-white' : 'text-blue-200 hover:bg-white/10 hover:text-white')}>
              <item.icon size={18} /><span className="flex-1">{item.label}</span>
              {active && <ChevronRight size={14} />}
            </Link>
          )
        })}
      </nav>
      <div className="px-3 py-4 border-t border-white/10">
        <button onClick={handleLogout}
          className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-semibold text-blue-200 hover:bg-red-500/20 hover:text-red-300">
          <LogOut size={18} />Çıkış Yap
        </button>
      </div>
    </div>
  )
}

export default function StudentSidebar({ studentName }: { studentName: string }) {
  const [mobileOpen, setMobileOpen] = useState(false)
  return (
    <>
      <aside className="hidden md:flex flex-shrink-0 h-screen sticky top-0">
        <NavContent studentName={studentName} />
      </aside>
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-[#1B2A4A] text-white flex items-center gap-3 px-4 h-14 border-b border-white/10">
        <button onClick={() => setMobileOpen(true)} className="p-2 rounded-lg hover:bg-white/10"><Menu size={22} /></button>
        <span className="font-extrabold text-sm">{studentName}</span>
      </div>
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMobileOpen(false)} />
          <div className="relative z-10 h-full">
            <NavContent studentName={studentName} onClose={() => setMobileOpen(false)} />
          </div>
        </div>
      )}
    </>
  )
}
