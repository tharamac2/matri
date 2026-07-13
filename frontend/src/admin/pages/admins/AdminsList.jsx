import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import PageWrapper from '../../components/layout/PageWrapper.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import api from '../../services/api.js'

const ROLE_BADGES = {
  super_admin: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
  moderator: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  viewer: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
}

const ROLE_OPTIONS = ['super_admin', 'moderator', 'viewer']

const EMPTY_FORM = { name: '', email: '', password: '', role: 'viewer' }

export default function AdminsList() {
  const { adminId, role: myRole } = useAuth()
  const queryClient = useQueryClient()
  const isSuperAdmin = myRole === 'super_admin'

  const [showCreateForm, setShowCreateForm] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [formError, setFormError] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [editRole, setEditRole] = useState('')
  const [confirmingDeleteId, setConfirmingDeleteId] = useState(null)
  const [message, setMessage] = useState('')

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['admins'],
    queryFn: () => api.get('/admins').then((res) => res.data),
  })

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['admins'] })

  const createMutation = useMutation({
    mutationFn: (payload) => api.post('/admins', payload).then((res) => res.data),
    onSuccess: (created) => {
      setMessage(`Admin "${created.name}" created.`)
      setForm(EMPTY_FORM)
      setShowCreateForm(false)
      setFormError('')
      invalidate()
    },
    onError: (err) => setFormError(err.response?.data?.detail || 'Failed to create admin.'),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }) => api.put(`/admins/${id}`, payload).then((res) => res.data),
    onSuccess: (updated) => {
      setMessage(`Admin "${updated.name}" updated.`)
      setEditingId(null)
      invalidate()
    },
    onError: (err) => setMessage(err.response?.data?.detail || 'Failed to update admin.'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/admins/${id}`),
    onSuccess: () => {
      setMessage('Admin deleted.')
      setConfirmingDeleteId(null)
      invalidate()
    },
    onError: (err) => setMessage(err.response?.data?.detail || 'Failed to delete admin.'),
  })

  function handleCreateSubmit(event) {
    event.preventDefault()
    setFormError('')
    if (!form.name.trim() || !form.email.trim() || !form.password) {
      setFormError('Name, email, and password are required.')
      return
    }
    if (form.password.length < 6) {
      setFormError('Password must be at least 6 characters.')
      return
    }
    createMutation.mutate(form)
  }

  function startEdit(admin) {
    setEditingId(admin.id)
    setEditRole(admin.role)
    setMessage('')
  }

  function toggleActive(admin) {
    setMessage('')
    updateMutation.mutate({ id: admin.id, payload: { is_active: !admin.is_active } })
  }

  function saveRole(admin) {
    if (editRole === admin.role) {
      setEditingId(null)
      return
    }
    setMessage('')
    updateMutation.mutate({ id: admin.id, payload: { role: editRole } })
  }

  return (
    <PageWrapper title="Admins" breadcrumbs={[{ label: 'Dashboard', to: '/' }, { label: 'Admins' }]}>
      {isSuperAdmin && (
        <div className="mb-6">
          {showCreateForm ? (
            <form onSubmit={handleCreateSubmit} className="max-w-xl space-y-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-900">
              <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">Add a new admin</h2>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <input
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="Full name"
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                />
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  placeholder="Email"
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                />
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                  placeholder="Temporary password"
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                />
                <select
                  value={form.role}
                  onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
                >
                  {ROLE_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
              {formError && <p className="text-sm text-red-700 dark:text-red-300">{formError}</p>}
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {createMutation.isPending ? 'Creating…' : 'Create admin'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateForm(false)
                    setForm(EMPTY_FORM)
                    setFormError('')
                  }}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-800"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <button
              type="button"
              onClick={() => setShowCreateForm(true)}
              className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
            >
              + Add admin
            </button>
          )}
        </div>
      )}

      {message && <p className="mb-4 rounded-lg bg-gray-50 px-3 py-2 text-sm text-gray-700 dark:bg-gray-800 dark:text-gray-300">{message}</p>}

      {isLoading ? (
        <div className="space-y-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-10 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-800" />
          ))}
        </div>
      ) : isError ? (
        <p className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
          {error.response?.data?.detail || 'Failed to load admins.'}
        </p>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-900">
          <table className="min-w-full divide-y divide-gray-200 text-sm dark:divide-gray-800">
            <thead className="bg-gray-50 text-left text-xs font-semibold uppercase text-gray-500 dark:bg-gray-800/60 dark:text-gray-400">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Last login</th>
                {isSuperAdmin && <th className="px-4 py-3">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {data?.map((admin) => {
                const isSelf = admin.id === adminId
                return (
                  <tr key={admin.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">
                      {admin.name} {isSelf && <span className="text-xs text-gray-400 dark:text-gray-500">(you)</span>}
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{admin.email}</td>
                    <td className="px-4 py-3">
                      {editingId === admin.id ? (
                        <div className="flex items-center gap-2">
                          <select
                            value={editRole}
                            onChange={(e) => setEditRole(e.target.value)}
                            className="rounded-lg border border-gray-300 px-2 py-1 text-xs focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
                          >
                            {ROLE_OPTIONS.map((option) => (
                              <option key={option} value={option}>
                                {option}
                              </option>
                            ))}
                          </select>
                          <button
                            type="button"
                            onClick={() => saveRole(admin)}
                            disabled={updateMutation.isPending}
                            className="rounded-lg bg-primary-600 px-2 py-1 text-xs font-medium text-white hover:bg-primary-700 disabled:opacity-60"
                          >
                            Save
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingId(null)}
                            className="rounded-lg border border-gray-300 px-2 py-1 text-xs text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-800"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <span className={`rounded-full px-2 py-1 text-xs font-medium ${ROLE_BADGES[admin.role] || 'bg-gray-100 text-gray-700'}`}>
                          {admin.role}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{admin.is_active ? 'Active' : 'Disabled'}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                      {admin.last_login ? new Date(admin.last_login).toLocaleString() : 'Never'}
                    </td>
                    {isSuperAdmin && (
                      <td className="px-4 py-3">
                        {confirmingDeleteId === admin.id ? (
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-red-700 dark:text-red-300">Delete?</span>
                            <button
                              type="button"
                              disabled={deleteMutation.isPending}
                              onClick={() => deleteMutation.mutate(admin.id)}
                              className="rounded-lg bg-red-600 px-2 py-1 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-60"
                            >
                              Yes
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmingDeleteId(null)}
                              className="rounded-lg border border-gray-300 px-2 py-1 text-xs text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-800"
                            >
                              No
                            </button>
                          </div>
                        ) : (
                          <div className="flex flex-wrap gap-2">
                            {editingId !== admin.id && (
                              <button
                                type="button"
                                onClick={() => startEdit(admin)}
                                className="rounded-lg border border-gray-300 px-2.5 py-1 text-xs font-medium text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-800"
                              >
                                Change role
                              </button>
                            )}
                            <button
                              type="button"
                              disabled={updateMutation.isPending}
                              onClick={() => toggleActive(admin)}
                              className="rounded-lg border border-gray-300 px-2.5 py-1 text-xs font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-800"
                            >
                              {admin.is_active ? 'Disable' : 'Enable'}
                            </button>
                            {!isSelf && (
                              <button
                                type="button"
                                onClick={() => setConfirmingDeleteId(admin.id)}
                                className="rounded-lg border border-red-200 px-2.5 py-1 text-xs font-medium text-red-700 hover:bg-red-50 dark:border-red-900 dark:text-red-300 dark:hover:bg-red-950/40"
                              >
                                Delete
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                    )}
                  </tr>
                )
              })}
              {data?.length === 0 && (
                <tr>
                  <td colSpan={isSuperAdmin ? 6 : 5} className="px-4 py-6 text-center text-gray-500 dark:text-gray-400">
                    No admins found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </PageWrapper>
  )
}
