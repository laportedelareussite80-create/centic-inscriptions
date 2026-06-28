'use client'

import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useState } from 'react'

const menuItems = [
  { href: '/admin/dashboard', icon: '📊', label: 'Tableau de bord' },
  { href: '/admin/inscriptions', icon: '📋', label: 'Inscriptions' },
  { href: '/admin/encadreurs', icon: '🧑‍🏫', label: 'Encadreurs' },
  { href: '/admin/annees', icon: '📅', label: 'Années' },
  { href: '/admin/sessions', icon: '🗂️', label: 'Sessions' },
  { href: '/admin/classes', icon: '🏫', label: 'Classes' },
  { href: '/admin/modules', icon: '📚', label: 'Modules' },
  { href: '/admin/exports', icon: '📤', label: 'Exports' },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/admin/login')
  }

  if (pathname === '/admin/login') return <>{children}</>

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: 'Segoe UI, Arial, sans-serif' }}>

      {/* SIDEBAR */}
      <aside style={{
        width: sidebarOpen ? '240px' : '70px',
        background: 'linear-gradient(180deg, #0D1B4B 0%, #1A3A8F 100%)',
        display: 'flex', flexDirection: 'column',
        transition: 'width 0.3s ease',
        position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 100,
        overflow: 'hidden'
      }}>
        {/* Logo */}
        <div style={{
          padding: '20px 16px', borderBottom: '1px solid rgba(255,255,255,0.1)',
          display: 'flex', alignItems: 'center', gap: '12px', minHeight: '80px'
        }}>
          <img src="/images/logo_centic.jpg" alt="CENTIC"
            style={{ width: '40px', height: '40px', borderRadius: '8px', objectFit: 'cover', flexShrink: 0 }} />
          {sidebarOpen && (
            <div>
              <p style={{ color: 'white', fontWeight: '800', fontSize: '16px', lineHeight: 1.2 }}>CENTIC</p>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px' }}>Administration</p>
            </div>
          )}
        </div>

        {/* Menu */}
        <nav style={{ flex: 1, padding: '16px 8px', overflowY: 'auto' }}>
          {menuItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <button
                key={item.href}
                onClick={() => router.push(item.href)}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center',
                  gap: '12px', padding: '12px 12px', borderRadius: '10px',
                  border: 'none', cursor: 'pointer', marginBottom: '4px',
                  background: isActive ? 'rgba(255,255,255,0.15)' : 'transparent',
                  color: isActive ? 'white' : 'rgba(255,255,255,0.6)',
                  fontWeight: isActive ? '700' : '500',
                  fontSize: '14px', transition: 'all 0.2s', textAlign: 'left',
                  whiteSpace: 'nowrap'
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.08)'
                    ;(e.currentTarget as HTMLButtonElement).style.color = 'white'
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    (e.currentTarget as HTMLButtonElement).style.background = 'transparent'
                    ;(e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.6)'
                  }
                }}
              >
                <span style={{ fontSize: '20px', flexShrink: 0 }}>{item.icon}</span>
                {sidebarOpen && <span>{item.label}</span>}
                {sidebarOpen && isActive && (
                  <span style={{
                    marginLeft: 'auto', width: '6px', height: '6px',
                    background: '#E8510A', borderRadius: '50%', flexShrink: 0
                  }} />
                )}
              </button>
            )
          })}
        </nav>

        {/* Déconnexion */}
        <div style={{ padding: '16px 8px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <button
            onClick={handleLogout}
            style={{
              width: '100%', display: 'flex', alignItems: 'center',
              gap: '12px', padding: '12px', borderRadius: '10px',
              border: 'none', cursor: 'pointer',
              background: 'rgba(239,68,68,0.15)', color: '#fca5a5',
              fontSize: '14px', fontWeight: '600', whiteSpace: 'nowrap'
            }}
          >
            <span style={{ fontSize: '20px', flexShrink: 0 }}>🚪</span>
            {sidebarOpen && <span>Déconnexion</span>}
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <div style={{
        marginLeft: sidebarOpen ? '240px' : '70px',
        flex: 1, display: 'flex', flexDirection: 'column',
        transition: 'margin-left 0.3s ease', minHeight: '100vh'
      }}>
        {/* TOP BAR */}
        <header style={{
          background: 'white', padding: '0 24px',
          height: '64px', display: 'flex', alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
          position: 'sticky', top: 0, zIndex: 50
        }}>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontSize: '20px', padding: '8px', borderRadius: '8px',
              color: '#0D1B4B'
            }}
          >
            {sidebarOpen ? '◀' : '▶'}
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '13px', color: '#666' }}>Administrateur CENTIC</span>
            <div style={{
              width: '36px', height: '36px', borderRadius: '50%',
              background: '#0D1B4B', display: 'flex', alignItems: 'center',
              justifyContent: 'center', color: 'white', fontWeight: '700', fontSize: '14px'
            }}>A</div>
          </div>
        </header>

        {/* PAGE CONTENT */}
        <main style={{ flex: 1, padding: '32px 24px', background: '#f8faff' }}>
          {children}
        </main>
      </div>
    </div>
  )
}