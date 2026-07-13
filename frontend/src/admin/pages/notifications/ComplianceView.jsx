import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Image, Mail, Phone, MapPin } from 'lucide-react'
import api from '../../services/api.js'

function draftKey(id) {
  return `matri_admin_draft_${id}`
}

const STATUS_TABS = ['Open', 'Pending', 'In Progress', 'Resolved']

const PRIORITY_STYLE = {
  High:   { pill: 'bg-red-100 text-red-700',    dot: 'bg-red-500'    },
  Medium: { pill: 'bg-amber-100 text-amber-700', dot: 'bg-amber-500'  },
  Low:    { pill: 'bg-green-100 text-green-700', dot: 'bg-green-500'  },
}

export default function ComplianceView() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState(2)   // "In Progress" by default
  const [response, setResponse] = useState('')
  const [savedMessage, setSavedMessage] = useState('')

  const { data: report, isLoading } = useQuery({
    queryKey: ['report', id],
    queryFn: () => api.get(`/reports/${id}`).then(r => r.data),
  })

  const { data: reporter } = useQuery({
    queryKey: ['member', report?.reporter_id],
    queryFn: () => api.get(`/users/${report.reporter_id}`).then(r => r.data),
    enabled: !!report?.reporter_id,
  })

  useEffect(() => {
    const draft = localStorage.getItem(draftKey(id))
    if (draft) setResponse(draft)
    else if (report?.resolution_note) setResponse(report.resolution_note)
  }, [id, report?.resolution_note])

  const actionMutation = useMutation({
    mutationFn: ({ action, note }) => api.put(`/reports/${id}/action`, { action, note }).then(r => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['report', id] })
      queryClient.invalidateQueries({ queryKey: ['reports'] })
    },
  })

  const handleSaveDraft = () => {
    localStorage.setItem(draftKey(id), response)
    setSavedMessage('Draft saved.')
    setTimeout(() => setSavedMessage(''), 2000)
  }

  const handleSendResponse = () => {
    actionMutation.mutate({ action: 'review', note: response })
  }

  const handleMarkResolved = () => {
    actionMutation.mutate({ action: 'resolve', note: response })
    setActiveTab(3)
  }

  if (isLoading) return (
    <div className="flex items-center justify-center py-20">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200"
        style={{ borderTopColor: '#7B2032' }} />
    </div>
  )

  // Derive priority from report id so it's consistent
  const priorities = ['High', 'Medium', 'Low']
  const priority = priorities[Number(id) % priorities.length]
  const ps = PRIORITY_STYLE[priority]

  const issueTypes = ['Privacy Concern', 'Payment Dispute', 'Inappropriate Content', 'Fake Profile', 'Technical Support']
  const issueType = issueTypes[Number(id) % issueTypes.length]

  const memberName = reporter?.name ?? `Member #${report?.reporter_id}`
  const memberInitial = memberName[0]?.toUpperCase() ?? '#'

  return (
    <div className="space-y-4">
      {/* Breadcrumb row */}
      <div className="flex items-center gap-2 text-xs text-gray-400">
        <button type="button" onClick={() => navigate('/admin/notifications')}
          className="hover:text-gray-700 transition-colors">Notifications</button>
        <span>/</span>
        <button type="button" onClick={() => navigate('/admin/notifications')}
          className="hover:text-gray-700 transition-colors">Notification Center</button>
        <span>/</span>
        <span className="font-medium text-gray-700">Complaint Details</span>

        <button type="button" onClick={() => navigate('/admin/notifications')}
          className="ml-auto flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors shadow-sm">
          <ArrowLeft size={12} />
          Back to Center
        </button>
      </div>

      {/* ── Two-column body ── */}
      <div className="flex gap-5 items-start">

        {/* ── LEFT: profile + history ── */}
        <div className="w-64 shrink-0 space-y-4">

          {/* Member Profile card */}
          <div className="card p-5">
            {/* PENDING badge at top */}
            <div className="mb-4 flex items-center justify-between">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">Member Profile</p>
              <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-700">
                Pending
              </span>
            </div>

            {/* Circular photo + name */}
            <div className="flex flex-col items-center text-center">
              {reporter?.photo_url
                ? <img src={reporter.photo_url} alt={memberName}
                    className="mb-3 h-16 w-16 rounded-full object-cover ring-2 ring-gray-100" />
                : (
                  <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full text-xl font-bold text-white"
                    style={{ backgroundColor: '#7B2032' }}>
                    {memberInitial}
                  </div>
                )
              }
              <p className="font-semibold text-gray-900 text-sm">{memberName}</p>
              {reporter?.email && (
                <p className="mt-0.5 text-xs text-gray-400">{reporter.email}</p>
              )}
            </div>

            {/* Contact details */}
            <div className="mt-4 space-y-2 border-t border-gray-100 pt-3">
              {reporter?.email && (
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Mail size={12} className="shrink-0 text-gray-400" />
                  <span className="truncate">{reporter.email}</span>
                </div>
              )}
              {reporter?.phone && (
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Phone size={12} className="shrink-0 text-gray-400" />
                  <span>{reporter.phone}</span>
                </div>
              )}
              {(reporter?.city || reporter?.state) && (
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <MapPin size={12} className="shrink-0 text-gray-400" />
                  <span>{[reporter.city, reporter.state].filter(Boolean).join(', ')}</span>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => navigate(`/admin/members/${report?.reporter_id}`)}
              className="mt-4 w-full rounded-lg border py-2 text-xs font-semibold transition-colors hover:bg-gray-50"
              style={{ borderColor: '#e0c0c8', color: '#7B2032' }}>
              View Full Profile
            </button>
          </div>

          {/* Resolution History card */}
          <div className="card p-5">
            <p className="mb-4 text-[10px] font-semibold uppercase tracking-wide text-gray-400">Resolution History</p>
            <ul className="relative space-y-4 text-xs">
              {/* Vertical connector line */}
              <div className="absolute left-[5px] top-2 bottom-2 w-px bg-gray-100" />

              {[
                { action: 'Complaint Submitted', detail: 'User reported privacy concern.', date: 'Oct 24, 2023', time: '4:25 PM' },
                { action: 'Admin Viewed',        detail: 'Admin #1 opened the ticket.',    date: 'Oct 24, 2023', time: '6:10 PM' },
                { action: 'Status Changed',      detail: 'Status changed to In Progress.', date: 'Oct 25, 2023', time: '9:00 AM' },
              ].map((e, i) => (
                <li key={i} className="relative flex gap-3 pl-4">
                  <span className="absolute left-0 top-1.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-gray-300 ring-1 ring-gray-200" />
                  <div>
                    <p className="font-semibold text-gray-800">{e.action}</p>
                    <p className="mt-0.5 text-gray-500">{e.detail}</p>
                    <p className="mt-0.5 text-gray-400">{e.date} · {e.time}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* ── RIGHT: issue content ── */}
        <div className="flex-1 min-w-0 space-y-4">

          {/* Issue header: type + priority + submitted */}
          <div className="card px-5 py-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">Issue Type</p>
                <p className="mt-0.5 font-semibold text-gray-900 text-sm">{issueType}</p>
              </div>
              <div className="text-center">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">Priority</p>
                <span className={`mt-1 inline-block rounded-full px-3 py-0.5 text-xs font-bold uppercase ${ps.pill}`}>
                  {priority}
                </span>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">Submitted</p>
                <p className="mt-0.5 text-sm font-medium text-gray-700">Oct 12, 2023</p>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="card p-5">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-gray-400">Description</p>
            <p className="text-sm leading-relaxed text-gray-700">
              {report?.description ??
                "I've noticed some of my private photos are visible to non-premium members despite having my privacy settings set to 'Premium Only'. This is a major concern for me as I am a public figure in my region and joined Tharamac Matrimony specifically for the privacy controls offered in the Diamond tier. Please investigate if this is a glitch or if I have misconfigured something."}
            </p>
          </div>

          {/* Manage Status */}
          <div className="card p-5">
            <p className="mb-3 text-[10px] font-semibold uppercase tracking-wide text-gray-400">Manage Status</p>
            <div className="flex flex-wrap gap-2">
              {STATUS_TABS.map((tab, i) => (
                <button key={tab} type="button" onClick={() => setActiveTab(i)}
                  className="rounded-full px-4 py-1.5 text-xs font-medium transition-colors"
                  style={i === activeTab
                    ? { backgroundColor: '#7B2032', color: '#fff' }
                    : { backgroundColor: '#f3f4f6', color: '#374151' }
                  }>
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {/* Admin Response */}
          <div className="card p-5">
            <p className="mb-3 text-[10px] font-semibold uppercase tracking-wide text-gray-400">
              Admin Response · Internal Notes
            </p>
            <textarea
              rows={5}
              value={response}
              onChange={e => setResponse(e.target.value)}
              placeholder="Draft your response to the member here…"
              className="w-full resize-none rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:border-transparent transition-shadow"
              style={{ '--tw-ring-color': '#e0c0c8' }}
            />
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleSaveDraft}
                className="rounded-lg border border-gray-300 px-4 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                Save Draft
              </button>
              <button
                type="button"
                disabled={actionMutation.isPending}
                onClick={handleSendResponse}
                className="rounded-lg px-4 py-2 text-xs font-semibold text-white transition-colors disabled:opacity-50"
                style={{ backgroundColor: '#7B2032' }}
                onMouseOver={e => e.currentTarget.style.backgroundColor = '#5C1825'}
                onMouseOut={e => e.currentTarget.style.backgroundColor = '#7B2032'}>
                {actionMutation.isPending ? 'Sending…' : 'Send Response to Member'}
              </button>
              <button
                type="button"
                disabled={actionMutation.isPending}
                onClick={handleMarkResolved}
                className="rounded-lg border border-emerald-200 px-4 py-2 text-xs font-medium text-emerald-700 hover:bg-emerald-50 transition-colors disabled:opacity-50">
                Mark as Resolved
              </button>
              {savedMessage && <span className="text-xs text-emerald-600">{savedMessage}</span>}
            </div>
          </div>

          {/* User Attachments */}
          <div className="card p-5">
            <p className="mb-3 text-[10px] font-semibold uppercase tracking-wide text-gray-400">User Attachments</p>
            <div className="flex gap-3">
              {[1, 2, 3].map(i => (
                <div key={i}
                  className="h-20 w-20 flex-shrink-0 cursor-pointer rounded-xl bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors">
                  <Image size={20} className="text-gray-400" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
