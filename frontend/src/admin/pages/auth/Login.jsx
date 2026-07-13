import { useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'

export default function Login() {
  const { login, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (isAuthenticated) {
    const redirectTo = location.state?.from?.pathname || '/admin/'
    return <Navigate to={redirectTo} replace />
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    if (!email.trim() || !password) { setError('Please enter your email and password.'); return }
    setIsSubmitting(true)
    try {
      await login(email.trim(), password)
      navigate('/admin/', { replace: true })
    } catch (err) {
      setError(err.response?.data?.detail || 'Invalid email or password.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen bg-cream-100">
      {/* Left decorative panel */}
      <div className="hidden lg:flex lg:w-1/2 flex-col items-center justify-center bg-brand-700 px-12 text-white">
        <div className="max-w-sm text-center">
          <h1 className="text-4xl font-bold leading-tight">Tharamac Matrimony</h1>
          <p className="mt-3 text-brand-200 text-sm leading-relaxed">
            The administrative hub for managing your premium matrimonial platform.
          </p>
          <div className="mt-10 grid grid-cols-2 gap-4 text-left">
            {[
              { stat: '50,000+', label: 'Verified Members' },
              { stat: '94.2%',   label: 'Resolution Rate'  },
              { stat: '12,000+', label: 'Successful Matches'},
              { stat: '3 Plans', label: 'Membership Tiers'  },
            ].map(item => (
              <div key={item.label} className="rounded-xl bg-white/10 p-4">
                <p className="text-xl font-bold">{item.stat}</p>
                <p className="text-xs text-brand-200">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right – login form */}
      <div className="flex flex-1 items-center justify-center px-6">
        <div className="w-full max-w-sm">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-brand-700 lg:hidden">Tharamac Matrimony</h2>
            <h2 className="text-2xl font-bold text-gray-900 mt-2">Welcome back</h2>
            <p className="mt-1 text-sm text-gray-500">Sign in to manage the platform.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div>
              <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-gray-700">Admin User ID / Email</label>
              <input
                id="email"
                type="text"
                autoComplete="username"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
                placeholder="Enter Admin User ID or Email (e.g. superadmin@matrimonyadmin.com)"
              />
            </div>

            <div>
              <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-gray-700">Password</label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <p role="alert" className="rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-700">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-xl bg-brand-700 px-4 py-3 text-sm font-semibold text-white hover:bg-brand-800 disabled:opacity-60 transition-colors"
            >
              {isSubmitting ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-gray-400">
            Tharamac Matrimony Admin Portal · All rights reserved
          </p>
        </div>
      </div>
    </div>
  )
}
