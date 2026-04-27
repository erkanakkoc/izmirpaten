'use client'

import { Check, Star } from 'lucide-react'
import { formatPrice } from '@/lib/utils'
import type { Package } from '@/types'
import { cn } from '@/lib/utils'

interface PackagesSectionProps {
  packages: Package[]
  prerequisiteNote?: string
}

export default function PackagesSection({ packages, prerequisiteNote }: PackagesSectionProps) {
  const handleApply = (pkgId?: string, pkgName?: string) => {
    if (pkgId && pkgName) {
      window.dispatchEvent(new CustomEvent('selectPackage', { detail: { id: pkgId, name: pkgName } }))
    }
    document.querySelector('#basvur')?.scrollIntoView({ behavior: 'smooth' })
  }

  const isMiniGroup = (name: string) => name.toLowerCase().includes('mini grup')

  const getFeatures = (pkg: Package): string[] => {
    const base = ['40 dakika ders', 'Profesyonel eğitim', 'Bostanlı veya Göztepe']
    if (pkg.name.includes('Birebir')) return ['Birebir özel ilgi', ...base]
    if (pkg.name.includes('Grup')) return ['Grup dinamiği', ...base, 'Sosyal ortam']
    if (isMiniGroup(pkg.name)) return ['Kendi grubunla gel', 'En az 2 kişi', ...base]
    return base
  }

  return (
    <section id="paketler" className="py-24 bg-gradient-to-br from-gray-50 to-orange-50/30">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-14">
          <span className="inline-block text-[#FF6B35] font-bold text-sm uppercase tracking-widest mb-3">
            Fiyatlandırma
          </span>
          <h2 className="text-4xl font-extrabold text-[#1B2A4A] mb-4">Paketler & Fiyatlar</h2>
          <p className="text-gray-500 max-w-xl mx-auto">
            Sana en uygun paketi seç, hemen başvur. Tüm paketler 40 dakikalık derslerden oluşur.
          </p>
        </div>

        {/* Grup dersi ön koşul notu */}
        {prerequisiteNote && (
          <div className="mb-8 p-5 bg-amber-50 border border-amber-200 rounded-2xl flex gap-3">
            <span className="text-2xl flex-shrink-0">⚠️</span>
            <p className="text-amber-800 text-sm leading-relaxed">{prerequisiteNote}</p>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {packages.map((pkg, i) => (
            <div
              key={pkg.id}
              className={cn(
                'relative flex flex-col rounded-3xl border-2 p-7 transition-all duration-300 hover:shadow-xl hover:-translate-y-1',
                pkg.is_featured
                  ? 'border-[#FF6B35] bg-gradient-to-br from-[#FF6B35] to-orange-500 text-white shadow-2xl shadow-orange-200 scale-105'
                  : 'border-gray-200 bg-white hover:border-orange-200'
              )}
              style={{ animationDelay: `${i * 0.1}s` }}
            >
              {/* Badge */}
              {pkg.badge && (
                <div className={cn(
                  'absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full text-xs font-bold flex items-center gap-1',
                  pkg.is_featured
                    ? 'bg-white text-[#FF6B35]'
                    : 'bg-[#FF6B35] text-white'
                )}>
                  <Star size={12} className="fill-current" />
                  {pkg.badge}
                </div>
              )}

              {/* Price */}
              <div className="mb-5">
                <div className={cn('text-sm font-semibold mb-1', pkg.is_featured ? 'text-orange-100' : 'text-gray-400')}>
                  {pkg.name}
                </div>
                <div className={cn('text-4xl font-extrabold', pkg.is_featured ? 'text-white' : 'text-[#1B2A4A]')}>
                  {formatPrice(pkg.price)}
                </div>
                {isMiniGroup(pkg.name) && (
                  <div className={cn('text-xs mt-1', pkg.is_featured ? 'text-orange-100' : 'text-gray-400')}>
                    kişi başı ücret
                  </div>
                )}
              </div>

              {/* Description */}
              {pkg.description && (
                <p className={cn('text-sm leading-relaxed mb-5 flex-1', pkg.is_featured ? 'text-orange-50' : 'text-gray-500')}>
                  {pkg.description}
                </p>
              )}

              {/* Features */}
              <ul className="space-y-2 mb-7">
                {getFeatures(pkg).map((f) => (
                  <li key={f} className={cn('flex items-center gap-2 text-sm', pkg.is_featured ? 'text-white' : 'text-gray-600')}>
                    <Check size={16} className={pkg.is_featured ? 'text-orange-200' : 'text-[#FF6B35]'} />
                    {f}
                  </li>
                ))}
              </ul>

              {/* Mini group note */}
              {isMiniGroup(pkg.name) && (
                <div className={cn('text-xs mb-4 p-3 rounded-xl', pkg.is_featured ? 'bg-white/20' : 'bg-orange-50 text-orange-700')}>
                  💡 Kendi grubunla gel (en az 2 kişi), kişi başı bu fiyat geçerlidir.
                </div>
              )}

              {/* CTA */}
              <button
                onClick={() => handleApply(pkg.id, pkg.name)}
                className={cn(
                  'w-full py-3 rounded-2xl font-bold text-sm transition-all hover:scale-105',
                  pkg.is_featured
                    ? 'bg-white text-[#FF6B35] hover:bg-orange-50'
                    : 'bg-[#FF6B35] text-white hover:bg-orange-500'
                )}
              >
                Bu Pakete Başvur
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
