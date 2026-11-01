import React, { createContext, useContext, useState, useEffect } from 'react'
import { apiRequest, getDoctorToken, setDoctorToken, clearDoctorToken } from '../api.js'

const DoctorAuthContext = createContext(null)

export function DoctorAuthProvider({ children }) {
  const [token, setTokenState] = useState(getDoctorToken())
  const [doctor, setDoctor] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadDoctor() {
      const storedToken = getDoctorToken()
      if (!storedToken) {
        setLoading(false)
        return
      }

      try {
        const data = await apiRequest('/auth/doctor/me', { authType: 'doctor' })
        setDoctor(data.doctor)
      } catch (err) {
        console.warn('Doctor token validation failed:', err.message)
        clearDoctorToken()
        setTokenState('')
        setDoctor(null)
      } finally {
        setLoading(false)
      }
    }

    loadDoctor()
  }, [])

  async function login(identifier, password, remember = true) {
    const data = await apiRequest('/auth/doctor/login', {
      method: 'POST',
      body: JSON.stringify({ identifier, password }),
    })

    setDoctorToken(data.token, remember)
    setTokenState(data.token)
    setDoctor(data.doctor)
    return data
  }

  function logout() {
    clearDoctorToken()
    setTokenState('')
    setDoctor(null)
  }

  async function refreshDoctor() {
    try {
      const data = await apiRequest('/auth/doctor/me', { authType: 'doctor' })
      setDoctor(data.doctor)
      return data.doctor
    } catch (err) {
      console.warn('Could not refresh doctor data:', err.message)
    }
  }

  return (
    <DoctorAuthContext.Provider
      value={{
        token,
        doctor,
        isAuthenticated: Boolean(token && doctor),
        loading,
        login,
        logout,
        refreshDoctor,
      }}
    >
      {children}
    </DoctorAuthContext.Provider>
  )
}

export function useDoctorAuth() {
  const context = useContext(DoctorAuthContext)
  if (!context) {
    return {
      token: '',
      doctor: null,
      isAuthenticated: false,
      loading: false,
      login: async () => {},
      logout: () => {},
      refreshDoctor: async () => null,
    }
  }
  return context
}
