import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import PageWrapper from '../../components/layout/PageWrapper.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import { hasPermission } from '../../utils/permissions.js'
import api from '../../services/api.js'

const STATUS_BADGES = {
  pending: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300',
  reviewed: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  resolved: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
  dismissed: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
}

const STATUS_OPTIONS = ['pending', 'reviewed', 'resolved', 'dismissed']

// Actions available depending on the report's current status.
const NEXT_ACTIONS = {
  pending: [
    { action: 'review', label: 'Mark reviewed' },
    { action: 'dismiss', label: 'Dismiss' },
  ],
  reviewed: [
    { action: 'resolve', label: 'Resolve' },
    { action: 'dismiss', label: 'Dismiss' },
  ],
  resolved: [],
  dismissed: [],
}

function exportToCsv(filename, rows, columns) {
  const header = columns.map((col) => col.label).join(',')
  const lines = rows.map((row) =>
    columns
      .map((col) => {
        const value = col.value(row)
        const text = value === null || value === undefined ? '' : String(value)
        return `"${text.replace(/"/g, '""')}"`
      })
      .join(','),
  )
  const csv = [header, ...lines].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', filename)
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

export default function ReportsList() {
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState('')
  const [actionMessage, setActionMessage] = useState('')
  const size = 20

  const { role } = useAuth()
  const queryClient = useQueryClient()
  const canAct = hasPermission(role, 'reports.write')

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['reports', { page, statusFilter }],
    queryFn: () => api.get('/reports', { params: { page, size, status: statusFilter || undefined } }).then((res) => res.data),
    keepPreviousData: true,
  })

  const actionMutation = useMutation({
    mutationFn: ({ reportId, action }) => api.put(`/reports/${reportId}/action`, { action }).then((res) => res.data),
    onSuccess: (updated) => {
      setActionMessage(`Report #${updated.id} marked as "${updated.status}".`)
      queryClient.invalidateQueries({ queryKey: ['reports'] })
    },
    onError: (err) => setActionMessage(err.response?.data?.detail || 'Failed to update report.'),
  })

  function handleExport() {
    if (!data?.items?.length) return
    exportToCsv('reports.csv', data.items, [
      { label: 'Report ID', value: (row) => row.id },
      { label: 'Reason', value: (row) => row.reason },
      { label: 'Reporter ID', value: (row) => row.reporter_id },
      { label: 'Reported ID', value: (row) => row.reported_id },
      { label: 'Status', value: (row) => row.status },
      { label: 'Created At', value: (row) => row.created_at },
    ])
  }

  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.size)) : 1

  return (
    <PageWrapper title="Reports" breadcrumbs={[{ label: 'Dashboard', to: '/' }, { label: 'Reports' }]}>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <select
          value={statusFilter}
          onChange={(event) => {
            setStatusFilter(event.target.value)
            setPage(1)
          }}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
        >
          <option value="">All statuses</option>
          {STATUS_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>

        <button
          type="button"
          onClick={handleExport}
          disabled={!data?.items?.length}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-800"
        >
          Export CSV
        </button>
      </div>

      {actionMessage && (
        <p className="mb-4 rounded-lg bg-gray-50 px-3 py-2 text-sm text-gray-700 dark:bg-gray-800 dark:text-gray-300">{actionMessage}</p>
      )}

      {isLoading ? (
        <div className="space-y-2">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-10 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-800" />
          ))}
        </div>
      ) : isError ? (
        <p className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
          {error.response?.data?.detail || 'Failed to load reports.'}
        </p>
      ) : (
        <>
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-900">
            <table className="min-w-full divide-y divide-gray-200 text-sm dark:divide-gray-800">
              <thead className="bg-gray-50 text-left text-xs font-semibold uppercase text-gray-500 dark:bg-gray-800/60 dark:text-gray-400">
                <tr>
                  <th className="px-4 py-3">Reason</th>
                  <th className="px-4 py-3">Reporter</th>
                  <th className="px-4 py-3">Reported</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Created</th>
                  {canAct && <th className="px-4 py-3">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {data.items.map((report) => {
                  const nextActions = NEXT_ACTIONS[report.status] || []
                  const isMutatingThis = actionMutation.isPending && actionMutation.variables?.reportId === report.id
                  return (
                    <tr key={report.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">{report.reason}</td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-300">#{report.reporter_id}</td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-300">#{report.reported_id}</td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-2 py-1 text-xs font-medium ${STATUS_BADGES[report.status] || 'bg-gray-100 text-gray-700'}`}>
                          {report.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{new Date(report.created_at).toLocaleDateString()}</td>
                      {canAct && (
                        <td className="px-4 py-3">
                          {nextActions.length === 0 ? (
                            <span className="text-xs text-gray-400 dark:text-gray-500">No actions</span>
                          ) : (
                            <div className="flex flex-wrap gap-2">
                              {nextActions.map(({ action, label }) => (
                                <button
                                  key={action}
                                  type="button"
                                  disabled={isMutatingThis}
                                  onClick={() => {
                                    setActionMessage('')
                                    actionMutation.mutate({ reportId: report.id, action })
                                  }}
                                  className="rounded-lg border border-gray-300 px-2.5 py-1 text-xs font-medium text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-800"
                                >
                                  {isMutatingThis ? 'Saving…' : label}
                                </button>
                              ))}
                            </div>
                          )}
                        </td>
                      )}
                    </tr>
                  )
                })}
                {data.items.length === 0 && (
                  <tr>
                    <td colSpan={canAct ? 6 : 5} className="px-4 py-6 text-center text-gray-500 dark:text-gray-400">
                      No reports found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
            <span>
              Page {data.page} of {totalPages} · {data.total} reports
            </span>
            <div className="space-x-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="rounded-lg border border-gray-300 px-3 py-1.5 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:text-gray-200"
              >
                Previous
              </button>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="rounded-lg border border-gray-300 px-3 py-1.5 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:text-gray-200"
              >
                Next
              </button>
            </div>
          </div>
        </>
      )}
    </PageWrapper>
  )
}
