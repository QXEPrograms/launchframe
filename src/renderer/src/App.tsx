import React, { useState, useEffect } from 'react'
import { onAuth } from './lib/firebase'
import type { User } from 'firebase/auth'
import { Sidebar } from './components/Sidebar'
import { LogoIcon } from './components/LogoIcon'
import { LoginPage } from './pages/LoginPage'
import { HomePage } from './pages/HomePage'
import { FastFlagsPage } from './pages/FastFlagsPage'
import { IntegrationsPage } from './pages/IntegrationsPage'
import { BehaviorPage } from './pages/BehaviorPage'
import { SettingsPage } from './pages/SettingsPage'
import type { Page } from './types'

export default function App() {
  const [user, setUser] = useState<User | null | 'loading'>('loading')
  const [page, setPage] = useState<Page>('home')

  useEffect(() => {
    return onAuth((u) => setUser(u))
  }, [])

  if (user === 'loading') {
    return (
      <div className="h-screen flex items-center justify-center" style={{ background: '#0f0f12' }}>
        <div className="flex flex-col items-center gap-3">
          <div style={{ filter: 'drop-shadow(0 4px 20px rgba(0,114,255,0.4))' }}>
            <LogoIcon size={52} />
          </div>
          <div className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>Loading…</div>
        </div>
      </div>
    )
  }

  if (!user) return <LoginPage onLogin={() => {}} />

  const pages: Record<Page, React.ReactNode> = {
    home:         <HomePage user={user as User} />,
    fastflags:    <FastFlagsPage />,
    integrations: <IntegrationsPage />,
    behavior:     <BehaviorPage />,
    settings:     <SettingsPage user={user as User} />
  }

  return (
    <div
      className="flex h-screen overflow-hidden"
      style={{ borderRadius: 10, overflow: 'hidden', background: 'var(--bg)' }}
    >
      <Sidebar page={page} onChange={setPage} user={user as User} />

      <main className="flex-1 overflow-y-auto" style={{ background: 'var(--bg)' }}>
        <div
          style={{
            height: 'var(--titlebar-h)',
            WebkitAppRegion: 'drag' as any,
            position: 'sticky',
            top: 0,
            zIndex: 10,
            pointerEvents: 'none'
          }}
        />
        <div
          style={{ marginTop: 'calc(-1 * var(--titlebar-h))' }}
          className="animate-fade-up"
          key={page}
        >
          {pages[page]}
        </div>
      </main>
    </div>
  )
}
