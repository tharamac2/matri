import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import PageWrapper from '../../components/layout/PageWrapper.jsx'
import api from '../../services/api.js'

const STATUS_OPTIONS = ['pending', 'accepted', 'rejected', 'expired']

const STATUS_BADGES = {
  pending: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300',
  accepted: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
  rejected: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  expired: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
}

function MemberLink({ member }) {
  return (
    <Link to={`/users/${member.id}`} className="font-medium text-gray-900 hover:text-primary-600 hover:underline dark:text-gray-100 dark:hover:text-primary-400">
      {member.name}
    </Link>
  )
}

export default function MatchesList() {
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState('')
  const [memberIdInput, setMemberIdInput] = useState('')
  const [memberId, setMemberId] = useState('')
  const size = 20

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['matches', { page, statusFilter, memberId }],
    queryFn: () =>
      api
        .get('/matches', { params: { page, size, status: statusFilter || undefined, member_id: memberId || undefined } })
        .then((res) => res.data),
    keepPreviousData: true,
  })

  function applyMemberFilter(event) {
    event.preventDefault()
    setMemberId(memberIdInput.trim())
    setPage(1)
  }

  function clearFilters() {
    setStatusFilter('')
    setMemberIdInput('')
    setMemberId('')
    setPage(1)
  }

  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.size)) : 1
  const hasFilters = statusFilter || memberId

  return (
    <PageWrapper title="Matches" breadcrumbs={[{ label: 'Dashboard', to: '/' }, { label: 'Matches' }]}>
      <div className="mb-4 flex flex-wrap items-end gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">Status</label>
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
        </div>

        <form onSubmit={applyMemberFilter} className="flex items-end gap-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">Member ID</label>
            <input
              type="number"
              min={1}
              value={memberIdInput}
              onChange={(event) => setMemberIdInput(event.target.value)}
              placeholder="e.g. 12"
              className="w-32 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
            />
          </div>
          <button
            type="submit"
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-800"
          >
            Apply
          </button>
        </form>

        {hasFilters && (
          <button
            type="button"
            onClick={clearFilters}
            className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
          >
            Clear filters
          </button>
        )}

        {data && (
          <span className="ml-auto text-sm text-gray-500 dark:text-gray-400">
            {data.total} match{data.total === 1 ? '' : 'es'}
          </span>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-10 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-800" />
          ))}
        </div>
      ) : isError ? (
        <p className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
          {error.response?.data?.detail || 'Failed to load matches.'}
        </p>
      ) : (
        <>
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-900">
            <table className="min-w-full divide-y divide-gray-200 text-sm dark:divide-gray-800">
              <thead className="bg-gray-50 text-left text-xs font-semibold uppercase text-gray-500 dark:bg-gray-800/60 dark:text-gray-400">
                <tr>
                  <th className="px-4 py-3">Sender</th>
                  <th className="px-4 py-3">Receiver</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Sent</th>
                  <th className="px-4 py-3">Responded</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {data.items.map((match) => (
                  <tr key={match.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="px-4 py-3">
                      <MemberLink member={match.sender} />
                      <p className="text-xs text-gray-400 dark:text-gray-500">#{match.sender.id} · {match.sender.email}</p>
                    </td>
                    <td className="px-4 py-3">
                      <MemberLink member={match.receiver} />
                      <p className="text-xs text-gray-400 dark:text-gray-500">#{match.receiver.id} · {match.receiver.email}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-1 text-xs font-medium ${STATUS_BADGES[match.status] || 'bg-gray-100 text-gray-700'}`}>
                        {match.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{new Date(match.sent_at).toLocaleString()}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                      {match.responded_at ? new Date(match.responded_at).toLocaleString() : '—'}
                    </td>
                  </tr>
                ))}
                {data.items.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-center text-gray-500 dark:text-gray-400">
                      No matches found.
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
