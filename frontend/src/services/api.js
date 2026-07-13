import axios from 'axios'

const baseURL = import.meta.env.VITE_USER_API_BASE_URL || 'http://localhost:8000/api/app'

const api = axios.create({ baseURL })

const TOKEN_KEY = 'matri_user_access_token'
const REFRESH_KEY = 'matri_user_refresh_token'

export function getAccessToken() {
  return localStorage.getItem(TOKEN_KEY)
}

export function getRefreshToken() {
  return localStorage.getItem(REFRESH_KEY)
}

export function setTokens({ accessToken, refreshToken }) {
  if (accessToken) localStorage.setItem(TOKEN_KEY, accessToken)
  if (refreshToken) localStorage.setItem(REFRESH_KEY, refreshToken)
}

export function clearTokens() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(REFRESH_KEY)
}

api.interceptors.request.use((config) => {
  const token = getAccessToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

let isRefreshing = false
let pendingQueue = []

function resolveQueue(error, token) {
  pendingQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error)
    else resolve(token)
  })
  pendingQueue = []
}

let onAuthFailure = () => {}
export function registerAuthFailureHandler(handler) {
  onAuthFailure = handler
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { config, response } = error
    if (!response || response.status !== 401 || config._retry) {
      return Promise.reject(error)
    }

    if (config.url?.includes('/auth/refresh') || config.url?.includes('/auth/login')) {
      clearTokens()
      onAuthFailure()
      return Promise.reject(error)
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        pendingQueue.push({ resolve, reject })
      }).then((token) => {
        config.headers.Authorization = `Bearer ${token}`
        return api(config)
      })
    }

    config._retry = true
    isRefreshing = true

    try {
      const refreshToken = getRefreshToken()
      if (!refreshToken) throw new Error('No refresh token available')

      const { data } = await axios.post(`${baseURL}/auth/refresh`, { refresh_token: refreshToken })
      setTokens({ accessToken: data.access_token })
      resolveQueue(null, data.access_token)

      config.headers.Authorization = `Bearer ${data.access_token}`
      return api(config)
    } catch (refreshError) {
      resolveQueue(refreshError, null)
      clearTokens()
      onAuthFailure()
      return Promise.reject(refreshError)
    } finally {
      isRefreshing = false
    }
  },
)

export default api
