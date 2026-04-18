import React, { useEffect, useState } from 'react'
import { Check, Save, Terminal, Layers, LogIn, X } from 'lucide-react'

export function BehaviorPage() {
  const [launchOnStartup, setLaunchOnStartup] = useState(false)
  const [closeToTray, setCloseToTray]         = useState(true)
  const [multiInstance, setMultiInstance]     = useState(false)
  const [customArgs, setCustomArgs]           = useState('')
  const [channel, setChannel]                 = useState<'production' | 'beta'>('production')
  const [saved, setSaved]                     = useState(false)

  useEffect(() => {
    window.api.settings.getAll().then((s) => {
      setLaunchOnStartup(s['behavior.launchOnStartup'] ?? false)
      setCloseToTray(s['behavior.closeToTray'] ?? true)
      setMultiInstance(s['behavior.multiInstance'] ?? false)
      setCustomArgs(s['behavior.customArgs'] ?? '')
      setChannel(s['behavior.channel'] ?? 'production')
    })
  }, [])

  async function save() {
    await Promise.all([
      window.api.settings.set('behavior.launchOnStartup', launchOnStartup),
      window.api.settings.set('behavior.closeToTray', closeToTray),
      window.api.settings.set('behavior.multiInstance', multiInstance),
      window.api.settings.set('behavior.customArgs', customArgs),
      window.api.settings.set('behavior.channel', channel)
    ])
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const rows = [
    {
      label: 'Launch AppleBlox at Login',
      desc: 'Start AppleBlox automatically when you log in to your Mac',
      value: launchOnStartup,
      onChange: setLaunchOnStartup,
      icon: LogIn,
      iconColor: '#007AFF'
    },
    {
      label: 'Close to Menu Bar',
      desc: 'Keep AppleBlox running in the menu bar when you close the window',
      value: closeToTray,
      onChange: setCloseToTray,
      icon: X,
      iconColor: '#FF9500'
    },
    {
      label: 'Allow Multiple Instances',
      desc: 'Run more than one Roblox window at the same time',
      value: multiInstance,
      onChange: setMultiInstance,
      icon: Layers,
      iconColor: '#AF52DE'
    }
  ]

  return (
    <div className="px-6 pb-6" style={{ paddingTop: 'var(--titlebar-h)' }}>
      <div className="mb-6 flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Behavior</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
            Configure how AppleBlox and Roblox behave
          </p>
        </div>
        <button className="btn-primary" onClick={save}>
          {saved ? <Check size={14} /> : <Save size={14} />}
          {saved ? 'Saved!' : 'Save'}
        </button>
      </div>

      {/* Launch options */}
      <div className="mb-4">
        <div className="section-header px-1">Launch Options</div>
        <div className="card overflow-hidden">
          {rows.map(({ label, desc, value, onChange, icon: Icon, iconColor }) => (
            <div key={label} className="setting-row">
              <div className="flex items-center gap-3">
                <div
                  className="w-8 h-8 rounded-mac flex items-center justify-center flex-shrink-0"
                  style={{ background: `${iconColor}22` }}
                >
                  <Icon size={15} style={{ color: iconColor }} />
                </div>
                <div>
                  <div className="text-sm font-medium text-white">{label}</div>
                  <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                    {desc}
                  </div>
                </div>
              </div>
              <input
                type="checkbox"
                className="toggle"
                checked={value}
                onChange={(e) => onChange(e.target.checked)}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Release channel */}
      <div className="mb-4">
        <div className="section-header px-1">Release Channel</div>
        <div className="card overflow-hidden">
          {(['production', 'beta'] as const).map((ch) => (
            <button
              key={ch}
              className="setting-row w-full text-left"
              onClick={() => setChannel(ch)}
            >
              <div>
                <div className="text-sm font-medium text-white capitalize">{ch}</div>
                <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                  {ch === 'production'
                    ? 'Stable builds — recommended for most users'
                    : 'Beta builds — newer features, may have bugs'}
                </div>
              </div>
              <div
                className="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0"
                style={{
                  borderColor: channel === ch ? 'var(--accent)' : 'var(--text-faint)',
                  background: channel === ch ? 'var(--accent)' : 'transparent'
                }}
              >
                {channel === ch && <div className="w-2 h-2 rounded-full bg-white" />}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Custom launch arguments */}
      <div>
        <div className="section-header px-1">Custom Launch Arguments</div>
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-2">
            <Terminal size={14} style={{ color: 'var(--text-muted)' }} />
            <span className="text-sm font-medium text-white">Arguments</span>
          </div>
          <input
            className="mac-input font-mono text-xs"
            value={customArgs}
            onChange={(e) => setCustomArgs(e.target.value)}
            placeholder="e.g. --no-sandbox"
          />
          <p className="text-xs mt-2" style={{ color: 'var(--text-faint)' }}>
            These are passed directly to the Roblox executable. Leave blank unless you know what you're doing.
          </p>
        </div>
      </div>
    </div>
  )
}
