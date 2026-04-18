import React, { useEffect, useState } from 'react'
import {
  RotateCcw, Monitor, Sun, Moon, ExternalLink, Check,
  Heart, MessageCircle, LogOut
} from 'lucide-react'
import { signOut } from '../lib/firebase'
import type { User as FirebaseUser } from 'firebase/auth'
import { LogoIcon } from '../components/LogoIcon'

interface Props {
  user: FirebaseUser
}

export function SettingsPage({ user }: Props) {
  const [version, setVersion]     = useState('')
  const [theme, setTheme]         = useState<'system' | 'light' | 'dark'>('system')
  const [resetDone, setResetDone] = useState(false)
  const [robloxVer, setRobloxVer] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      const [v, s, rv] = await Promise.all([
        window.api.app.getVersion(),
        window.api.settings.getAll(),
        window.api.roblox.getVersion()
      ])
      setVersion(v)
      setTheme(s['appearance.theme'] ?? 'system')
      setRobloxVer(rv)
    }
    load()
  }, [])

  async function resetAll() {
    if (!confirm('Reset all settings to defaults?')) return
    await window.api.settings.reset()
    setTheme('system')
    setResetDone(true)
    setTimeout(() => setResetDone(false), 2000)
  }

  function open(url: string) { window.api.app.openExternal(url) }

  const themeOptions: { value: 'system'|'light'|'dark'; label: string; icon: React.ElementType }[] = [
    { value: 'system', label: 'System', icon: Monitor },
    { value: 'light',  label: 'Light',  icon: Sun },
    { value: 'dark',   label: 'Dark',   icon: Moon }
  ]

  return (
    <div className="px-6 pb-6" style={{ paddingTop: 'var(--titlebar-h)' }}>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>App preferences and account</p>
      </div>

      {/* About card */}
      <div className="mb-4">
        <div className="section-header px-1">About</div>
        <div className="card overflow-hidden">
          <div className="p-5 flex items-center gap-4">
            <div style={{ filter: 'drop-shadow(0 4px 16px rgba(0,114,255,0.35))' }}>
              <LogoIcon size={56} />
            </div>
            <div>
              <div className="text-lg font-bold text-white">LaunchFrame</div>
              <div className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>Version {version || '0.1.0'}</div>
              <div
                className="text-xs mt-1 font-semibold tracking-wide uppercase"
                style={{ color: 'rgba(255,255,255,0.3)' }}
              >
                Made by QXEPrograms
              </div>
            </div>
          </div>
          <div className="setting-row">
            <div className="text-sm text-white">Roblox Version</div>
            <div className="text-sm" style={{ color: 'var(--text-muted)' }}>
              {robloxVer ?? 'Not installed'}
            </div>
          </div>
        </div>
      </div>

      {/* Account */}
      <div className="mb-4">
        <div className="section-header px-1">Account</div>
        <div className="card overflow-hidden">
          <div className="setting-row">
            <div className="flex items-center gap-3">
              {user.photoURL ? (
                <img src={user.photoURL} className="w-9 h-9 rounded-full flex-shrink-0" alt="avatar" />
              ) : (
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                  style={{ background: 'linear-gradient(135deg, #007AFF 0%, #5856D6 100%)' }}
                >
                  {(user.displayName ?? user.email ?? 'U')[0].toUpperCase()}
                </div>
              )}
              <div>
                <div className="text-sm font-medium text-white">
                  {user.displayName ?? user.email?.split('@')[0]}
                </div>
                {user.email && (
                  <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{user.email}</div>
                )}
              </div>
            </div>
            <button className="btn-danger text-xs" onClick={() => signOut()}>
              <LogOut size={13} /> Sign Out
            </button>
          </div>
        </div>
      </div>

      {/* Appearance */}
      <div className="mb-4">
        <div className="section-header px-1">Appearance</div>
        <div className="card p-4">
          <div className="text-sm font-medium text-white mb-3">Theme</div>
          <div className="flex gap-2">
            {themeOptions.map(({ value, label, icon: Icon }) => {
              const active = theme === value
              return (
                <button
                  key={value}
                  onClick={async () => {
                    setTheme(value)
                    await window.api.settings.set('appearance.theme', value)
                  }}
                  className="flex-1 flex flex-col items-center gap-2 py-3 rounded-mac transition-all"
                  style={{
                    background: active ? 'var(--accent)' : 'rgba(255,255,255,0.05)',
                    border: `1px solid ${active ? 'transparent' : 'var(--border)'}`,
                    color: active ? '#fff' : 'var(--text-muted)'
                  }}
                >
                  <Icon size={18} />
                  <span className="text-xs font-medium">{label}</span>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Support / Community */}
      <div className="mb-4">
        <div className="section-header px-1">Community & Support</div>
        <div className="card overflow-hidden">
          {[
            {
              label: 'Discord Server',
              desc: 'Get help, report bugs, and chat with the community',
              icon: MessageCircle,
              url: 'https://discord.gg/AsZzX63sKV',
              color: '#5865F2'
            },
            {
              label: 'Support Development',
              desc: 'Help keep AppleBlox free and actively developed',
              icon: Heart,
              url: 'https://discord.gg/AsZzX63sKV',
              color: '#FF2D55'
            },
            {
              label: 'Roblox Website',
              desc: 'Open roblox.com in your browser',
              icon: ExternalLink,
              url: 'https://www.roblox.com',
              color: '#FF3B30'
            }
          ].map(({ label, desc, icon: Icon, url, color }) => (
            <button
              key={label}
              className="setting-row w-full text-left"
              onClick={() => open(url)}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-8 h-8 rounded-mac flex items-center justify-center flex-shrink-0"
                  style={{ background: `${color}20` }}
                >
                  <Icon size={15} style={{ color }} />
                </div>
                <div>
                  <div className="text-sm font-medium text-white">{label}</div>
                  <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{desc}</div>
                </div>
              </div>
              <ExternalLink size={12} style={{ color: 'var(--text-faint)' }} />
            </button>
          ))}
        </div>
      </div>

      {/* Danger zone */}
      <div>
        <div className="section-header px-1">Danger Zone</div>
        <div className="card overflow-hidden">
          <div className="setting-row">
            <div>
              <div className="text-sm font-medium text-white">Reset All Settings</div>
              <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                Restore all preferences to their defaults
              </div>
            </div>
            <button className="btn-danger" onClick={resetAll}>
              {resetDone ? <Check size={13} /> : <RotateCcw size={13} />}
              {resetDone ? 'Done' : 'Reset'}
            </button>
          </div>
          <div className="setting-row">
            <div>
              <div className="text-sm font-medium text-white">Quit AppleBlox</div>
              <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                Fully exit including the menu bar icon
              </div>
            </div>
            <button className="btn-danger" onClick={() => window.api.app.quit()}>
              Quit
            </button>
          </div>
        </div>
      </div>

      {/* Footer credit */}
      <p className="text-center text-xs mt-6 font-semibold tracking-widest uppercase"
        style={{ color: 'rgba(255,255,255,0.12)' }}>
        LaunchFrame · Made with ♥ by QXEPrograms
      </p>
    </div>
  )
}
