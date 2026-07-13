import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import PageWrapper from '../../components/layout/PageWrapper.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import { hasPermission } from '../../utils/permissions.js'
import api from '../../services/api.js'

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending review' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
]

const STATUS_BADGES = {
  pending: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300',
  approved: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
  rejected: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
}

function PhotoCardSkeleton() {
  return <div className="h-72 animate-pulse rounded-xl bg-gray-200 dark:bg-gray-800" />
}

export default function PhotoModerationQueue() {
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState('pending')
  const [message, setMessage] = useState('')
  const size = 12

  const { role } = useAuth()
  const queryClient = useQueryClient()
  const canModerate = hasPermission(role, 'moderation.write')

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['moderation', 'photos', { page, statusFilter }],
    queryFn: () =>
      api
        .get('/moderation/photos', { params: { page, size, status: statusFilter || undefined } })
        .then((res) => res.data),
    keepPreviousData: true,
  })

  const decisionMutation = useMutation({
    mutationFn: ({ memberId, status: newStatus }) =>
      api.put(`/moderation/photos/${memberId}`, { status: newStatus }).then((res) => res.data),
    onSuccess: (updated) => {
      setMessage(`${updated.member_name}'s photo marked as "${updated.photo_status}".`)
      queryClient.invalidateQueries({ queryKey: ['moderation', 'photos'] })
    },
    onError: (err) => setMessage(err.response?.data?.detail || 'Failed to update photo status.'),
  })

  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.size)) : 1

  return (
    <PageWrapper title="Photo Moderation" breadcrumbs={[{ label: 'Dashboard', to: '/' }, { label: 'Photo Moderation' }]}>
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
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {data && (
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {data.total} photo{data.total === 1 ? '' : 's'} {statusFilter ? `· ${STATUS_OPTIONS.find((o) => o.value === statusFilter)?.label.toLowerCase()}` : ''}
          </span>
        )}
      </div>

      {message && (
        <p className="mb-4 rounded-lg bg-gray-50 px-3 py-2 text-sm text-gray-700 dark:bg-gray-800 dark:text-gray-300">{message}</p>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[...Array(8)].map((_, i) => (
            <PhotoCardSkeleton key={i} />
          ))}
        </div>
      ) : isError ? (
        <p className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
          {error.response?.data?.detail || 'Failed to load photo queue.'}
        </p>
      ) : data.items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white p-10 text-center text-sm text-gray-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400">
          No photos {statusFilter ? `with status "${statusFilter}"` : ''} to show. The queue is clear.
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {data.items.map((item) => {
              const isMutatingThis = decisionMutation.isPending && decisionMutation.variables?.memberId === item.member_id
              return (
                <div
                  key={item.member_id}
                  className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-900"
                >
                  <div className="aspect-square w-full overflow-hidden bg-gray-100 dark:bg-gray-800">
                    {item.photo_url ? (
                      <img src={item.photo_url} alt={item.member_name} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-sm text-gray-400 dark:text-gray-500">No photo</div>
                    )}
                  </div>
                  <div className="space-y-2 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <Link
                        to={`/users/${item.member_id}`}
                        className="truncate text-sm font-semibold text-gray-900 hover:text-primary-600 hover:underline dark:text-gray-100 dark:hover:text-primary-400"
                        title={item.member_name}
                      >
                        {item.member_name}
                      </Link>
                      <span className={`whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_BADGES[item.photo_status] || 'bg-gray-100 text-gray-700'}`}>
                        {item.photo_status}
                      </span>
                    </div>
                    <p className="truncate text-xs text-gray-500 dark:text-gray-400" title={item.member_email}>
                      {item.member_email}
                    </p>
                    {canModerate && (
                      <div className="flex gap-2 pt-1">
                        <button
                          type="button"
                          disabled={isMutatingThis || item.photo_status === 'approved'}
                          onClick={() => {
                            setMessage('')
                            decisionMutation.mutate({ memberId: item.member_id, status: 'approved' })
                          }}
                          className="flex-1 rounded-lg bg-green-600 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {isMutatingThis && decisionMutation.variables?.status === 'approved' ? 'Saving…' : 'Approve'}
                        </button>
                        <button
                          type="button"
                          disabled={isMutatingThis || item.photo_status === 'rejected'}
                          onClick={() => {
                            setMessage('')
                            decisionMutation.mutate({ memberId: item.member_id, status: 'rejected' })
                          }}
                          className="flex-1 rounded-lg border border-red-200 px-2.5 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-red-900 dark:text-red-300 dark:hover:bg-red-950/40"
                        >
                          {isMutatingThis && decisionMutation.variables?.status === 'rejected' ? 'Saving…' : 'Reject'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          <div className="mt-6 flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
            <span>
              Page {data.page} of {totalPages} · {data.total} photos
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
