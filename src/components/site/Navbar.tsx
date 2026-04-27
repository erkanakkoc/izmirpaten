'use client'

import { useState, useEffect } from 'react'
import { Menu, X, Zap } from 'lucide-react'
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
            className="flex items-center gap-2 font-extrabold text-xl max-h-12 overflow-hidden"
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
                ? <img src={logoUrl} alt={siteTitle} style={{ height: `${Math.min(logoHeight, 48)}px` }} className="w-auto object-contain max-h-12" /> // eslint-disable-line @next/next/no-img-element
                : <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-[#FF6B35] text-white"><Zap size={18} /></span>
            ) : (
              // Logo + Başlık (varsayılan)
              <>
                {logoUrl
                  ? <img src={logoUrl} alt={siteTitle} style={{ height: `${Math.min(logoHeight, 48)}px` }} className="w-auto object-contain max-h-12" /> // eslint-disable-line @next/next/no-img-element
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
            <div className="p-3">
              <button
                onClick={() => handleNavClick('#basvur')}
                className="w-full px-5 py-3 bg-[#FF6B35] text-white rounded-xl text-sm font-bold hover:bg-orange-500 transition-all"
              >
                Hemen Başvur
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
