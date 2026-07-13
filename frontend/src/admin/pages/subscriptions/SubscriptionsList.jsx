import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import PageWrapper from '../../components/layout/PageWrapper.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import { hasPermission } from '../../utils/permissions.js'
import api from '../../services/api.js'

const STATUS_BADGES = {
  active: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
  expired: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  cancelled: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
}

const STATUS_OPTIONS = ['active', 'expired', 'cancelled']

const EMPTY_PLAN_FORM = { name: '', price: '', duration_days: '', is_active: true }

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

export default function SubscriptionsList() {
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState('')
  const [actionMessage, setActionMessage] = useState('')
  const [showPlanForm, setShowPlanForm] = useState(false)
  const [planForm, setPlanForm] = useState(EMPTY_PLAN_FORM)
  const [planFormError, setPlanFormError] = useState('')
  const size = 10

  const { role } = useAuth()
  const queryClient = useQueryClient()
  const canCancel = hasPermission(role, 'subscriptions.write')
  const canManagePlans = role === 'super_admin'

  const plansQuery = useQuery({
    queryKey: ['subscriptions', 'plans'],
    queryFn: () => api.get('/subscriptions/plans').then((res) => res.data),
  })

  const subscribersQuery = useQuery({
    queryKey: ['subscriptions', 'subscribers', { page, statusFilter }],
    queryFn: () =>
      api
        .get('/subscriptions', { params: { page, size, status: statusFilter || undefined } })
        .then((res) => res.data),
    keepPreviousData: true,
  })

  const cancelMutation = useMutation({
    mutationFn: (subscriptionId) => api.put(`/subscriptions/${subscriptionId}/cancel`).then((res) => res.data),
    onSuccess: (updated) => {
      setActionMessage(`Subscription #${updated.id} cancelled.`)
      queryClient.invalidateQueries({ queryKey: ['subscriptions', 'subscribers'] })
    },
    onError: (err) => setActionMessage(err.response?.data?.detail || 'Failed to cancel subscription.'),
  })

  const createPlanMutation = useMutation({
    mutationFn: (payload) => api.post('/subscriptions/plans', payload).then((res) => res.data),
    onSuccess: (plan) => {
      setActionMessage(`Plan "${plan.name}" created.`)
      setPlanForm(EMPTY_PLAN_FORM)
      setPlanFormError('')
      setShowPlanForm(false)
      queryClient.invalidateQueries({ queryKey: ['subscriptions', 'plans'] })
    },
    onError: (err) => setPlanFormError(err.response?.data?.detail || 'Failed to create plan.'),
  })

  function handlePlanFormSubmit(event) {
    event.preventDefault()
    setPlanFormError('')

    const name = planForm.name.trim()
    const price = Number(planForm.price)
    const durationDays = Number(planForm.duration_days)

    if (!name) {
      setPlanFormError('Plan name is required.')
      return
    }
    if (!Number.isFinite(price) || price < 0) {
      setPlanFormError('Price must be a valid non-negative number.')
      return
    }
    if (!Number.isInteger(durationDays) || durationDays <= 0) {
      setPlanFormError('Duration (days) must be a positive whole number.')
      return
    }

    createPlanMutation.mutate({
      name,
      price,
      duration_days: durationDays,
      is_active: planForm.is_active,
    })
  }

  function handleExportSubscribers() {
    if (!subscribersQuery.data?.items?.length) return
    exportToCsv('subscribers.csv', subscribersQuery.data.items, [
      { label: 'Subscription ID', value: (row) => row.id },
      { label: 'Member ID', value: (row) => row.member_id },
      { label: 'Plan ID', value: (row) => row.plan_id },
      { label: 'Start Date', value: (row) => row.start_date },
      { label: 'End Date', value: (row) => row.end_date },
      { label: 'Status', value: (row) => row.status },
    ])
  }

  const totalPages = subscribersQuery.data
    ? Math.max(1, Math.ceil(subscribersQuery.data.total / subscribersQuery.data.size))
    : 1

  return (
    <PageWrapper title="Subscriptions" breadcrumbs={[{ label: 'Dashboard', to: '/' }, { label: 'Subscriptions' }]}>
      <section className="mb-8">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">Plans</h2>
          {canManagePlans && (
            <button
              type="button"
              onClick={() => {
                setShowPlanForm((prev) => !prev)
                setPlanFormError('')
              }}
              className="rounded-lg border border-primary-300 px-3 py-1.5 text-sm font-medium text-primary-700 hover:bg-primary-50 dark:border-primary-800 dark:text-primary-300 dark:hover:bg-primary-950/40"
            >
              {showPlanForm ? 'Cancel' : '+ Create plan'}
            </button>
          )}
        </div>

        {canManagePlans && showPlanForm && (
          <form
            onSubmit={handlePlanFormSubmit}
            className="mb-4 grid grid-cols-1 gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:grid-cols-2 lg:grid-cols-4 dark:border-gray-700 dark:bg-gray-900"
          >
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">Plan name</label>
              <input
                type="text"
                value={planForm.name}
                onChange={(e) => setPlanForm((prev) => ({ ...prev, name: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">Price (₹)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={planForm.price}
                onChange={(e) => setPlanForm((prev) => ({ ...prev, price: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">Duration (days)</label>
              <input
                type="number"
                min="1"
                step="1"
                value={planForm.duration_days}
                onChange={(e) => setPlanForm((prev) => ({ ...prev, duration_days: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
              />
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                <input
                  type="checkbox"
                  checked={planForm.is_active}
                  onChange={(e) => setPlanForm((prev) => ({ ...prev, is_active: e.target.checked }))}
                  className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                Active
              </label>
            </div>

            {planFormError && (
              <p className="col-span-full rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">{planFormError}</p>
            )}

            <div className="col-span-full">
              <button
                type="submit"
                disabled={createPlanMutation.isPending}
                className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {createPlanMutation.isPending ? 'Creating…' : 'Create plan'}
              </button>
            </div>
          </form>
        )}

        {plansQuery.isLoading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-28 animate-pulse rounded-xl bg-gray-200 dark:bg-gray-800" />
            ))}
          </div>
        ) : plansQuery.isError ? (
          <p className="text-sm text-red-700 dark:text-red-300">Failed to load plans.</p>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {plansQuery.data.map((plan) => (
              <div key={plan.id} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-900">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100">{plan.name}</h3>
                  {!plan.is_active && (
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-400">inactive</span>
                  )}
                </div>
                <p className="mt-2 text-2xl font-semibold text-gray-900 dark:text-gray-100">₹{plan.price}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{plan.duration_days} days</p>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">Subscribers</h2>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportSubscribers}
              disabled={!subscribersQuery.data?.items?.length}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-800"
            >
              Export CSV
            </button>
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
        </div>

        {actionMessage && (
          <p className="mb-3 rounded-lg bg-gray-50 px-3 py-2 text-sm text-gray-700 dark:bg-gray-800 dark:text-gray-300">{actionMessage}</p>
        )}

        {subscribersQuery.isLoading ? (
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-10 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-800" />
            ))}
          </div>
        ) : subscribersQuery.isError ? (
          <p className="text-sm text-red-700 dark:text-red-300">Failed to load subscribers.</p>
        ) : (
          <>
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-900">
              <table className="min-w-full divide-y divide-gray-200 text-sm dark:divide-gray-800">
                <thead className="bg-gray-50 text-left text-xs font-semibold uppercase text-gray-500 dark:bg-gray-800/60 dark:text-gray-400">
                  <tr>
                    <th className="px-4 py-3">Member</th>
                    <th className="px-4 py-3">Plan</th>
                    <th className="px-4 py-3">Start</th>
                    <th className="px-4 py-3">End</th>
                    <th className="px-4 py-3">Status</th>
                    {canCancel && <th className="px-4 py-3">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {subscribersQuery.data.items.map((sub) => {
                    const isMutatingThis = cancelMutation.isPending && cancelMutation.variables === sub.id
                    return (
                      <tr key={sub.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                        <td className="px-4 py-3 text-gray-900 dark:text-gray-100">#{sub.member_id}</td>
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-300">#{sub.plan_id}</td>
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{sub.start_date}</td>
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{sub.end_date}</td>
                        <td className="px-4 py-3">
                          <span className={`rounded-full px-2 py-1 text-xs font-medium ${STATUS_BADGES[sub.status] || 'bg-gray-100 text-gray-700'}`}>
                            {sub.status}
                          </span>
                        </td>
                        {canCancel && (
                          <td className="px-4 py-3">
                            {sub.status === 'active' ? (
                              <button
                                type="button"
                                disabled={isMutatingThis}
                                onClick={() => {
                                  setActionMessage('')
                                  cancelMutation.mutate(sub.id)
                                }}
                                className="rounded-lg border border-gray-300 px-2.5 py-1 text-xs font-medium text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-800"
                              >
                                {isMutatingThis ? 'Cancelling…' : 'Cancel'}
                              </button>
                            ) : (
                              <span className="text-xs text-gray-400 dark:text-gray-500">No actions</span>
                            )}
                          </td>
                        )}
                      </tr>
                    )
                  })}
                  {subscribersQuery.data.items.length === 0 && (
                    <tr>
                      <td colSpan={canCancel ? 6 : 5} className="px-4 py-6 text-center text-gray-500 dark:text-gray-400">
                        No subscribers found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="mt-4 flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
              <span>
                Page {subscribersQuery.data.page} of {totalPages} · {subscribersQuery.data.total} subscribers
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
      </section>
    </PageWrapper>
  )
}
