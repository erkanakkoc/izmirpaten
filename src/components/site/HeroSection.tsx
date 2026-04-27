'use client'

import { SiteSettings } from '@/types'

interface HeroSectionProps {
  settings: SiteSettings
}

export default function HeroSection({ settings }: HeroSectionProps) {
  const title = settings.hero_title || 'Patenle Tanış,\nİzmir\'i Hisset'
  const subtitle = settings.hero_subtitle || 'Bostanlı ve Göztepe\'de profesyonel birebir ve grup paten dersleri.'
  const ctaText = settings.hero_cta_text || 'Hemen Başvur'

  const handleCta = () => {
    document.querySelector('#basvur')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <section
      id="hero"
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, #1B2A4A 0%, #2d4a8a 40%, #FF6B35 100%)',
      }}
    >
      {/* Animated background circles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-orange-400/20 blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-blue-400/20 blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-white/5 blur-3xl" />
      </div>

      {/* Floating emojis — sadece md+ ekranlarda göster, mobilde metin üstüne binmesin */}
      <div className="hidden md:block absolute inset-0 overflow-hidden pointer-events-none select-none">
        {['🛼', '⭐', '🎯', '🏆', '🛼', '✨'].map((emoji, i) => (
          <span
            key={i}
            className="absolute text-4xl opacity-20"
            style={{
              left: `${10 + i * 15}%`,
              top: `${20 + (i % 3) * 25}%`,
              animation: `fadeInUp ${1 + i * 0.2}s ease-out ${i * 0.15}s both`,
            }}
          >
            {emoji}
          </span>
        ))}
      </div>

      {/* Content */}
      <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
        <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2 mb-8 text-white/90 text-sm font-semibold animate-fade-in">
          <span>🛼</span>
          <span>İzmir&apos;in Açık Hava Paten Okulu</span>
        </div>

        <h1
          className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-white mb-6 leading-tight opacity-0 animate-fade-in-up"
          style={{ animationDelay: '0.2s', animationFillMode: 'forwards' }}
        >
          {title.split('\n').map((line, i) => (
            <span key={i}>
              {line}
              {i < title.split('\n').length - 1 && <br />}
            </span>
          ))}
        </h1>

        <p
          className="text-lg sm:text-xl text-white/85 mb-10 max-w-2xl mx-auto leading-relaxed opacity-0 animate-fade-in-up"
          style={{ animationDelay: '0.4s', animationFillMode: 'forwards' }}
        >
          {subtitle}
        </p>

        <div
          className="flex flex-col sm:flex-row items-center justify-center gap-4 opacity-0 animate-fade-in-up"
          style={{ animationDelay: '0.6s', animationFillMode: 'forwards' }}
        >
          <button
            onClick={handleCta}
            className="px-8 py-4 bg-[#FF6B35] text-white rounded-full text-lg font-bold hover:bg-orange-400 transition-all hover:scale-105 shadow-2xl shadow-orange-500/30"
          >
            {ctaText} →
          </button>
          <button
            onClick={() => document.querySelector('#paketler')?.scrollIntoView({ behavior: 'smooth' })}
            className="px-8 py-4 bg-white/10 backdrop-blur-sm border border-white/30 text-white rounded-full text-lg font-semibold hover:bg-white/20 transition-all"
          >
            Paketleri Gör
          </button>
        </div>

        {/* Stats */}
        <div
          className="mt-16 grid grid-cols-3 gap-6 max-w-lg mx-auto opacity-0 animate-fade-in-up"
          style={{ animationDelay: '0.8s', animationFillMode: 'forwards' }}
        >
          {[
            { value: '2', label: 'Lokasyon' },
            { value: '40dk', label: 'Ders Süresi' },
            { value: '5', label: 'Max Kişi/Grup' },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-3xl font-extrabold text-white">{stat.value}</div>
              <div className="text-sm text-white/70 mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 border-2 border-white/40 rounded-full flex items-start justify-center p-1">
          <div className="w-1 h-3 bg-white/60 rounded-full animate-scroll-down" />
        </div>
      </div>
    </section>
  )
}
