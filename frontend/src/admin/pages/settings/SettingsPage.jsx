import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import PageWrapper from '../../components/layout/PageWrapper.jsx'
import api from '../../services/api.js'

export default function SettingsPage() {
  const queryClient = useQueryClient()
  const [form, setForm] = useState(null)

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['settings'],
    queryFn: () => api.get('/settings').then((res) => res.data),
  })

  useEffect(() => {
    if (data) setForm(data)
  }, [data])

  const saveMutation = useMutation({
    mutationFn: (payload) => api.put('/settings', payload).then((res) => res.data),
    onSuccess: (updated) => {
      queryClient.setQueryData(['settings'], updated)
    },
  })

  function handleChange(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function handleSubmit(event) {
    event.preventDefault()
    saveMutation.mutate(form)
  }

  return (
    <PageWrapper
      title="Settings"
      breadcrumbs={[{ label: 'Dashboard', to: '/' }, { label: 'Settings' }]}
      isLoading={isLoading || !form}
      error={isError ? error : null}
    >
      {form && (
        <form onSubmit={handleSubmit} className="max-w-xl space-y-4 rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Site name</label>
            <input
              value={form.site_name}
              onChange={(e) => handleChange('site_name', e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Support email</label>
            <input
              value={form.support_email}
              onChange={(e) => handleChange('support_email', e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Max photos per profile</label>
            <input
              type="number"
              min={1}
              value={form.max_photos_per_profile}
              onChange={(e) => handleChange('max_photos_per_profile', Number(e.target.value))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
            />
          </div>

          <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
            <input
              type="checkbox"
              checked={form.maintenance_mode}
              onChange={(e) => handleChange('maintenance_mode', e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            Maintenance mode
          </label>

          <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
            <input
              type="checkbox"
              checked={form.auto_approve_photos}
              onChange={(e) => handleChange('auto_approve_photos', e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            Auto-approve uploaded photos
          </label>

          {saveMutation.isError && (
            <p className="text-sm text-red-700 dark:text-red-300">{saveMutation.error.response?.data?.detail || 'Failed to save settings.'}</p>
          )}
          {saveMutation.isSuccess && <p className="text-sm text-green-700 dark:text-green-300">Settings saved.</p>}

          <button
            type="submit"
            disabled={saveMutation.isPending}
            className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saveMutation.isPending ? 'Saving…' : 'Save changes'}
          </button>
        </form>
      )}
    </PageWrapper>
  )
}
