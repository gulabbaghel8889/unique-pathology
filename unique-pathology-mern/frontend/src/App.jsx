import React, { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, useLocation, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext.jsx'
import { Navbar } from './components/Navbar.jsx'
import { Footer } from './components/Footer.jsx'
import { WhatsAppButton } from './components/WhatsAppButton.jsx'
import { MobileBottomNav } from './components/MobileBottomNav.jsx'
import { ScrollProgressAndTop } from './components/ScrollProgressAndTop.jsx'
import { useScrollReveal } from './hooks/useScrollReveal.js'
import { HomePage } from './pages/HomePage.jsx'
import { AboutPage } from './pages/AboutPage.jsx'
import { TestsPage } from './pages/TestsPage.jsx'
import { PackagesPage } from './pages/PackagesPage.jsx'
import { BookingPage } from './pages/BookingPage.jsx'
import { TrackPage } from './pages/TrackPage.jsx'
import { ReportsPage } from './pages/ReportsPage.jsx'
import { ContactPage } from './pages/ContactPage.jsx'
import { FaqsPage } from './pages/FaqsPage.jsx'
import { PrivacyPolicyPage } from './pages/PrivacyPolicyPage.jsx'
import { TermsPage } from './pages/TermsPage.jsx'
import { AdminLoginPage } from './pages/AdminLoginPage.jsx'
import { AdminDashboardPage } from './pages/AdminDashboardPage.jsx'
import { apiRequest } from './api.js'

function AppContent() {
  const location = useLocation()
  const isAdminDashboard = location.pathname.startsWith('/admin') && location.pathname !== '/admin/login'
  const isPortalView = isAdminDashboard

  const [publicConfig, setPublicConfig] = useState(null)

  useEffect(() => {
    async function loadPublicConfig() {
      try {
        const data = await apiRequest('/config/public')
        setPublicConfig(data)
      } catch (err) {
        console.warn('Could not load public config:', err.message)
      }
    }
    loadPublicConfig()
  }, [])

  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [location.pathname])

  // Trigger scroll-reveal animations across all pages on route change
  useScrollReveal([location.pathname])

  return (
    <div className="min-h-screen flex flex-col bg-white text-slate-800">
      <ScrollProgressAndTop />
      {!isPortalView && <Navbar publicConfig={publicConfig} />}

      <main className="flex-1">
        <Routes>
          <Route path="/" element={<HomePage publicConfig={publicConfig} />} />
          <Route path="/about" element={<AboutPage publicConfig={publicConfig} />} />
          <Route path="/tests" element={<TestsPage />} />
          <Route path="/packages" element={<PackagesPage />} />
          <Route path="/book" element={<BookingPage />} />
          <Route path="/track" element={<TrackPage />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/contact" element={<ContactPage publicConfig={publicConfig} />} />
          <Route path="/faqs" element={<FaqsPage />} />
          <Route path="/privacy" element={<PrivacyPolicyPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/admin/login" element={<AdminLoginPage />} />
          <Route path="/admin" element={<AdminDashboardPage />} />
          <Route path="/doctor/login" element={<Navigate to="/admin/login" replace />} />
          <Route path="/doctor" element={<Navigate to="/admin/login" replace />} />
          <Route path="/login" element={<Navigate to="/admin/login" replace />} />
          <Route path="*" element={<HomePage publicConfig={publicConfig} />} />
        </Routes>
      </main>

      {!isPortalView && <Footer publicConfig={publicConfig} />}

      {/* Mobile App Bottom Navigation Bar */}
      {!isPortalView && <MobileBottomNav />}

      {/* Floating WhatsApp Action Button */}
      {!isPortalView && (
        <WhatsAppButton
          isConfigured={Boolean(publicConfig?.business?.isWhatsAppConfigured)}
          whatsappNumber={publicConfig?.business?.whatsappNumber || ''}
          phone={publicConfig?.business?.phone || ''}
        />
      )}
    </div>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
