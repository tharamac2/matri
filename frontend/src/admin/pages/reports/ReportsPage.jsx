import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { TrendingUp, Users, Heart, Percent, Download, UserPlus } from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts'
import api from '../../services/api.js'
import { downloadCsvFromRows, downloadCsvFromEndpoint } from '../../utils/exportCsv.js'

const PIE_COLORS = ['#7B2032', '#C0394F', '#E8889A', '#F5C1CA', '#FBDDE2']

function KpiCard({ label, value, change, icon: Icon, iconBg, iconColor }) {
  const up = change >= 0
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-3">
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${iconBg}`}>
          <Icon size={18} className={iconColor} />
        </div>
        <span className={`text-xs font-semibold ${up ? 'text-emerald-600' : 'text-red-500'}`}>
          {up ? '+' : ''}{change}%
        </span>
      </div>
      <p className="text-2xl font-bold text-gray-900">{typeof value === 'number' ? value.toLocaleString() : value}</p>
      <p className="text-xs font-medium text-gray-400 mt-0.5 uppercase tracking-wide">{label}</p>
    </div>
  )
}

const AGE_DEMOGRAPHICS = [
  { range: '22–28 Years', users: 10450, engagement: '78%' },
  { range: '29–35 Years', users: 18200, engagement: '85%' },
  { range: '36–45 Years', users: 18540, engagement: '72%' },
  { range: '45+ Years',   users: 5910,  engagement: '61%' },
]

export default function ReportsPage() {
  const navigate = useNavigate()
  const [days, setDays] = useState(120)

  const { data: overview } = useQuery({
    queryKey: ['analytics', 'overview'],
    queryFn: () => api.get('/analytics/overview').then(r => r.data),
  })

  const { data: registrations } = useQuery({
    queryKey: ['analytics', 'registrations', { days }],
    queryFn: () => api.get('/analytics/registrations', { params: { days } }).then(r => r.data),
  })

  const { data: demographics } = useQuery({
    queryKey: ['analytics', 'demographics'],
    queryFn: () => api.get('/analytics/demographics').then(r => r.data),
  })

  const { data: matchInsights } = useQuery({
    queryKey: ['analytics', 'matches', { days: 30 }],
    queryFn: () => api.get('/analytics/matches', { params: { days: 30 } }).then(r => r.data),
  })

  const handleDownloadGrowthReport = () => {
    downloadCsvFromRows('monthly_growth_report.csv', registrations?.points ?? [])
  }

  const handleDownloadVerificationLog = () => downloadCsvFromEndpoint(api, '/users/export', 'member_verification_log.csv')

  const handleCustomExport = () => {
    const choice = window.prompt("Export which data? Type 'members' or 'payments':", 'members')
    if (!choice) return
    if (choice.trim().toLowerCase() === 'payments') {
      downloadCsvFromEndpoint(api, '/payments/export', 'payments_export.csv')
    } else {
      downloadCsvFromEndpoint(api, '/users/export', 'members_export.csv')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports &amp; Analytics</h1>
          <p className="mt-1 text-sm text-gray-500">Comprehensive insights to help you grow your matrimony ecosystem.</p>
        </div>
        <button type="button" className="btn-primary" onClick={() => navigate('/admin/members')}>
          <UserPlus size={15} /> User Growth
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard label="New Registrations"  value={overview?.new_this_week ?? '—'}    change={4.2}  icon={UserPlus}   iconBg="bg-brand-50"     iconColor="text-brand-700" />
        <KpiCard label="Verified Users"     value={overview?.total_users ?? '—'}      change={1.8}  icon={Users}      iconBg="bg-emerald-50"  iconColor="text-emerald-600" />
        <KpiCard label="New Matches"        value={overview?.total_matches ?? '—'}    change={3.1}  icon={Heart}      iconBg="bg-pink-50"     iconColor="text-pink-600" />
        <KpiCard label="Premium Conversion" value={`${matchInsights?.acceptance_rate ?? 0}%`} change={-0.7} icon={Percent} iconBg="bg-amber-50" iconColor="text-amber-600" />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Registration trend */}
        <div className="card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-900">Registration Trends (Last 4 Months)</h2>
            <select value={days} onChange={e => setDays(Number(e.target.value))}
              className="rounded-lg border border-gray-200 px-2 py-1 text-xs">
              <option value={120}>4 Months</option>
              <option value={90}>3 Months</option>
              <option value={30}>1 Month</option>
            </select>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={registrations?.points ?? []} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} tickLine={false} />
              <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
              <Tooltip />
              <Bar dataKey="count" fill="#9A2B3D" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Demographics */}
        <div className="card p-5">
          <h2 className="mb-4 text-sm font-semibold text-gray-900">Member Demographics</h2>
          {demographics && (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={demographics.by_religion} dataKey="count" nameKey="label" cx="50%" cy="50%" outerRadius={75}
                  label={({ label, percent }) => `${label}: ${(percent * 100).toFixed(0)}%`} labelLine={false} fontSize={10}>
                  {(demographics.by_religion ?? []).map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend iconSize={10} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Download Centre */}
        <div className="card p-5">
          <h2 className="mb-4 text-sm font-semibold text-gray-900">Download Centre</h2>
          <div className="space-y-3">
            {[
              { name: 'Monthly Growth Report', sub: 'Monthly · CSV', icon: TrendingUp, onClick: handleDownloadGrowthReport },
              { name: 'Member Verification Log', sub: 'Weekly · CSV', icon: Users, onClick: handleDownloadVerificationLog },
            ].map(item => (
              <div key={item.name} className="flex items-center justify-between rounded-xl bg-gray-50 px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white shadow-card">
                    <item.icon size={15} className="text-brand-700" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-800">{item.name}</p>
                    <p className="text-xs text-gray-400">{item.sub}</p>
                  </div>
                </div>
                <button type="button" onClick={item.onClick} className="flex items-center gap-1 text-xs font-semibold text-brand-700 hover:text-brand-800">
                  <Download size={13} /> Download
                </button>
              </div>
            ))}
            <button type="button" onClick={handleCustomExport} className="w-full rounded-xl border border-dashed border-gray-300 py-3 text-xs font-medium text-gray-500 hover:bg-gray-50">
              + Generate Custom Export
            </button>
          </div>
        </div>

        {/* User Demographics table */}
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
            <h2 className="text-sm font-semibold text-gray-900">User Demographics</h2>
            <button type="button" className="text-xs font-semibold text-brand-700 hover:underline" onClick={() => navigate('/admin/members')}>View Detailed →</button>
          </div>
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-xs font-semibold uppercase tracking-wide text-gray-400">
                <th className="px-5 py-3">Age Group</th>
                <th className="px-5 py-3">Active Users</th>
                <th className="px-5 py-3">Engagement</th>
                <th className="px-5 py-3">Trend</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {AGE_DEMOGRAPHICS.map(row => (
                <tr key={row.range} className="hover:bg-gray-50/50">
                  <td className="px-5 py-3 font-medium text-gray-800">{row.range}</td>
                  <td className="px-5 py-3 text-gray-600">{row.users.toLocaleString()}</td>
                  <td className="px-5 py-3 text-gray-600">{row.engagement}</td>
                  <td className="px-5 py-3">
                    <div className="h-1.5 w-16 rounded-full bg-gray-100">
                      <div className="h-1.5 rounded-full bg-brand-600" style={{ width: row.engagement }} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
