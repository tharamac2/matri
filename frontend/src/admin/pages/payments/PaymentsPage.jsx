import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { TrendingUp, CreditCard, Clock, RotateCcw, Download, MoreHorizontal } from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import api from '../../services/api.js'
import { downloadCsvFromEndpoint } from '../../utils/exportCsv.js'

const PLAN_PERFORMANCE = [
  { name: 'Diamond Tier', pct: 45, color: '#60A5FA' },
  { name: 'Platinum Tier', pct: 35, color: '#A78BFA' },
  { name: 'Gold Tier', pct: 20, color: '#FCD34D' },
]

const STATUS_STYLE = {
  success:   'bg-emerald-100 text-emerald-700',
  completed: 'bg-emerald-100 text-emerald-700',
  active:    'bg-emerald-100 text-emerald-700',
  pending:   'bg-amber-100 text-amber-700',
  failed:    'bg-red-100 text-red-700',
  refunded:  'bg-gray-100 text-gray-600',
  cancelled: 'bg-gray-100 text-gray-600',
}

const PLAN_BADGE = {
  diamond:  { label: 'Diamond',  cls: 'bg-blue-100 text-blue-700' },
  platinum: { label: 'Platinum', cls: 'bg-purple-100 text-purple-700' },
  gold:     { label: 'Gold',     cls: 'bg-amber-100 text-amber-700' },
  free:     { label: 'Free',     cls: 'bg-gray-100 text-gray-600' },
}

