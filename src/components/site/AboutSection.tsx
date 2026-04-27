import * as LucideIcons from 'lucide-react'
import { LucideProps } from 'lucide-react'
import type { Feature, InfoCard, SiteSettings } from '@/types'

interface AboutSectionProps {
  settings: SiteSettings
  features: Feature[]
  infoCards: InfoCard[]
}

function DynamicIcon({ name, ...props }: { name: string } & LucideProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const Icon = (LucideIcons as any)[name]
  if (!Icon) return <LucideIcons.Star {...props} />
  return <Icon {...props} />
}

export default function AboutSection({ settings, features, infoCards }: AboutSectionProps) {
  const aboutText = settings.about_text || ''

  return (
    <section id="hakkinda" className="py-24 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* About text */}
        <div className="max-w-3xl mx-auto text-center mb-20">
          <span className="inline-block text-[#FF6B35] font-bold text-sm uppercase tracking-widest mb-3">
            Hakkında
          </span>
          <h2 className="text-4xl font-extrabold text-[#1B2A4A] mb-6">Merhaba, Ben Seninle Patene Çıkacağım!</h2>
          <p className="text-gray-600 text-lg leading-relaxed whitespace-pre-wrap">{aboutText}</p>
        </div>

        {/* Features */}
        {features.length > 0 && (
          <div className="mb-20">
            <h3 className="text-2xl font-extrabold text-[#1B2A4A] text-center mb-10">
              Ne Öğreneceksin?
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((feature, i) => (
                <div
                  key={feature.id}
                  className="group flex gap-4 p-6 rounded-2xl border border-gray-100 hover:border-orange-200 hover:shadow-lg hover:shadow-orange-50 transition-all duration-300 bg-white"
                  style={{ animationDelay: `${i * 0.1}s` }}
                >
                  <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center group-hover:bg-[#FF6B35] transition-colors">
                    <DynamicIcon
                      name={feature.icon || 'Star'}
                      size={22}
                      className="text-[#FF6B35] group-hover:text-white transition-colors"
                    />
                  </div>
                  <div>
                    <h4 className="font-bold text-[#1B2A4A] mb-1">{feature.title}</h4>
                    {feature.description && (
                      <p className="text-gray-500 text-sm leading-relaxed">{feature.description}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Info cards */}
        {infoCards.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {infoCards.map((card) => (
              <div
                key={card.id}
                className="flex flex-col items-center text-center p-5 rounded-2xl bg-gradient-to-br from-[#1B2A4A]/5 to-[#1B2A4A]/10 border border-[#1B2A4A]/10"
              >
                <div className="w-10 h-10 rounded-lg bg-[#1B2A4A] flex items-center justify-center mb-3">
                  <DynamicIcon name={card.icon || 'Info'} size={18} className="text-white" />
                </div>
                <div className="font-bold text-[#1B2A4A] text-sm mb-1">{card.title}</div>
                <div className="text-gray-500 text-xs leading-relaxed">{card.content}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
