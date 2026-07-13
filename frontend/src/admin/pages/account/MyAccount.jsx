import { useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import PageWrapper from '../../components/layout/PageWrapper.jsx'
import { useTheme } from '../../context/ThemeContext.jsx'
import api from '../../services/api.js'

const ROLE_BADGES = {
  super_admin: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
  moderator: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  viewer: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
}

export default function MyAccount() {
  const { theme, toggleTheme } = useTheme()

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [formError, setFormError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  const { data: me, isLoading, isError, error } = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: () => api.get('/auth/me').then((res) => res.data),
  })

  const changePasswordMutation = useMutation({
    mutationFn: () => api.put('/auth/me/password', { current_password: currentPassword, new_password: newPassword }),
    onSuccess: () => {
      setSuccessMessage('Password changed successfully.')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setFormError('')
    },
    onError: (err) => setFormError(err.response?.data?.detail || 'Failed to change password.'),
  })

  function handleSubmit(event) {
    event.preventDefault()
    setSuccessMessage('')
    setFormError('')

    if (!currentPassword || !newPassword || !confirmPassword) {
      setFormError('All fields are required.')
      return
    }
    if (newPassword.length < 6) {
      setFormError('New password must be at least 6 characters.')
      return
    }
    if (newPassword !== confirmPassword) {
      setFormError('New password and confirmation do not match.')
      return
    }

    changePasswordMutation.mutate()
  }

  return (
    <PageWrapper
      title="My Account"
      breadcrumbs={[{ label: 'Dashboard', to: '/' }, { label: 'My Account' }]}
      isLoading={isLoading}
      error={isError ? { message: error.response?.data?.detail || 'Failed to load account info.' } : null}
    >
      {me && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-900">
            <h2 className="mb-4 text-base font-semibold text-gray-900 dark:text-gray-100">Profile</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Name</span>
                <span className="font-medium text-gray-900 dark:text-gray-100">{me.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Email</span>
                <span className="font-medium text-gray-900 dark:text-gray-100">{me.email}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500 dark:text-gray-400">Role</span>
                <span className={`rounded-full px-2 py-1 text-xs font-medium ${ROLE_BADGES[me.role] || 'bg-gray-100 text-gray-700'}`}>
                  {me.role}
                </span>
              </div>
            </div>

            <div className="mt-6 border-t border-gray-100 pt-4 dark:border-gray-800">
              <h3 className="mb-2 text-sm font-semibold text-gray-900 dark:text-gray-100">Appearance</h3>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-300">Theme</span>
                <button
                  type="button"
                  onClick={toggleTheme}
                  className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-800"
                >
                  {theme === 'dark' ? '☀️ Switch to light' : '🌙 Switch to dark'}
                </button>
              </div>
            </div>
          </section>

          <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-900">
            <h2 className="mb-4 text-base font-semibold text-gray-900 dark:text-gray-100">Change password</h2>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Current password</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">New password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Confirm new password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                />
              </div>

              {formError && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">{formError}</p>}
              {successMessage && (
                <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700 dark:bg-green-950/40 dark:text-green-300">{successMessage}</p>
              )}

              <button
                type="submit"
                disabled={changePasswordMutation.isPending}
                className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {changePasswordMutation.isPending ? 'Saving…' : 'Update password'}
              </button>
            </form>
          </section>
        </div>
      )}
    </PageWrapper>
  )
}
