import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Bell, CreditCard, AlertTriangle, CheckCircle2, Eye, CornerDownLeft, Download } from 'lucide-react'
import api from '../../services/api.js'
import { downloadCsvFromRows } from '../../utils/exportCsv.js'

const ISSUE_TYPES = ['Privacy Concern', 'Payment Dispute', 'Technical Support', 'Inappropriate Content', 'Fake Profile']
const PRIORITIES   = ['HIGH', 'MEDIUM', 'LOW']
const STATUSES     = ['Open', 'Pending', 'Resolved', 'In process']

function rngFrom(id, arr) { return arr[id % arr.length] }

export default function NotificationCenter() {
  const [page, setPage] = useState(1)
  const navigate = useNavigate()
  const size = 8

  const { data: reports, isLoading } = useQuery({
    queryKey: ['reports', { page, size }],
    queryFn: () => api.get('/reports', { params: { page, size } }).then(r => r.data),
    keepPreviousData: true,
  })

  const { data: overview } = useQuery({
    queryKey: ['analytics', 'overview'],
    queryFn: () => api.get('/analytics/overview').then(r => r.data),
  })

  const totalPages = reports ? Math.max(1, Math.ceil(reports.total / size)) : 1

  const PRIORITY_CLS = {
    HIGH:   'priority-high',
    MEDIUM: 'priority-medium',
    LOW:    'priority-low',
  }

  const STATUS_CLS = {
    Open:       'text-orange-600',
    Pending:    'text-amber-600',
    Resolved:   'text-emerald-600',
    'In process': 'text-blue-600',
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Notification Center</h1>
        <p className="mt-1 text-sm text-gray-500">Monitor platform health, track financial alerts, and manage user disputes in real time to maintain the integrity of Tharamac Matrimony.</p>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="card p-5">
          <div className="flex items-start justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100">
              <Bell size={18} className="text-gray-600" />
            </div>
            <span className="text-[10px] text-gray-400">4 active alerts</span>
          </div>
          <p className="mt-3 text-xl font-bold text-gray-900">System</p>
          <p className="text-xs text-gray-400">Platform health</p>
        </div>
        <div className="card p-5">
          <div className="flex items-start justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50">
              <CreditCard size={18} className="text-amber-600" />
            </div>
            <span className="text-[10px] text-gray-400">12 pending</span>
          </div>
          <p className="mt-3 text-xl font-bold text-gray-900">Payments</p>
          <p className="text-xs text-gray-400">Pending Verifications</p>
        </div>
        <div className="card p-5">
          <div className="flex items-start justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50">
              <AlertTriangle size={18} className="text-red-600" />
            </div>
            <span className="text-[10px] text-gray-400">{overview?.pending_reports ?? '—'} critical</span>
          </div>
          <p className="mt-3 text-xl font-bold text-gray-900">Complaints</p>
          <p className="text-xs text-gray-400">High Priority Disputes</p>
        </div>
        <div className="card p-5">
          <div className="flex items-start justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50">
              <CheckCircle2 size={18} className="text-emerald-600" />
            </div>
            <span className="text-xs font-bold text-emerald-600">↑ 2.1%</span>
          </div>
          <p className="mt-3 text-2xl font-bold text-gray-900">94.2%</p>
          <p className="text-xs text-gray-400">Resolution Rate</p>
        </div>
      </div>

      {/* Complaints table */}
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <h2 className="text-base font-semibold text-gray-900">Recent Complaints</h2>
          <div className="flex gap-2">
            <button
              type="button"
              className="btn-outline py-1.5 text-xs"
              onClick={() => downloadCsvFromRows('complaint_logs.csv', (reports?.items ?? []).map(r => ({
                id: r.id, reporter_id: r.reporter_id, reported_id: r.reported_id,
                reason: r.reason, status: r.status, created_at: r.created_at,
              })))}
            >
              <Download size={12} /> Export Logs
            </button>
            <button onClick={() => navigate('/admin/notifications')} className="btn-primary py-1.5 text-xs">View All</button>
          </div>
        </div>
        {isLoading ? (
          <div className="p-6 space-y-2">{[...Array(5)].map((_, i) => <div key={i} className="h-12 animate-pulse rounded-xl bg-gray-200" />)}</div>
        ) : (
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">
                <th className="px-6 py-3">Requester</th>
                <th className="px-6 py-3">Issue Type</th>
                <th className="px-6 py-3">Priority</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {(reports?.items ?? []).map(report => {
                const issueType = rngFrom(report.id, ISSUE_TYPES)
                const priority  = rngFrom(report.id + 1, PRIORITIES)
                const status    = rngFrom(report.id + 2, STATUSES)
                return (
                  <tr key={report.id} className="hover:bg-gray-50/50">
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-700">
                          {report.reporter_id}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">Member #{report.reporter_id}</p>
                          <p className="text-xs text-gray-400">Member ID: #{report.reporter_id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-3.5 text-gray-600">{issueType}</td>
                    <td className="px-6 py-3.5"><span className={PRIORITY_CLS[priority]}>{priority}</span></td>
                    <td className="px-6 py-3.5">
                      <span className={`flex items-center gap-1 text-xs font-medium ${STATUS_CLS[status]}`}>
                        <span className="h-1.5 w-1.5 rounded-full bg-current" />
                        {status}
                      </span>
                    </td>
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-2">
                        <button onClick={() => navigate(`/admin/notifications/${report.id}`)} className="text-gray-400 hover:text-brand-700">
                          <Eye size={15} />
                        </button>
                        <button onClick={() => navigate(`/admin/notifications/${report.id}`)} className="text-gray-400 hover:text-brand-700">
                          <CornerDownLeft size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
              {!reports?.items?.length && (
                <tr><td colSpan={5} className="px-6 py-8 text-center text-sm text-gray-400">No complaints found.</td></tr>
              )}
            </tbody>
          </table>
        )}
        <div className="flex items-center justify-between border-t border-gray-100 px-6 py-4 text-xs text-gray-500">
          <span>Showing {reports?.items?.length ?? 0} of {reports?.total ?? 0} critical disputes</span>
          <div className="flex gap-2">
            <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="hover:text-gray-800 disabled:opacity-40">Previous</button>
            <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="hover:text-gray-800 disabled:opacity-40">Next</button>
          </div>
        </div>
      </div>

      {/* Info cards */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="card p-5">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-amber-50">
              <AlertTriangle size={16} className="text-amber-600" />
            </div>
            <div>
              <p className="font-semibold text-gray-900">Security Protocol Active</p>
              <p className="mt-1 text-xs text-gray-500">Multi-layer encryption is currently monitoring all connections. Standard communication protocols are active. 2FA required for sensitive data access.</p>
            </div>
          </div>
        </div>
        <div className="card p-5">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-emerald-50">
              <CheckCircle2 size={16} className="text-emerald-600" />
            </div>
            <div>
              <p className="font-semibold text-gray-900">Audit Logs Ready</p>
              <p className="mt-1 text-xs text-gray-500">Your compliance audit is scheduled. Last audit was completed 3 days ago by Admin #1. Review logs in the Audit section.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
