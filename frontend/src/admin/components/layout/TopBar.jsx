import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Bell, Settings } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../../context/AuthContext.jsx'
import api from '../../services/api.js'

export default function TopBar() {
  const [query, setQuery] = useState('')
  const [focused, setFocused] = useState(false)
  const navigate = useNavigate()
  const { user } = useAuth()

  const { data } = useQuery({
    queryKey: ['topbar-search', query],
    queryFn: () => api.get('/users', { params: { page: 1, size: 5, search: query } }).then(r => r.data),
    enabled: query.trim().length >= 2,
    keepPreviousData: true,
  })

  const results = data?.items ?? []
  const showDrop = focused && query.trim().length >= 2

  function goTo(id) {
    setQuery('')
    setFocused(false)
    navigate(`/admin/members/${id}`)
  }

  const initials = user?.name
    ? user.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
    : 'SA'

  return (
    <header className="flex h-14 flex-shrink-0 items-center gap-4 border-b border-gray-100 bg-white px-6">
      {/* Search */}
      <div className="relative flex-1 max-w-md">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="search"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 150)}
          placeholder="Search verification requests..."
          className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2 pl-9 pr-4 text-sm text-gray-700 placeholder:text-gray-400 focus:border-brand-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-100"
        />
        {showDrop && (
          <div className="absolute left-0 right-0 top-full z-30 mt-1 max-h-64 overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-card-md">
            {results.length === 0 ? (
              <p className="px-4 py-3 text-sm text-gray-400">No members found.</p>
            ) : results.map(m => (
              <button
                key={m.id}
                type="button"
                onMouseDown={() => goTo(m.id)}
                className="block w-full px-4 py-2.5 text-left text-sm hover:bg-gray-50"
              >
                <span className="font-medium text-gray-900">{m.name}</span>
                <span className="ml-2 text-xs text-gray-400">{m.email}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="ml-auto flex items-center gap-2">
        {/* Bell */}
        <button
          type="button"
          onClick={() => navigate('/admin/notifications')}
          className="relative rounded-lg p-2 text-gray-500 hover:bg-gray-100"
        >
          <Bell size={18} />
        </button>

        {/* Settings */}
        <button
          type="button"
          onClick={() => navigate('/admin/settings')}
          className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
        >
          <Settings size={18} />
        </button>

        {/* Admin avatar */}
        <div className="ml-2 flex items-center gap-2.5">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-semibold text-gray-800">{user?.name || 'Admin Rose'}</p>
            <p className="text-[10px] uppercase tracking-wide text-gray-400">{user?.role?.replace('_', ' ') || 'Super Admin'}</p>
          </div>
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-700 text-xs font-bold text-white">
            {initials}
          </div>
        </div>
      </div>
    </header>
  )
}
