import { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StatsCardProps {
  title: string
  value: string | number
  icon: LucideIcon
  color?: 'orange' | 'navy' | 'green' | 'purple'
  subtitle?: string
}

export default function StatsCard({ title, value, icon: Icon, color = 'orange', subtitle }: StatsCardProps) {
  const colorMap = {
    orange: 'bg-orange-50 text-[#FF6B35]',
    navy: 'bg-blue-50 text-[#1B2A4A]',
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
  }

  return (
    <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className={cn('w-11 h-11 rounded-xl flex items-center justify-center', colorMap[color])}>
          <Icon size={22} />
        </div>
      </div>
      <div className="text-3xl font-extrabold text-[#1B2A4A] mb-1">{value}</div>
      <div className="text-sm font-semibold text-gray-500">{title}</div>
      {subtitle && <div className="text-xs text-gray-400 mt-1">{subtitle}</div>}
    </div>
  )
}
