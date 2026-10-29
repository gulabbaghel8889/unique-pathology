import React, { createContext, useContext, useState, useEffect } from 'react'
import { apiRequest, getAdminToken, setAdminToken, clearAdminToken } from '../api.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [token, setTokenState] = useState(getAdminToken())
  const [admin, setAdmin] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadAdmin() {
      const storedToken = getAdminToken()
      if (!storedToken) {
        setLoading(false)
        return
      }

      try {
        const data = await apiRequest('/auth/admin/me')
        setAdmin(data.admin)
      } catch (err) {
        console.warn('Admin token validation failed:', err.message)
        clearAdminToken()
        setTokenState('')
        setAdmin(null)
      } finally {
        setLoading(false)
      }
    }

    loadAdmin()
  }, [])

  async function login(email, password, remember = true) {
    const data = await apiRequest('/auth/admin/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })

    setAdminToken(data.token, remember)
    setTokenState(data.token)
    setAdmin(data.admin)
    return data
  }

  function logout() {
    clearAdminToken()
    setTokenState('')
    setAdmin(null)
  }

  return (
    <AuthContext.Provider
      value={{
        token,
        admin,
        isAuthenticated: Boolean(token && admin),
        loading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
