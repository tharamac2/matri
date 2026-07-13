import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import api, {
  clearTokens,
  getAccessToken,
  registerAuthFailureHandler,
  setTokens,
} from '../services/api.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [member, setMember] = useState(null)
  const [isAuthenticated, setIsAuthenticated] = useState(Boolean(getAccessToken()))
  const [isLoading, setIsLoading] = useState(true)

  function hardLogout() {
    clearTokens()
    setMember(null)
    setIsAuthenticated(false)
  }

  async function loadMe() {
    try {
      const { data } = await api.get('/me')
      setMember(data)
      setIsAuthenticated(true)
    } catch {
      hardLogout()
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    registerAuthFailureHandler(hardLogout)
    if (getAccessToken()) {
      loadMe()
    } else {
      setIsLoading(false)
    }
  }, [])

  function applyAuthResponse(data) {
    setTokens({ accessToken: data.access_token, refreshToken: data.refresh_token })
    setMember({ id: data.member_id, name: data.name })
    setIsAuthenticated(true)
  }

  async function login(phone_number, password) {
    const { data } = await api.post('/auth/login', { phone_number, password })
    applyAuthResponse(data)
    await loadMe()
  }

  async function register(payload) {
    const { data } = await api.post('/auth/register', payload)
    applyAuthResponse(data)
    await loadMe()
  }

  function logout() {
    hardLogout()
  }

  const value = useMemo(
    () => ({ member, isAuthenticated, isLoading, login, register, logout, refreshMe: loadMe }),
    [member, isAuthenticated, isLoading],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within an AuthProvider')
  return context
}
