import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import PageWrapper from '../../components/layout/PageWrapper.jsx'
import api from '../../services/api.js'

const RANGE_OPTIONS = [
  { value: 7, label: 'Last 7 days' },
  { value: 30, label: 'Last 30 days' },
  { value: 90, label: 'Last 90 days' },
  { value: 365, label: 'Last 12 months' },
]

const PIE_COLORS = ['#db2777', '#7c3aed', '#0ea5e9', '#f59e0b', '#10b981', '#ef4444', '#6366f1']

function ChartSkeleton() {
  return <div className="h-72 animate-pulse rounded-xl bg-gray-200 dark:bg-gray-800" />
}

function KpiCard({ label, value, hint }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-900">
      <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">{label}</p>
      <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-gray-100">{value}</p>
      {hint && <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">{hint}</p>}
    </div>
  )
}

function DemographicCard({ title, data }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-900">
      <h3 className="mb-4 text-sm font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
      {data.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">No data available.</p>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie data={data} dataKey="count" nameKey="label" cx="50%" cy="50%" outerRadius={80} label={(entry) => `${entry.label}: ${entry.count}`}>
              {data.map((entry, index) => (
                <Cell key={entry.label} fill={PIE_COLORS[index % PIE_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}

export default function AnalyticsPage() {
  const [days, setDays] = useState(30)

  const demographicsQuery = useQuery({
    queryKey: ['analytics', 'demographics'],
    queryFn: () => api.get('/analytics/demographics').then((res) => res.data),
  })

  const revenueQuery = useQuery({
    queryKey: ['analytics', 'revenue', { days }],
    queryFn: () => api.get('/analytics/revenue', { params: { days } }).then((res) => res.data),
  })

  const matchInsightsQuery = useQuery({
    queryKey: ['analytics', 'matches', { days }],
    queryFn: () => api.get('/analytics/matches', { params: { days } }).then((res) => res.data),
  })

  return (
    <PageWrapper title="Analytics" breadcrumbs={[{ label: 'Dashboard', to: '/' }, { label: 'Analytics' }]}>
      <section className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
        {demographicsQuery.isLoading ? (
          [...Array(3)].map((_, i) => <ChartSkeleton key={i} />)
        ) : demographicsQuery.isError ? (
          <p className="col-span-full rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
            Failed to load demographics.
          </p>
        ) : (
          <>
            <DemographicCard title="Members by gender" data={demographicsQuery.data.by_gender} />
            <DemographicCard title="Members by religion" data={demographicsQuery.data.by_religion} />
            <DemographicCard title="Members by age group" data={demographicsQuery.data.by_age_group} />
          </>
        )}
      </section>

      <section>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">Revenue trend</h2>
          <select
            value={days}
            onChange={(event) => setDays(Number(event.target.value))}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
          >
            {RANGE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-900">
          {revenueQuery.isLoading ? (
            <ChartSkeleton />
          ) : revenueQuery.isError ? (
            <p className="text-sm text-red-700 dark:text-red-300">Failed to load revenue data.</p>
          ) : (
            <>
              <p className="mb-3 text-sm text-gray-500 dark:text-gray-400">
                Total revenue in range:{' '}
                <span className="font-semibold text-gray-900 dark:text-gray-100">
                  ₹{Number(revenueQuery.data.total).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </span>
              </p>
              <ResponsiveContainer width="100%" height={288}>
                <BarChart data={revenueQuery.data.points}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="amount" fill="#db2777" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </>
          )}
        </div>
      </section>

      <section className="mt-8">
        <h2 className="mb-4 text-base font-semibold text-gray-900 dark:text-gray-100">Match insights</h2>

        {matchInsightsQuery.isLoading ? (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {[...Array(3)].map((_, i) => (
              <ChartSkeleton key={i} />
            ))}
          </div>
        ) : matchInsightsQuery.isError ? (
          <p className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
            Failed to load match insights.
          </p>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-2">
              <KpiCard label="Total matches" value={matchInsightsQuery.data.total_matches.toLocaleString()} hint={`In the last ${days} days' trend window`} />
              <KpiCard label="Acceptance rate" value={`${matchInsightsQuery.data.acceptance_rate}%`} hint="Share of matches accepted by recipients" />
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <DemographicCard title="Matches by status" data={matchInsightsQuery.data.by_status} />

              <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-900">
                <h3 className="mb-4 text-sm font-semibold text-gray-900 dark:text-gray-100">Matches sent over time</h3>
                {matchInsightsQuery.data.trend.length === 0 ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400">No matches sent in this range.</p>
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <LineChart data={matchInsightsQuery.data.trend}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                      <Tooltip />
                      <Line type="monotone" dataKey="count" stroke="#7c3aed" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </div>
        )}
      </section>
    </PageWrapper>
  )
}
