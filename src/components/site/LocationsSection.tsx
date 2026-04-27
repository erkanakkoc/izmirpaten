import { MapPin, Clock, Calendar } from 'lucide-react'
import type { Location } from '@/types'

interface LocationsSectionProps {
  locations: Location[]
}

export default function LocationsSection({ locations }: LocationsSectionProps) {
  return (
    <section id="lokasyonlar" className="py-24 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-14">
          <span className="inline-block text-[#FF6B35] font-bold text-sm uppercase tracking-widest mb-3">
            Nerede?
          </span>
          <h2 className="text-4xl font-extrabold text-[#1B2A4A] mb-4">Lokasyonlar</h2>
          <p className="text-gray-500 max-w-xl mx-auto">
            İzmir&apos;in iki güzel noktasında, açık havada paten keyfi.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {locations.map((loc, i) => (
            <div
              key={loc.id}
              className="group rounded-3xl border-2 border-gray-100 hover:border-orange-200 overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-orange-50"
            >
              {/* Map embed area */}
              <div className="relative h-48 bg-gradient-to-br from-[#1B2A4A]/10 to-[#FF6B35]/10 flex items-center justify-center overflow-hidden">
                {loc.maps_url ? (
                  <a
                    href={loc.maps_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="absolute inset-0 flex items-center justify-center hover:opacity-90 transition-opacity"
                  >
                    <div className="text-center">
                      <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center mx-auto mb-3 shadow-lg group-hover:scale-110 transition-transform">
                        <MapPin size={28} className="text-[#FF6B35]" />
                      </div>
                      <span className="text-sm font-semibold text-[#1B2A4A] bg-white/80 px-3 py-1 rounded-full">
                        Haritada Gör →
                      </span>
                    </div>
                  </a>
                ) : (
                  <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
                    <MapPin size={28} className="text-[#FF6B35]" />
                  </div>
                )}
                <div
                  className="absolute top-4 left-4 bg-[#FF6B35] text-white text-xs font-bold px-3 py-1 rounded-full"
                >
                  {i === 0 ? 'Kuzey' : 'Güney'} İzmir
                </div>
              </div>

              {/* Info */}
              <div className="p-7">
                <h3 className="text-xl font-extrabold text-[#1B2A4A] mb-1">{loc.name}</h3>
                <div className="flex items-center gap-1.5 text-gray-500 text-sm mb-5">
                  <MapPin size={14} className="text-[#FF6B35]" />
                  {loc.venue}
                </div>

                <div className="space-y-3">
                  {loc.weekday_hours && (
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50">
                      <div className="w-8 h-8 rounded-lg bg-[#1B2A4A]/10 flex items-center justify-center flex-shrink-0">
                        <Clock size={15} className="text-[#1B2A4A]" />
                      </div>
                      <div>
                        <div className="text-xs text-gray-400 font-medium">Hafta İçi</div>
                        <div className="text-sm font-bold text-[#1B2A4A]">{loc.weekday_hours}</div>
                      </div>
                    </div>
                  )}
                  {loc.weekend_hours && (
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-orange-50">
                      <div className="w-8 h-8 rounded-lg bg-[#FF6B35]/15 flex items-center justify-center flex-shrink-0">
                        <Calendar size={15} className="text-[#FF6B35]" />
                      </div>
                      <div>
                        <div className="text-xs text-orange-400 font-medium">Hafta Sonu</div>
                        <div className="text-sm font-bold text-[#1B2A4A]">{loc.weekend_hours}</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
