import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import PageWrapper from '../../components/layout/PageWrapper.jsx'
import api from '../../services/api.js'

const RESOURCE_TYPE_OPTIONS = [
  { value: '', label: 'All resource types' },
  { value: 'admin_user', label: 'Admin User' },
  { value: 'member', label: 'Member' },
  { value: 'report', label: 'Report' },
  { value: 'subscription', label: 'Subscription' },
  { value: 'notification', label: 'Notification' },
  { value: 'settings', label: 'Settings' },
]

export default function AuditLogsList() {
  const [page, setPage] = useState(1)
  const [resourceType, setResourceType] = useState('')
  const [adminIdInput, setAdminIdInput] = useState('')
  const [adminId, setAdminId] = useState(null)
  const size = 20

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['audit-logs', { page, resourceType, adminId }],
    queryFn: () =>
      api
        .get('/audit/logs', {
          params: {
            page,
            size,
            ...(resourceType ? { resource_type: resourceType } : {}),
            ...(adminId ? { admin_id: adminId } : {}),
          },
        })
        .then((res) => res.data),
    keepPreviousData: true,
  })

  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.size)) : 1

  function handleApplyAdminId(event) {
    event.preventDefault()
    const trimmed = adminIdInput.trim()
    setAdminId(trimmed ? Number(trimmed) : null)
    setPage(1)
  }

  function handleClearFilters() {
    setResourceType('')
    setAdminIdInput('')
    setAdminId(null)
    setPage(1)
  }

  const hasActiveFilters = Boolean(resourceType || adminId)

  return (
    <PageWrapper title="Audit Logs" breadcrumbs={[{ label: 'Dashboard', to: '/' }, { label: 'Audit Logs' }]}>
      <div className="mb-4 flex flex-wrap items-end gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-900">
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">Resource type</label>
          <select
            value={resourceType}
            onChange={(e) => {
              setResourceType(e.target.value)
              setPage(1)
            }}
            className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
          >
            {RESOURCE_TYPE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <form onSubmit={handleApplyAdminId} className="flex items-end gap-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">Admin ID</label>
            <input
              type="number"
              min="1"
              value={adminIdInput}
              onChange={(e) => setAdminIdInput(e.target.value)}
              placeholder="e.g. 1"
              className="w-28 rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
            />
          </div>
          <button
            type="submit"
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-800"
          >
            Apply
          </button>
        </form>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={handleClearFilters}
            className="rounded-lg px-3 py-1.5 text-sm font-medium text-primary-600 hover:bg-primary-50 dark:text-primary-400 dark:hover:bg-primary-950/40"
          >
            Clear filters
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-10 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-800" />
          ))}
        </div>
      ) : isError ? (
        <p className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
          {error.response?.data?.detail || 'Failed to load audit logs.'}
        </p>
      ) : (
        <>
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-900">
            <table className="min-w-full divide-y divide-gray-200 text-sm dark:divide-gray-800">
              <thead className="bg-gray-50 text-left text-xs font-semibold uppercase text-gray-500 dark:bg-gray-800/60 dark:text-gray-400">
                <tr>
                  <th className="px-4 py-3">Admin</th>
                  <th className="px-4 py-3">Action</th>
                  <th className="px-4 py-3">Resource</th>
                  <th className="px-4 py-3">IP</th>
                  <th className="px-4 py-3">When</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {data.items.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="px-4 py-3 text-gray-900 dark:text-gray-100">{log.admin_id ? `#${log.admin_id}` : '—'}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{log.action}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                      {log.resource_type}
                      {log.resource_id ? ` #${log.resource_id}` : ''}
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{log.ip_address || '—'}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{new Date(log.created_at).toLocaleString()}</td>
                  </tr>
                ))}
                {data.items.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-center text-gray-500 dark:text-gray-400">
                      No audit log entries found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
            <span>
              Page {data.page} of {totalPages} · {data.total} entries
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
