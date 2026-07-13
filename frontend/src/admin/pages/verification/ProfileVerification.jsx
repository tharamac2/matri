import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { ShieldCheck, Eye, CheckCircle, XCircle } from 'lucide-react'
import api from '../../services/api.js'

const TABS = ['All Submissions', 'Photo Verification', 'ID Verification']

function TrustScore({ score }) {
  const color = score >= 80 ? 'bg-emerald-100 text-emerald-700' : score >= 50 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
  return <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${color}`}>{score}%</span>
}

export default function ProfileVerification() {
  const [tab, setTab] = useState(0)
  const [page, setPage] = useState(1)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [statusFilter, setStatusFilter] = useState('')
  const queryClient = useQueryClient()
  const size = 10

  const isIdTab = tab === 2
  const endpoint = isIdTab ? '/moderation/id-documents' : '/moderation/photos'

  const { data, isLoading, isError } = useQuery({
    queryKey: ['moderation', isIdTab ? 'id-documents' : 'photos', { page, all: tab === 0, statusFilter }],
    queryFn: () => api.get(endpoint, {
      params: { page, size, status: statusFilter || (tab === 0 ? undefined : 'pending') }
    }).then(r => r.data),
    keepPreviousData: true,
  })

  const decisionMutation = useMutation({
    mutationFn: ({ memberId, status }) => api.put(`${endpoint}/${memberId}`, { status }).then(r => r.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['moderation'] }),
  })

  const totalPages = data ? Math.max(1, Math.ceil(data.total / size)) : 1

  const STATUS_STYLE = {
    pending:  'border border-amber-200 bg-amber-50 text-amber-700',
    approved: 'bg-emerald-50 text-emerald-700',
    rejected: 'bg-red-50 text-red-700',
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Verification Center</h1>
          <p className="mt-1 text-sm text-gray-500">Upholding the standard of excellence for Tharamac Matrimony members.</p>
        </div>
        <div className="flex gap-4">
          <div className="card flex items-center gap-3 px-5 py-3.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50">
              <ShieldCheck size={18} className="text-brand-700" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wide text-gray-400">Pending Tasks</p>
              <p className="text-lg font-bold text-gray-900">{data?.total ?? '—'} Requests</p>
            </div>
          </div>
          <div className="card flex items-center gap-3 px-5 py-3.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50">
              <CheckCircle size={18} className="text-amber-600" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wide text-gray-400">Approval Rate</p>
              <p className="text-lg font-bold text-gray-900">92.4%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex items-center gap-1 border-b border-gray-200">
        {TABS.map((t, i) => (
          <button key={t} type="button" onClick={() => { setTab(i); setPage(1) }}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${i === tab ? 'border-brand-700 text-brand-700' : 'border-transparent text-gray-500 hover:text-gray-800'}`}>
            {t}
          </button>
        ))}
        <button
          type="button"
          className="ml-auto text-xs font-medium text-gray-400 hover:text-gray-600 pb-2"
          onClick={() => setShowAdvanced((v) => !v)}
        >
          Advanced Filters
        </button>
      </div>

      {showAdvanced && (
        <div className="card flex items-center gap-3 p-4">
          <label className="text-xs font-medium text-gray-500">Photo status</label>
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
            className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-100"
          >
            <option value="">All statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      )}

      {/* Table */}
      {isLoading ? (
        <div className="space-y-2">{[...Array(5)].map((_, i) => <div key={i} className="h-16 animate-pulse rounded-xl bg-gray-200" />)}</div>
      ) : isError ? (
        <p className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">Failed to load verification queue.</p>
      ) : (
        <div className="card overflow-hidden">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">
                <th className="px-6 py-3">Member Details</th>
                <th className="px-6 py-3">Document Type</th>
                <th className="px-6 py-3">Trust Score</th>
                <th className="px-6 py-3">Submission Date</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {data.items.map(item => {
                const docUrl = isIdTab ? item.id_document_url : item.photo_url
                const docStatus = isIdTab ? item.id_verification_status : item.photo_status
                return (
                <tr key={item.member_id} className="hover:bg-gray-50/50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {!isIdTab && docUrl
                        ? <img src={docUrl} alt="" className="h-10 w-10 rounded-full object-cover" />
                        : <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-100 font-bold text-brand-700">{item.member_name[0]}</div>
                      }
                      <div>
                        <p className="font-semibold text-gray-900">{item.member_name}</p>
                        <p className="text-xs text-gray-400">{item.member_email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-medium text-gray-800">{isIdTab ? 'Government ID' : 'Profile Photo'}</p>
                    <p className="text-xs text-gray-400 uppercase tracking-wide">
                      {docStatus === 'pending' ? 'Pending Review' : docStatus === 'approved' ? 'Verified' : 'Rejected'}
                    </p>
                    {isIdTab && docUrl && (
                      <a href={docUrl} target="_blank" rel="noreferrer" className="text-xs text-brand-700 hover:underline">View document</a>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <TrustScore score={Math.floor(60 + (item.member_id % 40))} />
                  </td>
                  <td className="px-6 py-4 text-gray-500 text-xs">
                    {new Date(item.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`rounded-full px-3 py-1 text-xs font-medium ${STATUS_STYLE[docStatus] ?? ''}`}>
                      {docStatus === 'pending' ? '● Pending Review' : docStatus === 'approved' ? '● Approved' : '● Rejected'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {docStatus === 'approved' ? (
                      <span className="text-xs text-gray-400">View History</span>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Link to={`/admin/members/${item.member_id}`} className="text-gray-400 hover:text-brand-700">
                          <Eye size={16} />
                        </Link>
                        <button type="button" disabled={decisionMutation.isPending}
                          onClick={() => decisionMutation.mutate({ memberId: item.member_id, status: 'approved' })}
                          className="text-emerald-500 hover:text-emerald-700 disabled:opacity-40">
                          <CheckCircle size={16} />
                        </button>
                        <button type="button" disabled={decisionMutation.isPending}
                          onClick={() => decisionMutation.mutate({ memberId: item.member_id, status: 'rejected' })}
                          className="text-red-400 hover:text-red-600 disabled:opacity-40">
                          <XCircle size={16} />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              )})}
              {data.items.length === 0 && (
                <tr><td colSpan={6} className="px-6 py-10 text-center text-sm text-gray-400">No submissions found.</td></tr>
              )}
            </tbody>
          </table>
          <div className="flex items-center justify-between border-t border-gray-100 px-6 py-4 text-xs text-gray-500">
            <span>Showing 1–{data.items.length} of {data.total} requests</span>
            <div className="flex items-center gap-1">
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
      )}
    </div>
  )
}
