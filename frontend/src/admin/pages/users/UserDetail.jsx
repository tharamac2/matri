import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
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

function InfoRow({ label, value }) {
  return (
    <div className="flex justify-between gap-4 py-2 text-sm">
      <span className="text-gray-500 dark:text-gray-400">{label}</span>
      <span className="text-right font-medium text-gray-900 dark:text-gray-100">{value ?? '—'}</span>
    </div>
  )
}

function formatPrefKey(key) {
  return key
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

function formatPrefValue(value) {
  if (value === null || value === undefined || value === '') return '—'
  if (Array.isArray(value)) return value.join(', ')
  return String(value)
}

const ACTIVITY_PAGE_SIZE = 10

function ActivityTimeline({ userId }) {
  const [page, setPage] = useState(1)

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['user-activity', userId, page],
    queryFn: () =>
      api.get(`/users/${userId}/activity`, { params: { page, size: ACTIVITY_PAGE_SIZE } }).then((res) => res.data),
    keepPreviousData: true,
  })

  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.size)) : 1

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-900">
      <h2 className="mb-4 text-base font-semibold text-gray-900 dark:text-gray-100">Activity timeline</h2>

      {isLoading ? (
        <div className="space-y-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-10 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-800" />
          ))}
        </div>
      ) : isError ? (
        <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
          {error.response?.data?.detail || 'Failed to load activity.'}
        </p>
      ) : data.items.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">No activity recorded for this member yet.</p>
      ) : (
        <>
          <ul className="divide-y divide-gray-100 dark:divide-gray-800">
            {data.items.map((entry) => (
              <li key={entry.id} className="flex items-start justify-between gap-4 py-2.5 text-sm">
                <div>
                  <p className="font-medium text-gray-900 dark:text-gray-100">{entry.action}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {[entry.device, entry.ip_address].filter(Boolean).join(' · ') || '—'}
                  </p>
                </div>
                <span className="whitespace-nowrap text-xs text-gray-400 dark:text-gray-500">
                  {new Date(entry.created_at).toLocaleString()}
                </span>
              </li>
            ))}
          </ul>

          {totalPages > 1 && (
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
          )}
        </>
      )}
    </section>
  )
}

