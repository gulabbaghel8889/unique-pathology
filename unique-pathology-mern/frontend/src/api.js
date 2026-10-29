/**
 * Centralized API Base URL Resolver
 * Ensures that all API calls route to `${VITE_API_URL}/api` in both local and production environments,
 * regardless of whether VITE_API_URL was set with or without a trailing slash or '/api'.
 */
function resolveApiBaseUrl() {
  const rawUrl = (import.meta.env.VITE_API_URL || '').trim()

  if (!rawUrl) {
    // If not provided:
    // In production (e.g. Vercel deployment): default to live Render backend with /api
    // In development: default to localhost:5000/api
    return import.meta.env.PROD
      ? 'https://unique-pathology.onrender.com/api'
      : 'http://localhost:5000/api'
  }

  // Strip trailing slashes
  const cleanUrl = rawUrl.replace(/\/+$/, '')

  // If already ends with /api, use as is; otherwise append /api
  if (cleanUrl.endsWith('/api')) {
    return cleanUrl
  }

  return `${cleanUrl}/api`
}

export const API_BASE = resolveApiBaseUrl()

// Admin Token Storage
export function getAdminToken() {
  return localStorage.getItem('up_admin_token') || sessionStorage.getItem('up_admin_token') || ''
}

export function setAdminToken(token, remember = true) {
  if (remember) {
    localStorage.setItem('up_admin_token', token)
  } else {
    sessionStorage.setItem('up_admin_token', token)
  }
}

export function clearAdminToken() {
  localStorage.removeItem('up_admin_token')
  sessionStorage.removeItem('up_admin_token')
}

// Doctor Token Storage (Completely separate from Admin)
export function getDoctorToken() {
  return localStorage.getItem('up_doctor_token') || sessionStorage.getItem('up_doctor_token') || ''
}

export function setDoctorToken(token, remember = true) {
  if (remember) {
    localStorage.setItem('up_doctor_token', token)
  } else {
    sessionStorage.setItem('up_doctor_token', token)
  }
}

export function clearDoctorToken() {
  localStorage.removeItem('up_doctor_token')
  sessionStorage.removeItem('up_doctor_token')
}

export async function apiRequest(endpoint, options = {}) {
  // Normalize endpoint: ensure leading slash
  let cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`

  // Guard against accidental double '/api/api/...' if an endpoint is called with '/api/...'
  if (cleanEndpoint === '/api') {
    cleanEndpoint = ''
  } else if (cleanEndpoint.startsWith('/api/')) {
    cleanEndpoint = cleanEndpoint.slice(4) // e.g. '/api/tests' -> '/tests'
  }

  const url = `${API_BASE}${cleanEndpoint}`
  const headers = {
    ...options.headers,
  }

  // If not FormData, default Content-Type to application/json
  if (!(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json'
  }

  // Resolve appropriate token (Doctor vs Admin)
  if (!headers['Authorization']) {
    let token = options.token

    if (!token) {
      if (options.authType === 'admin') {
        token = getAdminToken()
      } else if (options.authType === 'doctor') {
        token = getDoctorToken()
      } else {
        // Auto-detect based on endpoint path prefix
        if (cleanEndpoint.startsWith('/admin') || cleanEndpoint.startsWith('/auth/admin')) {
          token = getAdminToken()
        } else if (cleanEndpoint.startsWith('/doctor') || cleanEndpoint.startsWith('/auth/doctor')) {
          token = getDoctorToken()
        } else {
          token = getAdminToken() || getDoctorToken()
        }
      }
    }

    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }
  }

  const res = await fetch(url, {
    ...options,
    headers,
  })

  // Handle binary / stream responses (such as report download)
  const contentType = res.headers.get('content-type') || ''
  if (contentType.includes('application/pdf') || contentType.includes('octet-stream')) {
    if (!res.ok) {
      throw new Error(`Download failed with status ${res.status}`)
    }
    return res.blob()
  }

  const data = await res.json().catch(() => ({}))

  if (!res.ok) {
    const errorMsg = data.message || `Request failed with status ${res.status}`
    const error = new Error(errorMsg)
    error.status = res.status
    error.data = data
    throw error
  }

  return data
}
