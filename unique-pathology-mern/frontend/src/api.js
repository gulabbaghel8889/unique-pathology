const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

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
  const url = `${API_BASE}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`
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
        const cleanPath = endpoint.startsWith('/') ? endpoint : `/${endpoint}`
        if (cleanPath.startsWith('/admin') || cleanPath.startsWith('/auth/admin')) {
          token = getAdminToken()
        } else if (cleanPath.startsWith('/doctor') || cleanPath.startsWith('/auth/doctor')) {
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

export { API_BASE }
