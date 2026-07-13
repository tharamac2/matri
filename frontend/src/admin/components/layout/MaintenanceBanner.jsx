import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import api from '../../services/api.js'

export default function MaintenanceBanner() {
  const [dismissed, setDismissed] = useState(false)

  const { data } = useQuery({
    queryKey: ['settings', 'platform'],
    queryFn: () => api.get('/settings').then((res) => res.data),
    staleTime: 60_000,
    retry: false,
  })

  if (!data?.maintenance_mode || dismissed) return null

  return (
    <div className="flex items-center justify-between gap-3 border-b border-amber-200 bg-amber-50 px-6 py-2 text-sm text-amber-800">
      <span>
        <strong className="font-semibold">Maintenance mode is enabled.</strong> Members may see a maintenance notice on the platform while this is active.
      </span>
      <button
        type="button"
        onClick={() => setDismissed(true)}
        className="shrink-0 rounded-lg px-2 py-1 text-xs font-medium text-amber-700 hover:bg-amber-100"
        aria-label="Dismiss maintenance mode banner"
      >
        Dismiss
      </button>
    </div>
  )
}
