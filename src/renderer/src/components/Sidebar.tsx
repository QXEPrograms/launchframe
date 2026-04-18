import React from 'react'
import { Rocket, Flag, Plug, Sliders, Settings, LogOut, MessageCircle } from 'lucide-react'
import { signOut } from '../lib/firebase'
import type { User } from 'firebase/auth'
import type { Page } from '../types'
import { LogoIcon } from './LogoIcon'

interface NavItem {
  id: Page
  label: string
  icon: React.ElementType
}

const nav: NavItem[] = [
  { id: 'home',         label: 'Home',        icon: Rocket },
  { id: 'fastflags',   label: 'Fast Flags',   icon: Flag },
  { id: 'integrations',label: 'Integrations', icon: Plug },
  { id: 'behavior',    label: 'Behavior',      icon: Sliders },
  { id: 'settings',    label: 'Settings',      icon: Settings }
]

interface Props {
  page: Page
  onChange: (p: Page) => void
  user: User
}

export function Sidebar({ page, onChange, user }: Props) {
  const initials = (user.displayName ?? user.email ?? 'U')
    .split(' ')
    .map(w => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  const displayName = user.displayName ?? user.email?.split('@')[0] ?? 'User'

  return (
    <div
      className="flex flex-col h-full select-none"
      style={{
        width: 'var(--sidebar-w)',
        background: 'var(--sidebar-bg)',
        borderRight: '1px solid var(--border)',
        WebkitAppRegion: 'drag' as any
      }}
    >
      {/* Titlebar drag region */}
      <div style={{ height: 'var(--titlebar-h)', flexShrink: 0 }} />

      {/* App identity */}
      <div className="px-4 pb-4" style={{ WebkitAppRegion: 'no-drag' as any }}>
        <div className="flex items-center gap-2.5">
          <LogoIcon size={32} />
          <div className="min-w-0">
            <div className="text-sm font-semibold text-white leading-tight">LaunchFrame</div>
            <div className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
              by QXEPrograms
            </div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav
        className="flex-1 px-2 space-y-0.5 overflow-y-auto"
        style={{ WebkitAppRegion: 'no-drag' as any }}
      >
        {nav.map(({ id, label, icon: Icon }) => {
          const active = page === id
          return (
            <button
              key={id}
              onClick={() => onChange(id)}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-mac text-sm text-left transition-all duration-100"
              style={{
                background: active ? 'var(--accent)' : 'transparent',
                color: active ? '#fff' : 'var(--text-muted)',
                fontWeight: active ? 500 : 400
              }}
              onMouseEnter={e => {
                if (!active) e.currentTarget.style.background = 'rgba(255,255,255,0.07)'
              }}
              onMouseLeave={e => {
                if (!active) e.currentTarget.style.background = 'transparent'
              }}
            >
              <Icon size={15} strokeWidth={active ? 2.2 : 1.8} />
              {label}
            </button>
          )
        })}
      </nav>

      {/* Bottom section */}
      <div
        className="px-3 py-3 space-y-1"
        style={{ borderTop: '1px solid var(--border)', WebkitAppRegion: 'no-drag' as any }}
      >
        {/* Discord support */}
        <button
          onClick={() => window.api.app.openExternal('https://discord.gg/AsZzX63sKV')}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-mac text-xs transition-all"
          style={{ color: 'rgba(255,255,255,0.4)' }}
          onMouseEnter={e => {
            e.currentTarget.style.background = 'rgba(88,101,242,0.15)'
            e.currentTarget.style.color = '#5865F2'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'transparent'
            e.currentTarget.style.color = 'rgba(255,255,255,0.4)'
          }}
        >
          <MessageCircle size={14} />
          Discord Support
        </button>

        {/* User row */}
        <div className="flex items-center gap-2 px-1 py-1">
          {user.photoURL ? (
            <img
              src={user.photoURL}
              alt="avatar"
              className="w-7 h-7 rounded-full flex-shrink-0"
            />
          ) : (
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #00c6ff 0%, #0072ff 100%)' }}
            >
              {initials}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="text-xs font-medium text-white truncate">{displayName}</div>
            {user.email && (
              <div className="text-xs truncate" style={{ color: 'var(--text-faint)' }}>
                {user.email}
              </div>
            )}
          </div>
          <button
            onClick={() => signOut()}
            title="Sign out"
            className="flex-shrink-0 p-1 rounded transition-colors"
            style={{ color: 'var(--text-faint)' }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--red)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-faint)')}
          >
            <LogOut size={13} />
          </button>
        </div>
      </div>
    </div>
  )
}
