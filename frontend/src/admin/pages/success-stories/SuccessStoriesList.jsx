import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import PageWrapper from '../../components/layout/PageWrapper.jsx'
import api from '../../services/api.js'

const EMPTY_FORM = { member_a_id: '', member_b_id: '', title: '', story: '', photo_url: '', wedding_date: '', is_published: false }

export default function SuccessStoriesList() {
  const queryClient = useQueryClient()

  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [formError, setFormError] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [confirmingDeleteId, setConfirmingDeleteId] = useState(null)
  const [message, setMessage] = useState('')

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['success-stories'],
    queryFn: () => api.get('/success-stories').then((res) => res.data),
  })

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['success-stories'] })

  function toPayload(f) {
    return {
      member_a_id: f.member_a_id ? Number(f.member_a_id) : null,
      member_b_id: f.member_b_id ? Number(f.member_b_id) : null,
      title: f.title,
      story: f.story,
      photo_url: f.photo_url || null,
      wedding_date: f.wedding_date || null,
      is_published: f.is_published,
    }
  }

  const createMutation = useMutation({
    mutationFn: (payload) => api.post('/success-stories', payload).then((res) => res.data),
    onSuccess: (created) => {
      setMessage(`Story "${created.title}" created.`)
      setForm(EMPTY_FORM)
      setShowForm(false)
      setFormError('')
      invalidate()
    },
    onError: (err) => setFormError(err.response?.data?.detail || 'Failed to create story.'),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }) => api.put(`/success-stories/${id}`, payload).then((res) => res.data),
    onSuccess: (updated) => {
      setMessage(`Story "${updated.title}" updated.`)
      setEditingId(null)
      invalidate()
    },
    onError: (err) => setMessage(err.response?.data?.detail || 'Failed to update story.'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/success-stories/${id}`),
    onSuccess: () => {
      setMessage('Story deleted.')
      setConfirmingDeleteId(null)
      invalidate()
    },
    onError: (err) => setMessage(err.response?.data?.detail || 'Failed to delete story.'),
  })

  function handleCreateSubmit(event) {
    event.preventDefault()
    setFormError('')
    if (!form.title.trim() || !form.story.trim()) {
      setFormError('Title and story are required.')
      return
    }
    createMutation.mutate(toPayload(form))
  }

  function togglePublished(story) {
    setMessage('')
    updateMutation.mutate({ id: story.id, payload: { is_published: !story.is_published } })
  }

  function startEdit(story) {
    setEditingId(story.id)
    setForm({
      member_a_id: story.member_a_id ?? '',
      member_b_id: story.member_b_id ?? '',
      title: story.title,
      story: story.story,
      photo_url: story.photo_url ?? '',
      wedding_date: story.wedding_date ?? '',
      is_published: story.is_published,
    })
    setMessage('')
  }

  function saveEdit() {
    if (!form.title.trim() || !form.story.trim()) {
      setMessage('Title and story are required.')
      return
    }
    updateMutation.mutate({ id: editingId, payload: toPayload(form) })
  }

  const inputCls = 'rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100'

  return (
    <PageWrapper title="Success Stories" breadcrumbs={[{ label: 'Dashboard', to: '/' }, { label: 'Success Stories' }]}>
      <div className="mb-6">
        {showForm ? (
          <form onSubmit={handleCreateSubmit} className="max-w-xl space-y-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-900">
            <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">Add a new success story</h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <input value={form.member_a_id} onChange={(e) => setForm((f) => ({ ...f, member_a_id: e.target.value }))} placeholder="Member A ID (optional)" className={inputCls} />
              <input value={form.member_b_id} onChange={(e) => setForm((f) => ({ ...f, member_b_id: e.target.value }))} placeholder="Member B ID (optional)" className={inputCls} />
              <input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="Title" className={`${inputCls} sm:col-span-2`} />
              <textarea value={form.story} onChange={(e) => setForm((f) => ({ ...f, story: e.target.value }))} placeholder="Story" rows={4} className={`${inputCls} sm:col-span-2`} />
              <input value={form.photo_url} onChange={(e) => setForm((f) => ({ ...f, photo_url: e.target.value }))} placeholder="Photo URL (optional)" className={inputCls} />
              <input type="date" value={form.wedding_date} onChange={(e) => setForm((f) => ({ ...f, wedding_date: e.target.value }))} className={inputCls} />
              <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 sm:col-span-2">
                <input type="checkbox" checked={form.is_published} onChange={(e) => setForm((f) => ({ ...f, is_published: e.target.checked }))} />
                Publish immediately
              </label>
            </div>
            {formError && <p className="text-sm text-red-700 dark:text-red-300">{formError}</p>}
            <div className="flex gap-2">
              <button type="submit" disabled={createMutation.isPending} className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-60">
                {createMutation.isPending ? 'Creating…' : 'Create story'}
              </button>
              <button type="button" onClick={() => { setShowForm(false); setForm(EMPTY_FORM); setFormError('') }} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-800">
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <button type="button" onClick={() => setShowForm(true)} className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700">
            + Add success story
          </button>
        )}
      </div>

      {message && <p className="mb-4 rounded-lg bg-gray-50 px-3 py-2 text-sm text-gray-700 dark:bg-gray-800 dark:text-gray-300">{message}</p>}

      {isLoading ? (
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => <div key={i} className="h-16 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-800" />)}
        </div>
      ) : isError ? (
        <p className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
          {error.response?.data?.detail || 'Failed to load success stories.'}
        </p>
      ) : (
        <div className="space-y-3">
          {(data?.items ?? []).map((story) => (
            <div key={story.id} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-900">
              {editingId === story.id ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <input value={form.member_a_id} onChange={(e) => setForm((f) => ({ ...f, member_a_id: e.target.value }))} placeholder="Member A ID" className={inputCls} />
                    <input value={form.member_b_id} onChange={(e) => setForm((f) => ({ ...f, member_b_id: e.target.value }))} placeholder="Member B ID" className={inputCls} />
                    <input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="Title" className={`${inputCls} sm:col-span-2`} />
                    <textarea value={form.story} onChange={(e) => setForm((f) => ({ ...f, story: e.target.value }))} rows={4} className={`${inputCls} sm:col-span-2`} />
                    <input value={form.photo_url} onChange={(e) => setForm((f) => ({ ...f, photo_url: e.target.value }))} placeholder="Photo URL" className={inputCls} />
                    <input type="date" value={form.wedding_date} onChange={(e) => setForm((f) => ({ ...f, wedding_date: e.target.value }))} className={inputCls} />
                  </div>
                  <div className="flex gap-2">
                    <button type="button" disabled={updateMutation.isPending} onClick={saveEdit} className="rounded-lg bg-primary-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-primary-700 disabled:opacity-60">Save</button>
                    <button type="button" onClick={() => setEditingId(null)} className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-800">Cancel</button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100">{story.title}</h3>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${story.is_published ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}>
                        {story.is_published ? 'Published' : 'Draft'}
                      </span>
                    </div>
                    <p className="mt-1 line-clamp-2 text-sm text-gray-600 dark:text-gray-300">{story.story}</p>
                    <p className="mt-1 text-xs text-gray-400">
                      {story.member_a_id ? `Member #${story.member_a_id}` : ''}{story.member_a_id && story.member_b_id ? ' & ' : ''}{story.member_b_id ? `Member #${story.member_b_id}` : ''}
                      {story.wedding_date ? ` · Wedding: ${story.wedding_date}` : ''}
                    </p>
                  </div>
                  <div className="flex flex-shrink-0 flex-wrap gap-2">
                    <button type="button" onClick={() => togglePublished(story)} disabled={updateMutation.isPending} className="rounded-lg border border-gray-300 px-2.5 py-1 text-xs font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-800">
                      {story.is_published ? 'Unpublish' : 'Publish'}
                    </button>
                    <button type="button" onClick={() => startEdit(story)} className="rounded-lg border border-gray-300 px-2.5 py-1 text-xs font-medium text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-800">
                      Edit
                    </button>
                    {confirmingDeleteId === story.id ? (
                      <>
                        <button type="button" disabled={deleteMutation.isPending} onClick={() => deleteMutation.mutate(story.id)} className="rounded-lg bg-red-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-60">Confirm</button>
                        <button type="button" onClick={() => setConfirmingDeleteId(null)} className="rounded-lg border border-gray-300 px-2.5 py-1 text-xs text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-800">Cancel</button>
                      </>
                    ) : (
                      <button type="button" onClick={() => setConfirmingDeleteId(story.id)} className="rounded-lg border border-red-200 px-2.5 py-1 text-xs font-medium text-red-700 hover:bg-red-50 dark:border-red-900 dark:text-red-300 dark:hover:bg-red-950/40">
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
          {(data?.items ?? []).length === 0 && (
            <p className="rounded-lg border border-gray-200 bg-white p-6 text-center text-sm text-gray-400 dark:border-gray-700 dark:bg-gray-900">
              No success stories yet — add one to get started.
            </p>
          )}
        </div>
      )}
    </PageWrapper>
  )
}