function KpiCard({ label, value, sub, icon: Icon, iconBg, iconColor }) {
  return (
    <div className="card flex items-center gap-4 p-5">
      <div className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl ${iconBg}`}>
        <Icon size={20} className={iconColor} />
      </div>
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-gray-400">{label}</p>
        <p className="text-xl font-bold text-gray-900">{value}</p>
        {sub && <p className="text-xs text-gray-400">{sub}</p>}
      </div>
    </div>
  )
}

export default function PaymentsPage() {
  const navigate = useNavigate()
  const [days, setDays] = useState(30)
  const [page, setPage] = useState(1)
  const [size, setSize] = useState(8)
  const [openMenuId, setOpenMenuId] = useState(null)

  const { data: revenue } = useQuery({
    queryKey: ['analytics', 'revenue', { days }],
    queryFn: () => api.get('/analytics/revenue', { params: { days } }).then(r => r.data),
  })

  const { data: subs } = useQuery({
    queryKey: ['subscriptions', { page: 1, size: 1 }],
    queryFn: () => api.get('/subscriptions', { params: { page: 1, size: 1 } }).then(r => r.data),
  })

  const { data: payments } = useQuery({
    queryKey: ['payments', { page, size }],
    queryFn: () => api.get('/payments', { params: { page, size } }).then(r => r.data),
    keepPreviousData: true,
  })

  const totalRevenue = revenue?.total ?? 0
  const totalPages = payments ? Math.max(1, Math.ceil(payments.total / size)) : 1

  const handleGenerateReport = () => downloadCsvFromEndpoint(api, '/payments/export', 'payments_export.csv')

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payment Management</h1>
          <p className="mt-1 text-sm text-gray-500">Track revenue, subscriptions, and financial transactions across your matrimonial suite.</p>
        </div>
        <button type="button" className="btn-primary" onClick={handleGenerateReport}>
          <Download size={15} /> Generate Report
        </button>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard label="Total Revenue"        value={`₹${Number(totalRevenue).toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
                 icon={TrendingUp} iconBg="bg-emerald-50" iconColor="text-emerald-600" />
        <KpiCard label="Active Subscriptions" value={(subs?.total ?? 0).toLocaleString()}
                 icon={CreditCard} iconBg="bg-blue-50" iconColor="text-blue-600" />
        <KpiCard label="Total Transactions"   value={(payments?.total ?? 0).toLocaleString()}
                 icon={Clock} iconBg="bg-amber-50" iconColor="text-amber-600" />
        <KpiCard label="Refunded"             value={(payments?.items ?? []).filter(p => p.status === 'refunded').length}
                 icon={RotateCcw} iconBg="bg-red-50" iconColor="text-red-600" />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Revenue bar chart */}
        <div className="card p-5 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-900">Revenue Overview</h2>
            <select value={days} onChange={e => setDays(Number(e.target.value))}
              className="rounded-lg border border-gray-200 px-2 py-1 text-xs focus:outline-none">
              <option value={30}>Last 1 Month</option>
              <option value={90}>Last 3 Months</option>
              <option value={180}>Last 6 Months</option>
            </select>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={revenue?.points ?? []} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} tickLine={false} />
              <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
              <Tooltip formatter={v => [`₹${Number(v).toLocaleString()}`, 'Revenue']} />
              <Bar dataKey="amount" fill="#9A2B3D" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Plan performance */}
        <div className="card p-5">
          <h2 className="mb-4 text-sm font-semibold text-gray-900">Plan Performance</h2>
          <div className="space-y-3">
            {PLAN_PERFORMANCE.map(p => (
              <div key={p.name}>
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="font-medium text-gray-700">{p.name}</span>
                  <span className="font-bold text-gray-900">{p.pct}%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-gray-100">
                  <div className="h-2 rounded-full" style={{ width: `${p.pct}%`, backgroundColor: p.color }} />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 border-t border-gray-100 pt-3 text-xs text-gray-400">
            <p className="font-medium text-gray-600">Total active subscribers</p>
            <p className="text-lg font-bold text-gray-900">{subs?.total?.toLocaleString() ?? '—'} Members</p>
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <h2 className="text-base font-semibold text-gray-900">Recent Transactions</h2>
          <button type="button" className="text-xs font-semibold text-brand-700 hover:underline" onClick={() => setSize(50)}>
            View All →
          </button>
        </div>
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">
              <th className="px-6 py-3">Member</th>
              <th className="px-6 py-3">Plan Name</th>
              <th className="px-6 py-3">Amount</th>
              <th className="px-6 py-3">Date</th>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {(payments?.items ?? []).map(payment => {
              const planK = payment.plan_name?.toLowerCase() ?? ''
              const pb = PLAN_BADGE[planK] ?? { label: payment.plan_name ?? '—', cls: 'bg-gray-100 text-gray-600' }
              const statusCls = STATUS_STYLE[payment.status] ?? 'bg-gray-100 text-gray-600'
              return (
                <tr key={payment.id} className="hover:bg-gray-50/50">
                  <td className="px-6 py-3.5">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-700">
                        {payment.member_id}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{payment.member_name}</p>
                        <p className="text-xs text-gray-400">#{payment.member_id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-3.5">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${pb.cls}`}>{pb.label}</span>
                  </td>
                  <td className="px-6 py-3.5 font-semibold text-gray-900">
                    ₹{Number(payment.amount).toLocaleString()}
                  </td>
                  <td className="px-6 py-3.5 text-xs text-gray-500">
                    {new Date(payment.paid_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </td>
                  <td className="px-6 py-3.5">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusCls}`}>
                      ● {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-3.5 relative">
                    <button type="button" className="rounded-lg p-1 text-gray-400 hover:text-gray-600"
                      onClick={() => setOpenMenuId(openMenuId === payment.id ? null : payment.id)}>
                      <MoreHorizontal size={16} />
                    </button>
                    {openMenuId === payment.id && (
                      <div className="absolute right-6 z-10 mt-1 w-36 rounded-lg border border-gray-100 bg-white py-1 text-xs shadow-lg">
                        <button type="button" className="block w-full px-3 py-2 text-left hover:bg-gray-50"
                          onClick={() => { setOpenMenuId(null); navigate(`/admin/members/${payment.member_id}`) }}>
                          View member
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              )
            })}
            {!payments?.items?.length && (
              <tr><td colSpan={6} className="px-6 py-8 text-center text-sm text-gray-400">No transactions found.</td></tr>
            )}
          </tbody>
        </table>
        <div className="flex items-center justify-between border-t border-gray-100 px-6 py-4 text-xs text-gray-500">
          <span>{payments?.total ?? 0} total transactions</span>
          <div className="flex gap-1">
            <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}
              className="rounded-lg border border-gray-200 px-3 py-1 hover:bg-gray-50 disabled:opacity-40">Previous</button>
            {[...Array(Math.min(totalPages, 3))].map((_, i) => (
              <button key={i} onClick={() => setPage(i + 1)}
                className={`rounded-lg border px-3 py-1 ${page === i+1 ? 'border-brand-700 bg-brand-700 text-white' : 'border-gray-200 hover:bg-gray-50'}`}>
                {i + 1}
              </button>
            ))}
            <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}
              className="rounded-lg border border-gray-200 px-3 py-1 hover:bg-gray-50 disabled:opacity-40">Next</button>
          </div>
        </div>
      </div>
    </div>
  )
}
