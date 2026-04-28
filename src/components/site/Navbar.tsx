'use client'

import { useState, useEffect, useRef } from 'react'
import { Menu, X, Zap, User } from 'lucide-react'
import { cn } from '@/lib/utils'

type LogoDisplayMode = 'logo_only' | 'logo_and_title' | 'title_only'

interface NavbarProps {
  siteTitle?: string
  logoUrl?: string
  logoDisplayMode?: LogoDisplayMode
  logoHeight?: number
}

const navLinks = [
  { href: '#hakkinda', label: 'Hakkında' },
  { href: '#paketler', label: 'Paketler' },
  { href: '#lokasyonlar', label: 'Lokasyonlar' },
  { href: '#basvur', label: 'Başvur' },
]

export default function Navbar({ siteTitle = 'Paten İzmir', logoUrl, logoDisplayMode = 'logo_and_title', logoHeight = 32 }: NavbarProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [loginOpen, setLoginOpen] = useState(false)
  const loginRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (loginRef.current && !loginRef.current.contains(e.target as Node)) {
        setLoginOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleNavClick = (href: string) => {
    setIsOpen(false)
    const el = document.querySelector(href)
    el?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <nav
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
        scrolled
          ? 'bg-white/80 backdrop-blur-md shadow-sm border-b border-white/20'
          : 'bg-transparent'
      )}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="flex items-center gap-2 font-extrabold text-lg sm:text-xl max-h-12 overflow-hidden"
          >
            {logoDisplayMode === 'title_only' ? (
              // Sadece metin — fallback ikon + başlık
              <>
                <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-[#FF6B35] text-white">
                  <Zap size={18} />
                </span>
                <span className={cn('transition-colors', scrolled ? 'text-[#1B2A4A]' : 'text-white')}>{siteTitle}</span>
              </>
            ) : logoDisplayMode === 'logo_only' ? (
              // Sadece logo
              logoUrl
                ? <img src={logoUrl} alt={siteTitle} style={{ height: `${Math.min(logoHeight, 48)}px` }} className="w-auto object-contain max-h-10 sm:max-h-12" /> // eslint-disable-line @next/next/no-img-element
                : <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-[#FF6B35] text-white"><Zap size={18} /></span>
            ) : (
              // Logo + Başlık (varsayılan)
              <>
                {logoUrl
                  ? <img src={logoUrl} alt={siteTitle} style={{ height: `${Math.min(logoHeight, 48)}px` }} className="w-auto object-contain max-h-10 sm:max-h-12" /> // eslint-disable-line @next/next/no-img-element
                  : <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-[#FF6B35] text-white"><Zap size={18} /></span>
                }
                <span className={cn('transition-colors', scrolled ? 'text-[#1B2A4A]' : 'text-white')}>{siteTitle}</span>
              </>
            )}
          </button>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <button
                key={link.href}
                onClick={() => handleNavClick(link.href)}
                className={cn(
                  'px-4 py-2 rounded-lg text-sm font-semibold transition-all hover:bg-white/20',
                  scrolled ? 'text-[#1B2A4A] hover:bg-orange-50' : 'text-white'
                )}
              >
                {link.label}
              </button>
            ))}
            <button
              onClick={() => handleNavClick('#basvur')}
              className="ml-2 px-5 py-2 bg-[#FF6B35] text-white rounded-full text-sm font-bold hover:bg-orange-500 transition-all hover:scale-105 shadow-md"
            >
              Hemen Başvur
            </button>

            {/* Giriş dropdown */}
            <div ref={loginRef} className="relative ml-1">
              <button
                onClick={() => setLoginOpen(!loginOpen)}
                title="Giriş Yap"
                className={cn(
                  'flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-semibold border transition-all',
                  scrolled
                    ? 'border-gray-200 text-[#1B2A4A] hover:bg-gray-50'
                    : 'border-white/30 text-white hover:bg-white/10'
                )}
              >
                <User size={15} />
                <span className="hidden sm:inline">Giriş</span>
              </button>
              {loginOpen && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50">
                  <a href="/trainer/login"
                    className="flex items-center gap-3 px-4 py-3 text-sm font-semibold text-[#1B2A4A] hover:bg-orange-50 transition-colors">
                    <span className="w-7 h-7 rounded-lg bg-[#1B2A4A] flex items-center justify-center text-white text-xs">🎓</span>
                    Eğitmen Girişi
                  </a>
                  <div className="border-t border-gray-50" />
                  <a href="/student/login"
                    className="flex items-center gap-3 px-4 py-3 text-sm font-semibold text-[#1B2A4A] hover:bg-orange-50 transition-colors">
                    <span className="w-7 h-7 rounded-lg bg-[#FF6B35] flex items-center justify-center text-white text-xs">🛼</span>
                    Öğrenci Girişi
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className={cn('md:hidden p-2 rounded-lg transition-colors', scrolled ? 'text-[#1B2A4A]' : 'text-white')}
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile menu */}
        {isOpen && (
          <div className="md:hidden bg-white rounded-xl shadow-xl mb-4 overflow-hidden border border-gray-100">
            {navLinks.map((link) => (
              <button
                key={link.href}
                onClick={() => handleNavClick(link.href)}
                className="w-full text-left px-5 py-3 text-[#1B2A4A] font-semibold hover:bg-orange-50 transition-colors border-b border-gray-50 last:border-0"
              >
                {link.label}
              </button>
            ))}
            <div className="p-3 space-y-2">
              <button
                onClick={() => handleNavClick('#basvur')}
                className="w-full px-5 py-3 bg-[#FF6B35] text-white rounded-xl text-sm font-bold hover:bg-orange-500 transition-all"
              >
                Hemen Başvur
              </button>
              <div className="grid grid-cols-2 gap-2">
                <a href="/trainer/login"
                  className="flex items-center justify-center gap-2 px-3 py-2.5 bg-[#1B2A4A] text-white rounded-xl text-xs font-bold hover:bg-[#2d4a8a] transition-all">
                  🎓 Eğitmen Girişi
                </a>
                <a href="/student/login"
                  className="flex items-center justify-center gap-2 px-3 py-2.5 bg-orange-100 text-[#FF6B35] rounded-xl text-xs font-bold hover:bg-orange-200 transition-all">
                  🛼 Öğrenci Girişi
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
