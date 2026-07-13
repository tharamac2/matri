import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import PageWrapper from '../../components/layout/PageWrapper.jsx'
import api from '../../services/api.js'

function MemberPicker({ selectedMembers, onAdd, onRemove }) {
  const [query, setQuery] = useState('')

  const searchQuery = useQuery({
    queryKey: ['notifications', 'member-search', query],
    queryFn: () => api.get('/users', { params: { search: query, page: 1, size: 8 } }).then((res) => res.data),
    enabled: query.trim().length >= 2,
  })

  const selectedIds = new Set(selectedMembers.map((m) => m.id))
  const results = (searchQuery.data?.items || []).filter((member) => !selectedIds.has(member.id))

  return (
    <div>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search members by name or email…"
        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
      />

      {query.trim().length >= 2 && (
        <div className="mt-1 max-h-40 overflow-y-auto rounded-lg border border-gray-200 bg-white text-sm shadow-sm dark:border-gray-700 dark:bg-gray-900">
          {searchQuery.isLoading ? (
            <p className="px-3 py-2 text-gray-500 dark:text-gray-400">Searching…</p>
          ) : results.length === 0 ? (
            <p className="px-3 py-2 text-gray-500 dark:text-gray-400">No matching members.</p>
          ) : (
            results.map((member) => (
              <button
                key={member.id}
                type="button"
                onClick={() => {
                  onAdd(member)
                  setQuery('')
                }}
                className="block w-full px-3 py-2 text-left text-gray-700 hover:bg-primary-50 dark:text-gray-200 dark:hover:bg-primary-950/40"
              >
                {member.name} <span className="text-xs text-gray-400 dark:text-gray-500">#{member.id} · {member.email}</span>
              </button>
            ))
          )}
        </div>
      )}

      {selectedMembers.length > 0 && (
        <ul className="mt-2 flex flex-wrap gap-2">
          {selectedMembers.map((member) => (
            <li
              key={member.id}
              className="flex items-center gap-1 rounded-full bg-primary-50 px-2.5 py-1 text-xs font-medium text-primary-700 dark:bg-primary-950/40 dark:text-primary-300"
            >
              {member.name} (#{member.id})
              <button
                type="button"
                onClick={() => onRemove(member.id)}
                className="ml-1 text-primary-500 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-200"
                aria-label={`Remove ${member.name}`}
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default function NotificationsList() {
  const queryClient = useQueryClient()
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [audience, setAudience] = useState('all')
  const [selectedMembers, setSelectedMembers] = useState([])
  const [formError, setFormError] = useState('')

  const { data, isLoading, isError } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => api.get('/notifications', { params: { page: 1, size: 20 } }).then((res) => res.data),
  })

  const sendMutation = useMutation({
    mutationFn: () =>
      api.post('/notifications/send', {
        title,
        message,
        audience,
        ...(audience === 'selected' ? { member_ids: selectedMembers.map((m) => m.id) } : {}),
      }),
    onSuccess: () => {
      setTitle('')
      setMessage('')
      setSelectedMembers([])
      setFormError('')
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
    onError: (err) => setFormError(err.response?.data?.detail || 'Failed to send notification.'),
  })

  function handleSubmit(event) {
    event.preventDefault()
    setFormError('')
    if (!title.trim() || !message.trim()) {
      setFormError('Title and message are required.')
      return
    }
    if (audience === 'selected' && selectedMembers.length === 0) {
      setFormError('Select at least one member for a targeted notification.')
      return
    }
    sendMutation.mutate()
  }

  return (
    <PageWrapper title="Notifications" breadcrumbs={[{ label: 'Dashboard', to: '/' }, { label: 'Notifications' }]}>
      <form onSubmit={handleSubmit} className="mb-8 max-w-xl space-y-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-900">
        <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">Send a notification</h2>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Title"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
        />
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Message"
          rows={3}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
        />
        <select
          value={audience}
          onChange={(e) => {
            setAudience(e.target.value)
            setFormError('')
          }}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
        >
          <option value="all">All members</option>
          <option value="active">Active members</option>
          <option value="inactive">Inactive members</option>
          <option value="selected">Selected members</option>
        </select>

        {audience === 'selected' && (
          <div>
            <p className="mb-1 text-xs font-medium text-gray-600 dark:text-gray-400">Pick members to notify</p>
            <MemberPicker
              selectedMembers={selectedMembers}
              onAdd={(member) => setSelectedMembers((prev) => [...prev, member])}
              onRemove={(id) => setSelectedMembers((prev) => prev.filter((m) => m.id !== id))}
            />
          </div>
        )}

        {formError && <p className="text-sm text-red-700 dark:text-red-300">{formError}</p>}
        {sendMutation.isSuccess && (
          <p className="text-sm text-green-700 dark:text-green-300">Notification sent successfully.</p>
        )}

        <button
          type="submit"
          disabled={sendMutation.isPending}
          className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {sendMutation.isPending ? 'Sending…' : 'Send'}
        </button>
      </form>

      <h2 className="mb-3 text-base font-semibold text-gray-900 dark:text-gray-100">Recent notifications</h2>
      {isLoading ? (
        <div className="space-y-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-12 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-800" />
          ))}
        </div>
      ) : isError ? (
        <p className="text-sm text-red-700 dark:text-red-300">Failed to load notifications.</p>
      ) : (
        <ul className="space-y-2">
          {data.items.map((n) => (
            <li key={n.id} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-900">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-gray-900 dark:text-gray-100">{n.title}</h3>
                <span className="text-xs text-gray-500 dark:text-gray-400">{new Date(n.sent_at).toLocaleString()}</span>
              </div>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">{n.message}</p>
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                Sent to {n.recipient_count} {n.audience} recipient(s)
              </p>
            </li>
          ))}
          {data.items.length === 0 && <p className="text-sm text-gray-500 dark:text-gray-400">No notifications sent yet.</p>}
        </ul>
      )}
    </PageWrapper>
  )
}
