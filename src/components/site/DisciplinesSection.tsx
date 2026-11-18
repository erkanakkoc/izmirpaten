'use client'

import { Zap, Snowflake, Bike, Dumbbell, Activity } from 'lucide-react'
import type { Discipline } from '@/types'

interface DisciplinesSectionProps {
  disciplines: Discipline[]
}

const ICONS: Record<string, typeof Zap> = {
  Zap, Snowflake, Bike, Dumbbell, Activity,
}

function DisciplineIcon({ name }: { name: string | null }) {
  const Icon = (name && ICONS[name]) || Zap
  return <Icon size={26} className="text-white" />
}

export default function DisciplinesSection({ disciplines }: DisciplinesSectionProps) {
  // Tek branş varken arayüz sade kalsın — bu bölüm yalnızca birden fazla aktif branş olduğunda görünür
  if (disciplines.length <= 1) return null

  const handleSelect = (id: string) => {
    window.dispatchEvent(new CustomEvent('selectDiscipline', { detail: { id } }))
    document.querySelector('#paketler')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <section id="dersler" className="py-24 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-14">
          <span className="inline-block text-[#FF6B35] font-bold text-sm uppercase tracking-widest mb-3">
            Branşlarımız
          </span>
          <h2 className="text-4xl font-extrabold text-[#1B2A4A] mb-4">Derslerimiz</h2>
          <p className="text-gray-500 max-w-xl mx-auto">
            Vermekte olduğumuz dersler arasından seçim yap, paket ve fiyatları incele.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {disciplines.map((d) => (
            <button
              key={d.id}
              onClick={() => handleSelect(d.id)}
              className="group text-left rounded-3xl border-2 border-gray-100 hover:border-orange-200 p-7 transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
            >
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#1B2A4A] to-[#2d4a8a] flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <DisciplineIcon name={d.icon} />
              </div>
              <h3 className="text-xl font-extrabold text-[#1B2A4A] mb-2">{d.name}</h3>
              {d.description && (
                <p className="text-sm text-gray-500 leading-relaxed mb-4">{d.description}</p>
              )}
              <span className="text-sm font-bold text-[#FF6B35] group-hover:underline">
                Paketleri Gör →
              </span>
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}
