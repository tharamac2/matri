import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, CheckCircle2, MapPin, Phone, Mail, Calendar, Crown } from 'lucide-react'
import api from '../../services/api.js'
import { useAuth } from '../../context/AuthContext.jsx'
import { hasPermission } from '../../utils/permissions.js'

function InfoItem({ label, value }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wide text-gray-400">{label}</p>
      <p className="mt-0.5 text-sm font-medium text-gray-800">{value ?? '—'}</p>
    </div>
  )
}

function VerificationBadge({ icon: Icon, label, verified }) {
  return (
    <div className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium ${verified ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-50 text-gray-500'}`}>
      <Icon size={14} />
      {label}
    </div>
  )
}

export default function MemberDetail() {
  const { userId } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { role } = useAuth()
  const [selectedStatus, setSelectedStatus] = useState('')
  const [msg, setMsg] = useState('')

  const { data: member, isLoading, isError } = useQuery({
    queryKey: ['member', userId],
    queryFn: () => api.get(`/users/${userId}`).then(r => r.data),
  })

  const { data: activity } = useQuery({
    queryKey: ['member-activity', userId],
    queryFn: () => api.get(`/users/${userId}/activity`, { params: { page: 1, size: 5 } }).then(r => r.data),
  })

  const statusMutation = useMutation({
    mutationFn: (s) => api.put(`/users/${userId}/status`, { status: s }).then(r => r.data),
    onSuccess: (updated) => {
      queryClient.setQueryData(['member', userId], prev => prev ? { ...prev, status: updated.status } : prev)
      queryClient.invalidateQueries({ queryKey: ['members'] })
      setMsg(`Status updated to "${updated.status}".`)
      setSelectedStatus('')
    },
    onError: err => setMsg(err.response?.data?.detail || 'Failed to update.'),
  })

  const canWrite = hasPermission(role, 'users.write')

  const STATUS_BADGE = {
    active: 'bg-emerald-100 text-emerald-700',
    inactive: 'bg-gray-100 text-gray-600',
    banned: 'bg-red-100 text-red-700',
    pending: 'bg-amber-100 text-amber-700',
  }

  if (isLoading) return <div className="flex items-center justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-200 border-t-brand-700" /></div>
  if (isError) return <p className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">Member not found.</p>

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <button type="button" onClick={() => navigate('/admin/members')} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800">
          <ArrowLeft size={16} /> Back to Members
        </button>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Left col */}
        <div className="lg:col-span-2 space-y-5">
          {/* Profile header card */}
          <div className="card p-5 flex gap-5">
            {member.photo_url
              ? <img src={member.photo_url} alt={member.name} className="h-24 w-24 flex-shrink-0 rounded-2xl object-cover" />
              : <div className="flex h-24 w-24 flex-shrink-0 items-center justify-center rounded-2xl bg-brand-100 text-3xl font-bold text-brand-700">{member.name[0]}</div>
            }
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 flex-wrap">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="text-xl font-bold text-gray-900">{member.name}</h1>
                    {member.status === 'active' && <span className="badge-premium flex items-center gap-1"><Crown size={10} /> Premium</span>}
                    {member.photo_status === 'approved' && <span className="badge-verified"><CheckCircle2 size={10} /> Verified</span>}
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">ID: #{userId} · {member.email}</p>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${STATUS_BADGE[member.status] ?? 'bg-gray-100 text-gray-600'}`}>
                  {member.status}
                </span>
              </div>
              <div className="mt-3 flex flex-wrap gap-4 text-xs text-gray-500">
                {member.phone && <span className="flex items-center gap-1"><Phone size={12} />{member.phone}</span>}
                {member.city  && <span className="flex items-center gap-1"><MapPin size={12} />{[member.city, member.state].filter(Boolean).join(', ')}</span>}
                {member.dob   && <span className="flex items-center gap-1"><Calendar size={12} />{member.dob}</span>}
              </div>
            </div>
          </div>

          {/* Personal details */}
          <div className="card p-5">
            <h2 className="mb-4 text-sm font-semibold text-gray-900 uppercase tracking-wide">Personal Details</h2>
            <div className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3">
              <InfoItem label="Gender"       value={member.gender} />
              <InfoItem label="Religion"     value={member.religion} />
              <InfoItem label="Caste"        value={member.caste} />
              <InfoItem label="Education"    value={member.education} />
              <InfoItem label="Profession"   value={member.profession} />
              <InfoItem label="Height"       value={member.height_cm ? `${member.height_cm} cm` : null} />
              <InfoItem label="Income (LPA)" value={member.income_lpa ? `₹${member.income_lpa}` : null} />
              <InfoItem label="Mother Tongue" value={member.mother_tongue} />
              <InfoItem label="Birth Place"  value={member.birth_place} />
            </div>
            {member.bio && <p className="mt-4 rounded-xl bg-gray-50 p-4 text-sm italic text-gray-600">"{member.bio}"</p>}
          </div>

          {/* Partner preferences */}
          {member.partner_prefs && Object.keys(member.partner_prefs).length > 0 && (
            <div className="card p-5">
              <h2 className="mb-4 text-sm font-semibold text-gray-900 uppercase tracking-wide">Partner Preferences</h2>
              <div className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3">
                {Object.entries(member.partner_prefs).map(([k, v]) => (
                  <InfoItem key={k} label={k.split('_').map(w => w[0].toUpperCase() + w.slice(1)).join(' ')} value={String(v)} />
                ))}
              </div>
            </div>
          )}

          {/* Activity */}
          <div className="card p-5">
            <h2 className="mb-4 text-sm font-semibold text-gray-900 uppercase tracking-wide">Recent Activity</h2>
            {activity?.items?.length ? (
              <ul className="divide-y divide-gray-100">
                {activity.items.map(e => (
                  <li key={e.id} className="flex items-start justify-between gap-4 py-2.5 text-sm">
                    <div>
                      <p className="font-medium text-gray-800">{e.action}</p>
                      <p className="text-xs text-gray-400">{e.device ?? '—'} · {e.ip_address ?? ''}</p>
                    </div>
                    <span className="whitespace-nowrap text-xs text-gray-400">{new Date(e.created_at).toLocaleString()}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-400">No activity recorded yet.</p>
            )}
          </div>
        </div>

        {/* Right col */}
        <div className="space-y-5">
          {/* Verification panel */}
          <div className="card p-5">
            <h2 className="mb-3 text-sm font-semibold text-gray-900 uppercase tracking-wide">Verification Status</h2>
            <div className="space-y-2">
              <VerificationBadge icon={CheckCircle2} label="Identity Verified"    verified={member.photo_status === 'approved'} />
              <VerificationBadge icon={CheckCircle2} label="Employment Verified"  verified={!!member.profession} />
              <VerificationBadge icon={CheckCircle2} label="Photo Approved"       verified={member.photo_status === 'approved'} />
            </div>
            {member.income_lpa && (
              <div className="mt-4 rounded-lg bg-gray-50 p-3">
                <p className="text-[10px] uppercase tracking-wide text-gray-400">Est. Income of p.a.</p>
                <p className="mt-0.5 text-lg font-bold text-gray-900">₹{Number(member.income_lpa).toLocaleString()}</p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="card p-5">
            <h2 className="mb-3 text-sm font-semibold text-gray-900 uppercase tracking-wide">Actions</h2>
            {msg && <p className="mb-3 rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-600">{msg}</p>}
            {canWrite ? (
              <div className="flex gap-2">
                <select value={selectedStatus} onChange={e => setSelectedStatus(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-brand-300 focus:outline-none">
                  <option value="">Change status…</option>
                  {['active','inactive','banned','pending'].filter(s => s !== member.status).map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
                <button type="button" disabled={!selectedStatus || statusMutation.isPending}
                  onClick={() => statusMutation.mutate(selectedStatus)}
                  className="btn-primary whitespace-nowrap py-2 disabled:opacity-50">
                  {statusMutation.isPending ? '…' : 'Apply'}
                </button>
              </div>
            ) : (
              <p className="text-xs text-gray-400">Read-only access.</p>
            )}
          </div>

          <Link to="/admin/members" className="inline-flex items-center gap-1.5 text-sm text-brand-700 hover:text-brand-800">
            <ArrowLeft size={14} /> All members
          </Link>
        </div>
      </div>
    </div>
  )
}
