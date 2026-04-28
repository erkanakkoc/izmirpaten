import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getAdminPermissions } from '@/lib/admin-auth'
import StatsCard from '@/components/admin/StatsCard'
import { ClipboardList, Calendar, TrendingUp, Users } from 'lucide-react'
import { formatDate, statusLabel, statusColor } from '@/lib/utils'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, CartesianGrid, Legend
} from 'recharts'
import DashboardCharts from '@/components/admin/DashboardCharts'

export const revalidate = 0

export default async function AdminDashboard() {
  // Lokasyon kısıtlı kullanıcılar dashboard'a erişemez
  const { locationFilter } = await getAdminPermissions()
  if (locationFilter) redirect('/admin/applications')

  const supabase = await createClient()

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()

  const [totalRes, monthRes, allRes] = await Promise.all([
    supabase.from('applications').select('id', { count: 'exact', head: true }),
    supabase.from('applications').select('id', { count: 'exact', head: true }).gte('created_at', startOfMonth),
    supabase.from('applications').select('id, created_at, package_name, location_name, status'),
  ])

  const total = totalRes.count ?? 0
  const monthCount = monthRes.count ?? 0
  const allApps = allRes.data ?? []

  // Pakete göre dağılım
  const packageDist = Object.entries(
    allApps.reduce((acc: Record<string, number>, a) => {
      acc[a.package_name] = (acc[a.package_name] || 0) + 1
      return acc
    }, {})
  ).map(([name, count]) => ({ name: name.replace('Birebir – ', 'BB ').replace('Grup – ', 'Gr ').replace('Mini Grup – ', 'Mini '), count }))

  // Lokasyona göre dağılım
  const locationDist = Object.entries(
    allApps.reduce((acc: Record<string, number>, a) => {
      acc[a.location_name] = (acc[a.location_name] || 0) + 1
      return acc
    }, {})
  ).map(([name, value]) => ({ name, value }))

  // Duruma göre dağılım
  const statusDist = Object.entries(
    allApps.reduce((acc: Record<string, number>, a) => {
      acc[a.status] = (acc[a.status] || 0) + 1
      return acc
    }, {})
  ).map(([status, count]) => ({ status: statusLabel(status), count }))

  // Son 7 gün trend
  const trendMap: Record<string, number> = {}
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
    trendMap[d.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit' })] = 0
  }
  allApps
    .filter((a) => a.created_at >= sevenDaysAgo)
    .forEach((a) => {
      const key = new Date(a.created_at).toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit' })
      if (key in trendMap) trendMap[key]++
    })
  const trendData = Object.entries(trendMap).map(([date, count]) => ({ date, count }))

  // Son başvurular (5 adet)
  const { data: recentApps } = await supabase
    .from('applications')
    .select('id, created_at, full_name, package_name, location_name, status')
    .order('created_at', { ascending: false })
    .limit(5)

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold text-[#1B2A4A]">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Başvuru istatistikleri ve özet</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatsCard title="Toplam Başvuru" value={total} icon={ClipboardList} color="orange" />
        <StatsCard title="Bu Ay" value={monthCount} icon={Calendar} color="navy" />
        <StatsCard
          title="Onaylanan"
          value={allApps.filter((a) => a.status === 'approved').length}
          icon={TrendingUp}
          color="green"
        />
        <StatsCard
          title="Bekleyen"
          value={allApps.filter((a) => a.status === 'new').length}
          icon={Users}
          color="purple"
        />
      </div>

      {/* Charts */}
      <DashboardCharts
        packageDist={packageDist}
        locationDist={locationDist}
        statusDist={statusDist}
        trendData={trendData}
      />

      {/* Recent applications */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-bold text-[#1B2A4A]">Son Başvurular</h2>
          <a href="/admin/applications" className="text-sm text-[#FF6B35] font-semibold hover:underline">
            Tümünü Gör →
          </a>
        </div>
        <div className="divide-y divide-gray-50">
          {recentApps?.map((app) => (
            <div key={app.id} className="px-6 py-4 flex items-center justify-between gap-4">
              <div className="min-w-0">
                <div className="font-semibold text-sm text-[#1B2A4A] truncate">{app.full_name}</div>
                <div className="text-xs text-gray-400 mt-0.5">{app.package_name} • {app.location_name}</div>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${statusColor(app.status)}`}>
                  {statusLabel(app.status)}
                </span>
                <span className="text-xs text-gray-400">{formatDate(app.created_at)}</span>
              </div>
            </div>
          ))}
          {(!recentApps || recentApps.length === 0) && (
            <div className="px-6 py-8 text-center text-gray-400 text-sm">Henüz başvuru yok.</div>
          )}
        </div>
      </div>
    </div>
  )
}
