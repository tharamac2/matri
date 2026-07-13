import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, CheckCircle, XCircle, FileText } from 'lucide-react'
import api from '../../services/api.js'

export default function ProfileVerificationView() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data: member, isLoading } = useQuery({
    queryKey: ['member', id],
    queryFn: () => api.get(`/users/${id}`).then(r => r.data),
  })

  const decisionMutation = useMutation({
    mutationFn: ({ status, note }) => api.put(`/moderation/photos/${id}`, { status, note }).then(r => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['moderation'] })
      navigate('/admin/verification')
    },
  })

  const handleRequestDocuments = () => {
    const note = window.prompt('What additional documents should the member provide?')
    if (!note) return
    decisionMutation.mutate({ status: 'rejected', note: `More documents requested: ${note}` })
  }

  if (isLoading) return (
    <div className="flex items-center justify-center py-20">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-200 border-t-brand-700" />
    </div>
  )
  if (!member) return <p className="text-sm text-gray-400">Member not found.</p>

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <button type="button" onClick={() => navigate('/admin/verification')} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800">
          <ArrowLeft size={16} /> Back to Center
        </button>
        <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
          {member.photo_status?.toUpperCase() ?? 'PENDING'}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Left – member profile */}
        <div className="space-y-4">
          <div className="card p-5 text-center">
            {member.photo_url
              ? <img src={member.photo_url} alt={member.name} className="mx-auto mb-3 h-24 w-24 rounded-2xl object-cover" />
              : <div className="mx-auto mb-3 flex h-24 w-24 items-center justify-center rounded-2xl bg-brand-100 text-3xl font-bold text-brand-700">{member.name?.[0]}</div>
            }
            <h2 className="font-bold text-gray-900">{member.name}</h2>
            <p className="text-xs text-gray-400">{member.email}</p>
            <div className="mt-3 flex flex-col gap-1 text-xs text-gray-500">
              {member.city && <span>{[member.city, member.state].filter(Boolean).join(', ')}</span>}
              {member.phone && <span>{member.phone}</span>}
            </div>
          </div>
          <div className="card p-4">
            <p className="text-[10px] uppercase tracking-wide text-gray-400 mb-2">Quick Info</p>
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between"><span className="text-gray-400">Age</span><span className="font-medium">{member.dob ? `${new Date().getFullYear() - new Date(member.dob).getFullYear()} years` : '—'}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Education</span><span className="font-medium">{member.education ?? '—'}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Profession</span><span className="font-medium">{member.profession ?? '—'}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Religion</span><span className="font-medium">{member.religion ?? '—'}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Caste</span><span className="font-medium">{member.caste ?? '—'}</span></div>
            </div>
          </div>
        </div>

        {/* Center – documents */}
        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Submitted Documents</h2>
          <div className="grid grid-cols-2 gap-3">
            {member.photo_url ? (
              <div className="card overflow-hidden">
                <img src={member.photo_url} alt="Profile photo" className="aspect-square w-full object-cover" />
                <div className="px-3 py-2 text-xs">
                  <p className="font-semibold text-gray-800">Profile Photo</p>
                  <p className="text-gray-400">Submitted</p>
                </div>
              </div>
            ) : (
              <div className="card flex flex-col items-center justify-center gap-2 p-6 text-center">
                <FileText size={24} className="text-gray-300" />
                <p className="text-xs text-gray-400">No photo submitted</p>
              </div>
            )}
            <div className="card flex flex-col items-center justify-center gap-2 p-6 text-center border-dashed border-2 border-gray-200 bg-gray-50">
              <FileText size={24} className="text-gray-300" />
              <p className="text-xs text-gray-400">Submit a document<br />to verify the profile</p>
            </div>
          </div>
        </div>

        {/* Right – verification actions */}
        <div className="space-y-4">
          <div className="card p-5">
            <h2 className="mb-4 text-sm font-semibold text-gray-900 uppercase tracking-wide">Verification</h2>
            <div className="space-y-2">
              <button type="button"
                disabled={decisionMutation.isPending || member.photo_status === 'approved'}
                onClick={() => decisionMutation.mutate({ status: 'approved' })}
                className="w-full btn-primary justify-center py-2.5 disabled:opacity-50">
                <CheckCircle size={15} />
                {decisionMutation.isPending ? 'Saving…' : 'Approve Profile'}
              </button>
              <button type="button"
                disabled={decisionMutation.isPending}
                onClick={handleRequestDocuments}
                className="w-full btn-outline justify-center py-2.5 disabled:opacity-50">
                Request More Documents
              </button>
              <button type="button"
                disabled={decisionMutation.isPending || member.photo_status === 'rejected'}
                onClick={() => decisionMutation.mutate({ status: 'rejected' })}
                className="w-full rounded-lg border border-red-200 py-2.5 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50 flex items-center justify-center gap-2">
                <XCircle size={15} />
                Reject
              </button>
            </div>
          </div>

          <div className="card p-5">
            <h2 className="mb-3 text-sm font-semibold text-gray-900 uppercase tracking-wide">Admin Notes (Optional)</h2>
            <textarea
              rows={4}
              placeholder="Type notes for internal reference or the member…"
              className="w-full resize-none rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 placeholder:text-gray-400 focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-100"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
