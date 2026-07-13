import { useQuery } from '@tanstack/react-query'
import { TrendingUp, TrendingDown, Users, Heart, UserCheck, AlertCircle } from 'lucide-react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import api from '../../services/api.js'
import { Link } from 'react-router-dom'

function KpiCard({ label, value, change, icon: Icon, iconColor = 'text-brand-700', iconBg = 'bg-brand-50' }) {
  const up = change >= 0
  return (
    <div className="card flex items-center gap-4 p-5">
      <div className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl ${iconBg}`}>
        <Icon size={22} className={iconColor} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium uppercase tracking-wide text-gray-400">{label}</p>
        <p className="mt-0.5 text-2xl font-bold text-gray-900">{typeof value === 'number' ? value.toLocaleString() : value}</p>
        {change !== undefined && (
          <span className={`inline-flex items-center gap-0.5 text-xs font-semibold ${up ? 'text-emerald-600' : 'text-red-500'}`}>
            {up ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
            {Math.abs(change)}%
          </span>
        )}
      </div>
    </div>
  )
}

export default function Home() {
  const { data: overview } = useQuery({
    queryKey: ['analytics', 'overview'],
    queryFn: () => api.get('/analytics/overview').then(r => r.data),
  })

  const { data: revenue } = useQuery({
    queryKey: ['analytics', 'revenue', { days: 180 }],
    queryFn: () => api.get('/analytics/revenue', { params: { days: 180 } }).then(r => r.data),
  })

  const { data: photoQueue } = useQuery({
    queryKey: ['moderation', 'photos', { page: 1, status: 'pending' }],
    queryFn: () => api.get('/moderation/photos', { params: { page: 1, size: 5, status: 'pending' } }).then(r => r.data),
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Administrative Overview</h1>
        <p className="mt-1 text-sm text-gray-500">Here's what's happening with Tharamac Matrimony today.</p>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <KpiCard label="Total Members"   value={overview?.total_users ?? '—'}     change={4.2}  icon={Users}      />
        <KpiCard label="Active Today"    value={overview?.active_today ?? '—'}    change={1.8}  icon={UserCheck}  iconColor="text-emerald-600" iconBg="bg-emerald-50" />
        <KpiCard label="New This Week"   value={overview?.new_this_week ?? '—'}   change={2.1}  icon={TrendingUp} iconColor="text-blue-600"    iconBg="bg-blue-50" />
        <KpiCard label="Pending Reports" value={overview?.pending_reports ?? '—'} change={-1.3} icon={AlertCircle} iconColor="text-red-600"   iconBg="bg-red-50" />
        <KpiCard label="Total Matches"   value={overview?.total_matches ?? '—'}   change={3.1}  icon={Heart}      iconColor="text-pink-600"   iconBg="bg-pink-50" />
      </div>

      {/* Revenue Chart */}
      <div className="card p-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Revenue Overview</h2>
            <p className="text-xs text-gray-400">Year-to-date premium subscription earnings</p>
          </div>
          {revenue && (
            <div className="text-right">
              <p className="text-[10px] uppercase tracking-wide text-gray-400">Total Income</p>
              <p className="text-lg font-bold text-gray-900">
                ₹{Number(revenue.total).toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </p>
            </div>
          )}
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={revenue?.points ?? []} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#9A2B3D" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#9A2B3D" stopOpacity={0}    />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} tickLine={false} />
            <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
            <Tooltip formatter={v => [`₹${Number(v).toLocaleString()}`, 'Revenue']} />
            <Area type="monotone" dataKey="amount" stroke="#9A2B3D" strokeWidth={2} fill="url(#revGrad)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Pending Verification Queue */}
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <h2 className="text-base font-semibold text-gray-900">Pending Verification Queue</h2>
          <div className="flex gap-2">
            <Link to="/admin/verification" className="btn-outline py-1.5 text-xs">Filter</Link>
            <Link to="/admin/verification" className="btn-outline py-1.5 text-xs">Export Report</Link>
          </div>
        </div>
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">
              <th className="px-6 py-3">Member Name</th>
              <th className="px-6 py-3">Registration Date</th>
              <th className="px-6 py-3">Type</th>
              <th className="px-6 py-3">Priority</th>
              <th className="px-6 py-3">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {(photoQueue?.items ?? []).map(item => (
              <tr key={item.member_id} className="hover:bg-gray-50/50">
                <td className="px-6 py-3.5">
                  <div className="flex items-center gap-3">
                    {item.photo_url
                      ? <img src={item.photo_url} alt="" className="h-8 w-8 rounded-full object-cover" />
                      : <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-700">{item.member_name[0]}</div>
                    }
                    <span className="font-medium text-gray-900">{item.member_name}</span>
                  </div>
                </td>
                <td className="px-6 py-3.5 text-gray-500">
                  {new Date(item.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </td>
                <td className="px-6 py-3.5">
                  <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700">Photo</span>
                </td>
                <td className="px-6 py-3.5">
                  <span className="priority-medium">MEDIUM</span>
                </td>
                <td className="px-6 py-3.5">
                  <Link to="/admin/verification" className="text-xs font-semibold text-brand-700 hover:underline">Review</Link>
                </td>
              </tr>
            ))}
            {!photoQueue?.items?.length && (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-sm text-gray-400">No pending verifications.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
