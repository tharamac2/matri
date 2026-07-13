import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { SlidersHorizontal, MapPin, CheckCircle2, Crown } from 'lucide-react'
import api from '../../services/api.js'

function MemberBadge({ status }) {
  if (status === 'active') return <span className="badge-premium">Premium</span>
  return null
}

function VerifiedBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
      <CheckCircle2 size={10} /> Verified
    </span>
  )
}

const STATUS_COLORS = {
  active: 'bg-emerald-400',
  inactive: 'bg-gray-400',
  banned: 'bg-red-400',
  pending: 'bg-amber-400',
}

export default function MembersList() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [gender, setGender] = useState('')
  const [religion, setReligion] = useState('')
  const queryClient = useQueryClient()
  const size = 12

  const { data, isLoading, isError } = useQuery({
    queryKey: ['members', { page, search, gender, religion }],
    queryFn: () => api.get('/users', { params: { page, size, search: search || undefined, gender: gender || undefined, religion: religion || undefined } }).then(r => r.data),
    keepPreviousData: true,
  })

  const { data: maleCountData } = useQuery({
    queryKey: ['members', 'count', 'male'],
    queryFn: () => api.get('/users', { params: { page: 1, size: 1, gender: 'male' } }).then(r => r.data),
  })
  const { data: femaleCountData } = useQuery({
    queryKey: ['members', 'count', 'female'],
    queryFn: () => api.get('/users', { params: { page: 1, size: 1, gender: 'female' } }).then(r => r.data),
  })

  const suspendMutation = useMutation({
    mutationFn: ({ id, newStatus }) => api.put(`/users/${id}/status`, { status: newStatus }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['members'] }),
  })

  const totalPages = data ? Math.max(1, Math.ceil(data.total / size)) : 1

  // Summary counts across the whole dataset, not just the current page
  const total     = data?.total ?? 0
  const males     = maleCountData?.total ?? 0
  const females   = femaleCountData?.total ?? 0

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Member Management</h1>
          <p className="mt-1 text-sm text-gray-500">Review and manage the elite community of Tharamac Matrimony.</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500">Gender</label>
          <select value={gender} onChange={e => { setGender(e.target.value); setPage(1) }}
            className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-100">
            <option value="">All Genders</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500">Religion</label>
          <select value={religion} onChange={e => { setReligion(e.target.value); setPage(1) }}
            className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-100">
            <option value="">All Religions</option>
            <option value="Hindu">Hindu</option>
            <option value="Muslim">Muslim</option>
            <option value="Christian">Christian</option>
            <option value="Sikh">Sikh</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500">Search</label>
          <input type="search" value={search} onChange={e => { setSearch(e.target.value); setPage(1) }}
            placeholder="Search name, email…"
            className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-100" />
        </div>
        <button
          type="button"
          className="btn-primary py-2"
          onClick={() => queryClient.invalidateQueries({ queryKey: ['members'] })}
        >
          <SlidersHorizontal size={14} />
          Apply Filters
        </button>

        {data && (
          <div className="ml-auto flex gap-6 text-center">
            <div><p className="text-xl font-bold text-gray-900">{total.toLocaleString()}</p><p className="text-xs text-gray-400">Total</p></div>
            <div><p className="text-xl font-bold text-gray-900">{males}</p><p className="text-xs text-gray-400">Male</p></div>
            <div><p className="text-xl font-bold text-gray-900">{females}</p><p className="text-xs text-gray-400">Female</p></div>
          </div>
        )}
      </div>

      {/* Cards grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-72 animate-pulse rounded-xl bg-gray-200" />
          ))}
        </div>
      ) : isError ? (
        <p className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">Failed to load members.</p>
      ) : (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-4">
          {data.items.map(member => (
            <div key={member.id} className="card overflow-hidden group">
              {/* Photo */}
              <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
                {member.photo_url
                  ? <img src={member.photo_url} alt={member.name} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  : <div className="flex h-full items-center justify-center text-3xl font-bold text-gray-300">{member.name[0]}</div>
                }
                {/* Status dot */}
                <span className={`absolute right-2 top-2 h-3 w-3 rounded-full border-2 border-white ${STATUS_COLORS[member.status] ?? 'bg-gray-400'}`} />
                {/* Badges overlay */}
                <div className="absolute bottom-2 left-2 flex flex-wrap gap-1">
                  {member.status === 'active' && <span className="badge-premium">Premium</span>}
                  {member.photo_status === 'approved' && <VerifiedBadge />}
                </div>
              </div>

              {/* Info */}
              <div className="p-3 space-y-1">
                <p className="font-semibold text-gray-900 truncate">{member.name}</p>
                <div className="flex items-center gap-1 text-xs text-gray-400">
                  {member.dob && <span>{new Date().getFullYear() - new Date(member.dob).getFullYear()} yrs</span>}
                  {member.city && (
                    <>
                      <span>·</span>
                      <MapPin size={10} />
                      <span className="truncate">{member.city}</span>
                    </>
                  )}
                </div>
                {member.religion && <p className="text-xs text-gray-400">{member.religion}</p>}

                <div className="flex gap-2 pt-2">
                  <Link to={`/admin/members/${member.id}`} className="flex-1 rounded-lg border border-brand-200 py-1.5 text-center text-xs font-semibold text-brand-700 hover:bg-brand-50 transition-colors">
                    View
                  </Link>
                  <button
                    type="button"
                    onClick={() => suspendMutation.mutate({ id: member.id, newStatus: member.status === 'banned' ? 'active' : 'banned' })}
                    className="flex-1 rounded-lg border border-gray-200 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
                  >
                    {member.status === 'banned' ? 'Unban' : 'Suspend'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {data && (
        <div className="flex items-center justify-between text-sm text-gray-500">
          <p>Showing {((page - 1) * size) + 1}–{Math.min(page * size, data.total)} of {data.total.toLocaleString()} members</p>
          <div className="flex items-center gap-1">
            <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}
              className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs hover:bg-gray-50 disabled:opacity-40">Previous</button>
            {[...Array(Math.min(totalPages, 5))].map((_, i) => {
              const p = i + 1
              return (
                <button key={p} onClick={() => setPage(p)}
                  className={`rounded-lg border px-3 py-1.5 text-xs ${page === p ? 'border-brand-700 bg-brand-700 text-white' : 'border-gray-200 hover:bg-gray-50'}`}>
                  {p}
                </button>
              )
            })}
            <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}
              className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs hover:bg-gray-50 disabled:opacity-40">Next</button>
          </div>
        </div>
      )}
    </div>
  )
}
