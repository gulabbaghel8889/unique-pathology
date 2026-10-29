import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Home, TestTube2, CalendarPlus, Clock, FileText, ShieldCheck } from 'lucide-react'

export function MobileBottomNav() {
  const location = useLocation()

  const tabs = [
    { label: 'Home', path: '/', icon: Home },
    { label: 'Tests', path: '/tests', icon: TestTube2 },
    { label: 'Book', path: '/book', icon: CalendarPlus, isCenter: true },
    { label: 'Track', path: '/track', icon: Clock },
    { label: 'Reports', path: '/reports', icon: ShieldCheck },
  ]

  const isActive = (path) => {
    if (path === '/' && location.pathname === '/') return true
    if (path !== '/' && location.pathname.startsWith(path)) return true
    return false
  }

  return (
    <nav className="mobile-bottom-nav md:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-lg border-t border-slate-200/90 shadow-[0_-8px_30px_rgba(0,0,0,0.08)] py-1.5 px-3">
      <div className="flex items-center justify-around">
        {tabs.map((tab) => {
          const active = isActive(tab.path)
          const Icon = tab.icon

          if (tab.isCenter) {
            return (
              <Link
                key={tab.path}
                to={tab.path}
                className="relative -top-4 flex flex-col items-center group focus:outline-none"
              >
                <div className="grid h-14 w-14 place-items-center rounded-full bg-gradient-to-tr from-[#073b66] to-cyan-500 text-white shadow-lg shadow-cyan-600/35 border-4 border-white transition transform group-hover:scale-105 active:scale-95 animate-pulseSlow">
                  <Icon size={24} />
                </div>
                <span className="text-[10px] font-black tracking-tight text-[#073b66] mt-0.5">
                  Book Test
                </span>
              </Link>
            )
          }

          return (
            <Link
              key={tab.path}
              to={tab.path}
              className={`flex flex-col items-center py-1 px-2.5 rounded-xl transition ${
                active
                  ? 'text-cyan-700 font-extrabold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <div className={`p-1 rounded-lg ${active ? 'bg-cyan-50' : ''}`}>
                <Icon size={20} className={active ? 'text-cyan-600' : 'text-slate-500'} />
              </div>
              <span className={`text-[10px] tracking-tight ${active ? 'font-black' : 'font-semibold'}`}>
                {tab.label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