export default function UserDetail() {
  const { userId } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { role } = useAuth()

  const [selectedStatus, setSelectedStatus] = useState('')
  const [actionMessage, setActionMessage] = useState('')
  const [confirmingDelete, setConfirmingDelete] = useState(false)

  const { data: member, isLoading, isError, error } = useQuery({
    queryKey: ['user', userId],
    queryFn: () => api.get(`/users/${userId}`).then((res) => res.data),
  })

  const statusMutation = useMutation({
    mutationFn: (newStatus) => api.put(`/users/${userId}/status`, { status: newStatus }).then((res) => res.data),
    onSuccess: (updated) => {
      queryClient.setQueryData(['user', userId], (prev) => (prev ? { ...prev, status: updated.status } : prev))
      queryClient.invalidateQueries({ queryKey: ['users'] })
      setActionMessage(`Status updated to "${updated.status}".`)
      setSelectedStatus('')
    },
    onError: (err) => setActionMessage(err.response?.data?.detail || 'Failed to update status.'),
  })

  const deleteMutation = useMutation({
    mutationFn: () => api.delete(`/users/${userId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      navigate('/users', { replace: true })
    },
    onError: (err) => setActionMessage(err.response?.data?.detail || 'Failed to delete member.'),
  })

  const canWrite = hasPermission(role, 'users.write')
  const canDelete = hasPermission(role, 'users.delete') || role === 'super_admin'

  return (
    <PageWrapper
      title="Member details"
      breadcrumbs={[{ label: 'Dashboard', to: '/' }, { label: 'Users', to: '/users' }, { label: member?.name || `#${userId}` }]}
      isLoading={isLoading}
      error={isError ? { message: error.response?.data?.detail || 'Failed to load member.' } : null}
    >
      {member && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-900">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">Profile</h2>
                <span className={`rounded-full px-2 py-1 text-xs font-medium ${STATUS_BADGES[member.status] || 'bg-gray-100 text-gray-700'}`}>
                  {member.status}
                </span>
              </div>
              <div className="flex items-start gap-4">
                {member.photo_url && (
                  <img
                    src={member.photo_url}
                    alt={member.name}
                    className="h-20 w-20 flex-shrink-0 rounded-full border border-gray-200 object-cover dark:border-gray-700"
                  />
                )}
                <div className="flex-1 divide-y divide-gray-100 dark:divide-gray-800">
                  <InfoRow label="Name" value={member.name} />
                  <InfoRow label="Email" value={member.email} />
                  <InfoRow label="Phone" value={member.phone} />
                  <InfoRow label="Gender" value={member.gender} />
                  <InfoRow label="Date of birth" value={member.dob} />
                  <InfoRow label="Religion" value={member.religion} />
                  <InfoRow label="Caste" value={member.caste} />
                  <InfoRow label="Location" value={[member.city, member.state].filter(Boolean).join(', ')} />
                  <InfoRow label="Joined" value={new Date(member.created_at).toLocaleString()} />
                  <InfoRow label="Last active" value={member.last_active ? new Date(member.last_active).toLocaleString() : '—'} />
                </div>
              </div>
            </section>

            {(member.bio || member.education || member.profession) && (
              <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-900">
                <h2 className="mb-4 text-base font-semibold text-gray-900 dark:text-gray-100">Matrimony profile</h2>
                {member.bio && <p className="mb-4 text-sm text-gray-600 dark:text-gray-300">{member.bio}</p>}
                <div className="divide-y divide-gray-100 dark:divide-gray-800">
                  <InfoRow label="Education" value={member.education} />
                  <InfoRow label="Profession" value={member.profession} />
                  <InfoRow label="Height (cm)" value={member.height_cm} />
                  <InfoRow label="Income (LPA)" value={member.income_lpa != null ? `₹${member.income_lpa}` : null} />
                  <InfoRow label="Photo status" value={member.photo_status} />
                </div>
              </section>
            )}

            <ActivityTimeline userId={userId} />
          </div>

          <div className="space-y-6">
            {member.partner_prefs && Object.keys(member.partner_prefs).length > 0 && (
              <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-900">
                <h2 className="mb-4 text-base font-semibold text-gray-900 dark:text-gray-100">Partner preferences</h2>
                <div className="divide-y divide-gray-100 dark:divide-gray-800">
                  {Object.entries(member.partner_prefs).map(([key, value]) => (
                    <InfoRow key={key} label={formatPrefKey(key)} value={formatPrefValue(value)} />
                  ))}
                </div>
              </section>
            )}

            <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-900">
              <h2 className="mb-4 text-base font-semibold text-gray-900 dark:text-gray-100">Actions</h2>

              {actionMessage && (
                <p className="mb-3 rounded-lg bg-gray-50 px-3 py-2 text-sm text-gray-700 dark:bg-gray-800 dark:text-gray-300">{actionMessage}</p>
              )}

              {canWrite ? (
                <div className="space-y-3">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Change status</label>
                    <div className="flex gap-2">
                      <select
                        value={selectedStatus}
                        onChange={(event) => setSelectedStatus(event.target.value)}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
                      >
                        <option value="">Select status…</option>
                        {STATUS_OPTIONS.filter((option) => option !== member.status).map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        disabled={!selectedStatus || statusMutation.isPending}
                        onClick={() => statusMutation.mutate(selectedStatus)}
                        className="whitespace-nowrap rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {statusMutation.isPending ? 'Saving…' : 'Apply'}
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400">You don't have permission to modify this member.</p>
              )}

              {canDelete && (
                <div className="mt-5 border-t border-gray-100 pt-4 dark:border-gray-800">
                  {confirmingDelete ? (
                    <div className="space-y-2">
                      <p className="text-sm text-red-700 dark:text-red-300">This permanently deletes the member. Are you sure?</p>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          disabled={deleteMutation.isPending}
                          onClick={() => deleteMutation.mutate()}
                          className="rounded-lg bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60"
                        >
                          {deleteMutation.isPending ? 'Deleting…' : 'Yes, delete'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmingDelete(false)}
                          className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-800"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmingDelete(true)}
                      className="rounded-lg border border-red-200 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50 dark:border-red-900 dark:text-red-300 dark:hover:bg-red-950/40"
                    >
                      Delete member
                    </button>
                  )}
                </div>
              )}
            </section>

            <Link to="/users" className="inline-block text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300">
              ← Back to all members
            </Link>
          </div>
        </div>
      )}
    </PageWrapper>
  )
}
