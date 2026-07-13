import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import PageWrapper from '../../components/layout/PageWrapper.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import { hasPermission } from '../../utils/permissions.js'
import api from '../../services/api.js'

const STATUS_BADGES = {
  active: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
  inactive: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  banned: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  pending: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300',
}

const STATUS_OPTIONS = ['active', 'inactive', 'banned', 'pending']
const GENDER_OPTIONS = ['male', 'female']
const BULK_ACTIONS = [
  { value: 'active', label: 'Set status: Active' },
  { value: 'inactive', label: 'Set status: Inactive' },
  { value: 'banned', label: 'Set status: Banned' },
  { value: 'delete', label: 'Delete selected' },
]

export default function UsersList() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [genderFilter, setGenderFilter] = useState('')
  const [selected, setSelected] = useState([])
  const [bulkAction, setBulkAction] = useState('')
  const [bulkMessage, setBulkMessage] = useState('')
  const size = 20

  const { role } = useAuth()
  const queryClient = useQueryClient()
  const canWrite = hasPermission(role, 'users.write')

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['users', { page, search, statusFilter, genderFilter }],
    queryFn: () =>
      api
        .get('/users', {
          params: {
            page,
            size,
            search: search || undefined,
            status: statusFilter || undefined,
            gender: genderFilter || undefined,
          },
        })
        .then((res) => res.data),
    keepPreviousData: true,
  })

  const bulkMutation = useMutation({
    mutationFn: ({ member_ids, action }) => api.post('/users/bulk-action', { member_ids, action }).then((res) => res.data),
    onSuccess: (result) => {
      setBulkMessage(`Applied "${result.action}" to ${result.updated} member(s).`)
      setSelected([])
      setBulkAction('')
      queryClient.invalidateQueries({ queryKey: ['users'] })
    },
    onError: (err) => setBulkMessage(err.response?.data?.detail || 'Bulk action failed.'),
  })

  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.size)) : 1
  const allOnPageSelected = data?.items?.length > 0 && data.items.every((member) => selected.includes(member.id))

  function toggleSelectAll() {
    if (!data) return
    if (allOnPageSelected) {
      setSelected((prev) => prev.filter((id) => !data.items.some((member) => member.id === id)))
    } else {
      setSelected((prev) => Array.from(new Set([...prev, ...data.items.map((member) => member.id)])))
    }
  }

  function toggleSelectOne(id) {
    setSelected((prev) => (prev.includes(id) ? prev.filter((existing) => existing !== id) : [...prev, id]))
  }

  function applyBulkAction() {
    if (!bulkAction || selected.length === 0) return
    setBulkMessage('')
    bulkMutation.mutate({ member_ids: selected, action: bulkAction })
  }

  return (
    <PageWrapper title="Users" breadcrumbs={[{ label: 'Dashboard', to: '/' }, { label: 'Users' }]}>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <input
          type="search"
          value={search}
          onChange={(event) => {
            setSearch(event.target.value)
            setPage(1)
          }}
          placeholder="Search by name or email…"
          className="w-64 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
        />
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
        <select
          value={genderFilter}
          onChange={(event) => {
            setGenderFilter(event.target.value)
            setPage(1)
          }}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
        >
          <option value="">All genders</option>
          {GENDER_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        <a
          href="/api/v1/users/export"
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-800"
        >
          Export CSV
        </a>
      </div>

      {canWrite && selected.length > 0 && (
        <div className="mb-4 flex flex-wrap items-center gap-3 rounded-lg border border-primary-200 bg-primary-50 px-4 py-3 dark:border-primary-900 dark:bg-primary-950/40">
          <span className="text-sm font-medium text-primary-900 dark:text-primary-200">{selected.length} selected</span>
          <select
            value={bulkAction}
            onChange={(event) => setBulkAction(event.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
          >
            <option value="">Choose bulk action…</option>
            {BULK_ACTIONS.map((action) => (
              <option key={action.value} value={action.value}>
                {action.label}
              </option>
            ))}
          </select>
          <button
            type="button"
            disabled={!bulkAction || bulkMutation.isPending}
            onClick={applyBulkAction}
            className="rounded-lg bg-primary-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {bulkMutation.isPending ? 'Applying…' : 'Apply'}
          </button>
          <button type="button" onClick={() => setSelected([])} className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100">
            Clear selection
          </button>
        </div>
      )}

      {bulkMessage && <p className="mb-4 rounded-lg bg-gray-50 px-3 py-2 text-sm text-gray-700 dark:bg-gray-800 dark:text-gray-300">{bulkMessage}</p>}

      {isLoading ? (
        <div className="space-y-2">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-10 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-800" />
          ))}
        </div>
      ) : isError ? (
        <p className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
          {error.response?.data?.detail || 'Failed to load users.'}
        </p>
      ) : (
        <>
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-900">
            <table className="min-w-full divide-y divide-gray-200 text-sm dark:divide-gray-800">
              <thead className="bg-gray-50 text-left text-xs font-semibold uppercase text-gray-500 dark:bg-gray-800/60 dark:text-gray-400">
                <tr>
                  {canWrite && (
                    <th className="px-4 py-3">
                      <input type="checkbox" checked={allOnPageSelected} onChange={toggleSelectAll} aria-label="Select all on page" />
                    </th>
                  )}
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">City</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {data.items.map((member) => (
                  <tr key={member.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    {canWrite && (
                      <td className="px-4 py-3" onClick={(event) => event.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selected.includes(member.id)}
                          onChange={() => toggleSelectOne(member.id)}
                          aria-label={`Select ${member.name}`}
                        />
                      </td>
                    )}
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">
                      <Link to={`/users/${member.id}`} className="hover:text-primary-600 hover:underline dark:text-gray-100 dark:hover:text-primary-400">
                        {member.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{member.email}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{member.city || '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-1 text-xs font-medium ${STATUS_BADGES[member.status] || 'bg-gray-100 text-gray-700'}`}>
                        {member.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{new Date(member.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
                {data.items.length === 0 && (
                  <tr>
                    <td colSpan={canWrite ? 6 : 5} className="px-4 py-6 text-center text-gray-500 dark:text-gray-400">
                      No members found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
            <span>
              Page {data.page} of {totalPages} · {data.total} members
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
