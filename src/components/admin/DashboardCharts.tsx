'use client'

import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, CartesianGrid,
} from 'recharts'

const COLORS = ['#FF6B35', '#1B2A4A', '#f97316', '#2d4a8a', '#fb923c', '#3b5bdb']

interface DashboardChartsProps {
  packageDist: { name: string; count: number }[]
  locationDist: { name: string; value: number }[]
  statusDist: { status: string; count: number }[]
  trendData: { date: string; count: number }[]
}

export default function DashboardCharts({ packageDist, locationDist, statusDist, trendData }: DashboardChartsProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      {/* Pakete göre dağılım */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h2 className="font-bold text-[#1B2A4A] mb-4">Pakete Göre Başvurular</h2>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={packageDist} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            <Bar dataKey="count" fill="#FF6B35" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Lokasyona göre dağılım */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h2 className="font-bold text-[#1B2A4A] mb-4">Lokasyona Göre Dağılım</h2>
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie data={locationDist} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}>
              {locationDist.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Son 7 gün trendi */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h2 className="font-bold text-[#1B2A4A] mb-4">Son 7 Gün Başvuru Trendi</h2>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={trendData} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            <Line type="monotone" dataKey="count" stroke="#FF6B35" strokeWidth={2} dot={{ fill: '#FF6B35' }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Duruma göre dağılım */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h2 className="font-bold text-[#1B2A4A] mb-4">Duruma Göre Dağılım</h2>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={statusDist} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
            <XAxis dataKey="status" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            <Bar dataKey="count" radius={[6, 6, 0, 0]}>
              {statusDist.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
