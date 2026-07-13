import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Crown, Star, Diamond, Plus, Edit2, CheckCircle2 } from 'lucide-react'
import api from '../../services/api.js'

const ICONS = [
  { icon: Star, iconColor: 'text-amber-500', iconBg: 'bg-amber-50' },
  { icon: Crown, iconColor: 'text-purple-600', iconBg: 'bg-purple-50' },
  { icon: Diamond, iconColor: 'text-blue-600', iconBg: 'bg-blue-50' },
]

const RENEWAL_STATUS = {
  PENDING:  { label: 'Pending',  cls: 'bg-amber-100 text-amber-700' },
  EXPIRED:  { label: 'Expired',  cls: 'bg-red-100 text-red-700' },
  RENEWED:  { label: 'Renewed',  cls: 'bg-emerald-100 text-emerald-700' },
  ACTIVE:   { label: 'Active',   cls: 'bg-emerald-100 text-emerald-700' },
}

function planFeatureList(features) {
  if (!features) return []
  const list = []
  if (features.matches_per_day) list.push(`${features.matches_per_day} Matches / Day`)
  if (features.chat) list.push('Unlimited Messaging')
  if (features.priority_support) list.push('Priority Support')
  return list
}

export default function PremiumMembership() {
  const navigate = useNavigate()
  const [page, setPage] = useState(1)
  const queryClient = useQueryClient()
  const size = 10

  const { data: plans } = useQuery({
    queryKey: ['plans'],
    queryFn: () => api.get('/subscriptions/plans').then(r => r.data),
  })

  const { data: subs } = useQuery({
    queryKey: ['subscriptions', { page, size }],
    queryFn: () => api.get('/subscriptions', { params: { page, size } }).then(r => r.data),
    keepPreviousData: true,
  })

  const createPlanMutation = useMutation({
    mutationFn: (payload) => api.post('/subscriptions/plans', payload).then(r => r.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['plans'] }),
  })

  const updatePlanMutation = useMutation({
    mutationFn: ({ id, payload }) => api.put(`/subscriptions/plans/${id}`, payload).then(r => r.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['plans'] }),
  })

  const handleCreatePlan = () => {
    const name = window.prompt('Plan name:')
    if (!name) return
    const price = Number(window.prompt('Price (INR):', '0'))
    const duration_days = Number(window.prompt('Duration (days):', '90'))
    if (Number.isNaN(price) || Number.isNaN(duration_days)) return
    createPlanMutation.mutate({ name, price, duration_days, is_active: true })
  }

  const handleEditPlan = (plan) => {
    const name = window.prompt('Plan name:', plan.name)
    if (!name) return
    const price = Number(window.prompt('Price (INR):', String(plan.price)))
    const duration_days = Number(window.prompt('Duration (days):', String(plan.duration_days)))
    if (Number.isNaN(price) || Number.isNaN(duration_days)) return
    updatePlanMutation.mutate({ id: plan.id, payload: { name, price, duration_days } })
  }

  const totalPages = subs ? Math.max(1, Math.ceil(subs.total / size)) : 1

  const BADGE_COLORS = ['bg-amber-100 text-amber-700', 'bg-purple-100 text-purple-700', 'bg-blue-100 text-blue-700']

  function planBadge(planId) {
    const plan = (plans ?? []).find(p => p.id === planId)
    if (!plan) return { label: '—', cls: 'bg-gray-100 text-gray-600' }
    const idx = (plans ?? []).findIndex(p => p.id === planId)
    return { label: plan.name, cls: BADGE_COLORS[idx % BADGE_COLORS.length] }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Membership Plans</h1>
          <p className="mt-1 text-sm text-gray-500">Manage and curate the exclusive tiers of membership that define the Tharamac Matrimony experience.</p>
        </div>
        <button type="button" className="btn-primary" onClick={handleCreatePlan} disabled={createPlanMutation.isPending}>
          <Plus size={15} /> Create New Plan
        </button>
      </div>

      {/* Plan Cards */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {(plans ?? []).map((plan, i) => {
          const { icon: Icon, iconColor, iconBg } = ICONS[i % ICONS.length]
          return (
            <div key={plan.id} className="card p-6 relative">
              <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-2xl ${iconBg}`}>
                <Icon size={22} className={iconColor} />
              </div>
              <h3 className="text-base font-bold text-gray-900">{plan.name}</h3>
              <div className="mt-2 mb-4">
                <span className="text-2xl font-bold text-gray-900">₹{plan.price}</span>
                <span className="ml-1 text-xs text-gray-400">/ {plan.duration_days} days</span>
              </div>
              <ul className="space-y-2 mb-6">
                {planFeatureList(plan.features).map(f => (
                  <li key={f} className="flex items-center gap-2 text-xs text-gray-600">
                    <CheckCircle2 size={13} className="text-brand-600 flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <div className="mt-auto flex items-center justify-between border-t border-gray-100 pt-4">
                <div>
                  <p className="text-[10px] uppercase tracking-wide text-gray-400">Status</p>
                  <p className="text-sm font-bold text-gray-900">{plan.is_active ? 'Active' : 'Inactive'}</p>
                </div>
                <button type="button" onClick={() => handleEditPlan(plan)} className="flex items-center gap-1.5 text-xs font-semibold text-brand-700 hover:text-brand-800">
                  <Edit2 size={12} /> Edit Plan
                </button>
              </div>
            </div>
          )
        })}
        {!plans?.length && (
          <p className="text-sm text-gray-400 col-span-full">No plans yet — create one to get started.</p>
        )}
      </div>

      {/* Expiring Soon */}
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Expiring Soon</h2>
            <p className="text-xs text-gray-400">Members requiring attention within the next 7 days.</p>
          </div>
          <button type="button" className="text-xs font-semibold text-brand-700 hover:underline" onClick={() => navigate('/admin/reports')}>
            View All Reports
          </button>
        </div>
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">
              <th className="px-6 py-3">Member</th>
              <th className="px-6 py-3">Current Plan</th>
              <th className="px-6 py-3">Expiry Date</th>
              <th className="px-6 py-3">Auto-Renew</th>
              <th className="px-6 py-3">Renewal Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {(subs?.items ?? []).slice(0, 8).map(sub => {
              const badge = planBadge(sub.plan_id)
              const statusKey = sub.status?.toUpperCase() ?? 'PENDING'
              const renewal = RENEWAL_STATUS[statusKey] ?? RENEWAL_STATUS.PENDING
              return (
                <tr key={sub.id} className="hover:bg-gray-50/50">
                  <td className="px-6 py-3.5">
                    <p className="font-medium text-gray-900">Member #{sub.member_id}</p>
                  </td>
                  <td className="px-6 py-3.5">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${badge.cls}`}>{badge.label}</span>
                  </td>
                  <td className="px-6 py-3.5 text-gray-500 text-xs">
                    {sub.end_date ? new Date(sub.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                  </td>
                  <td className="px-6 py-3.5">
                    <span className={`h-4 w-8 rounded-full inline-block ${sub.auto_renew ? 'bg-emerald-400' : 'bg-gray-300'}`} />
                  </td>
                  <td className="px-6 py-3.5">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${renewal.cls}`}>
                      + {renewal.label}
                    </span>
                  </td>
                </tr>
              )
            })}
            {!subs?.items?.length && (
              <tr><td colSpan={5} className="px-6 py-8 text-center text-sm text-gray-400">No subscriptions found.</td></tr>
            )}
          </tbody>
        </table>
        <div className="flex items-center justify-between border-t border-gray-100 px-6 py-4 text-xs text-gray-500">
          <span>Showing {subs?.items?.length ?? 0} of {subs?.total ?? 0} members</span>
          <div className="flex gap-1">
            <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}
              className="rounded-lg border border-gray-200 px-3 py-1 hover:bg-gray-50 disabled:opacity-40">Previous</button>
            <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}
              className="rounded-lg border border-gray-200 px-3 py-1 hover:bg-gray-50 disabled:opacity-40">Next</button>
          </div>
        </div>
      </div>
    </div>
  )
}
