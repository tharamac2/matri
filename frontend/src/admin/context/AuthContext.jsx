import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import api, {
  clearTokens,
  getAccessToken,
  getRefreshToken,
  registerAuthFailureHandler,
  setTokens,
} from '../services/api.js'

function decodeTokenPayload(token) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    return { role: payload.role ?? null, adminId: payload.sub ? Number(payload.sub) : null }
  } catch {
    return { role: null, adminId: null }
  }
}

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [role, setRole] = useState(null)
  const [adminId, setAdminId] = useState(null)
  const [isAuthenticated, setIsAuthenticated] = useState(Boolean(getAccessToken()))
  const [isLoading, setIsLoading] = useState(true)

  function hardLogout() {
    clearTokens()
    setUser(null)
    setRole(null)
    setAdminId(null)
    setIsAuthenticated(false)
  }

  useEffect(() => {
    registerAuthFailureHandler(hardLogout)

    const token = getAccessToken()
    if (token) {
      const { role: decodedRole, adminId: decodedId } = decodeTokenPayload(token)
      setRole(decodedRole)
      setAdminId(decodedId)
      setIsAuthenticated(true)
    }
    setIsLoading(false)
  }, [])

  async function login(email, password) {
    const { data } = await api.post('/auth/login', { email, password })
    setTokens({ accessToken: data.access_token, refreshToken: data.refresh_token })
    const { role: decodedRole, adminId: decodedId } = decodeTokenPayload(data.access_token)
    setRole(decodedRole)
    setAdminId(decodedId)
    setUser({ email, name: email.split('@')[0].replace(/[._]/g,' ').replace(/\b\w/g,c=>c.toUpperCase()), role: decodedRole })
    setIsAuthenticated(true)
    return decodedRole
  }

  async function logout() {
    const refreshToken = getRefreshToken()
    try {
      if (refreshToken) {
        await api.post('/auth/logout', { refresh_token: refreshToken })
      }
    } catch {
      // Ignore failures — we clear local state regardless.
    } finally {
      hardLogout()
    }
  }

  async function refreshToken() {
    const refresh = getRefreshToken()
    if (!refresh) throw new Error('No refresh token available')

    const { data } = await api.post('/auth/refresh', { refresh_token: refresh })
    setTokens({ accessToken: data.access_token })
    const { role: decodedRole, adminId: decodedId } = decodeTokenPayload(data.access_token)
    setRole(decodedRole)
    setAdminId(decodedId)
    setIsAuthenticated(true)
    return data.access_token
  }

  const value = useMemo(
    () => ({ user, role, adminId, isAuthenticated, isLoading, login, logout, refreshToken }),
    [user, role, adminId, isAuthenticated, isLoading],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within an AuthProvider')
  return context
}
