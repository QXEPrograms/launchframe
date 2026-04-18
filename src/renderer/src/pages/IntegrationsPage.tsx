import React, { useEffect, useState } from 'react'
import { MessageSquare, Globe, Wifi, WifiOff, Check, Save, ExternalLink } from 'lucide-react'

export function IntegrationsPage() {
  const [discordEnabled, setDiscordEnabled]       = useState(true)
  const [showPlaceName, setShowPlaceName]         = useState(true)
  const [showElapsed, setShowElapsed]             = useState(true)
  const [webhookUrl, setWebhookUrl]               = useState('')
  const [discordConnected, setDiscordConnected]   = useState(false)
  const [currentGame, setCurrentGame]             = useState<string | undefined>()
  const [saved, setSaved]                         = useState(false)
  const [loading, setLoading]                     = useState(false)

  useEffect(() => {
    async function load() {
      const [allSettings, status] = await Promise.all([
        window.api.settings.getAll(),
        window.api.discord.getStatus()
      ])
      setDiscordEnabled(allSettings['discord.enabled'] ?? true)
      setShowPlaceName(allSettings['discord.showPlaceName'] ?? true)
      setShowElapsed(allSettings['discord.showElapsed'] ?? true)
      setWebhookUrl(allSettings['discord.webhookUrl'] ?? '')
      setDiscordConnected(status.connected)
      setCurrentGame(status.currentGame)
    }
    load()
  }, [])

  async function toggleDiscord(val: boolean) {
    setDiscordEnabled(val)
    setLoading(true)
    await window.api.discord.setEnabled(val)
    const status = await window.api.discord.getStatus()
    setDiscordConnected(status.connected)
    setLoading(false)
  }

  async function saveAll() {
    await Promise.all([
      window.api.settings.set('discord.showPlaceName', showPlaceName),
      window.api.settings.set('discord.showElapsed', showElapsed),
      window.api.settings.set('discord.webhookUrl', webhookUrl)
    ])
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  async function testWebhook() {
    if (!webhookUrl.startsWith('https://discord.com/api/webhooks/')) return
    try {
      await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: 'AppleBlox',
          content: '✅ Webhook test from AppleBlox — connection successful!'
        })
      })
      alert('Webhook test sent successfully!')
    } catch {
      alert('Failed to send webhook. Check the URL.')
    }
  }

  return (
    <div className="px-6 pb-6" style={{ paddingTop: 'var(--titlebar-h)' }}>
      <div className="mb-6 flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Integrations</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
            Connect AppleBlox with Discord and other services
          </p>
        </div>
        <button className="btn-primary" onClick={saveAll}>
          {saved ? <Check size={14} /> : <Save size={14} />}
          {saved ? 'Saved!' : 'Save'}
        </button>
      </div>

      {/* Discord Rich Presence */}
      <div className="mb-4">
        <div className="section-header px-1">Discord Rich Presence</div>
        <div className="card overflow-hidden">
          {/* Toggle */}
          <div className="setting-row">
            <div className="flex items-center gap-3">
              <div
                className="w-9 h-9 rounded-mac flex items-center justify-center"
                style={{ background: '#5865F220' }}
              >
                <MessageSquare size={17} style={{ color: '#5865F2' }} />
              </div>
              <div>
                <div className="text-sm font-medium text-white">Enable Discord RPC</div>
                <div className="text-xs mt-0.5 flex items-center gap-1.5" style={{ color: 'var(--text-muted)' }}>
                  {loading ? (
                    <>Connecting…</>
                  ) : discordEnabled && discordConnected ? (
                    <>
                      <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
                      Connected
                      {currentGame && ` · Playing ${currentGame}`}
                    </>
                  ) : discordEnabled ? (
                    <>
                      <span className="w-1.5 h-1.5 rounded-full bg-yellow-400" />
                      Discord not detected
                    </>
                  ) : (
                    'Disabled'
                  )}
                </div>
              </div>
            </div>
            <input
              type="checkbox"
              className="toggle"
              checked={discordEnabled}
              onChange={(e) => toggleDiscord(e.target.checked)}
            />
          </div>

          {/* Sub-options (only when enabled) */}
          {discordEnabled && (
            <>
              <div className="setting-row">
                <div>
                  <div className="text-sm text-white">Show Game Name</div>
                  <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    Display the Roblox place name in your Discord status
                  </div>
                </div>
                <input
                  type="checkbox"
                  className="toggle"
                  checked={showPlaceName}
                  onChange={(e) => setShowPlaceName(e.target.checked)}
                />
              </div>
              <div className="setting-row">
                <div>
                  <div className="text-sm text-white">Show Elapsed Time</div>
                  <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    Show how long you've been playing
                  </div>
                </div>
                <input
                  type="checkbox"
                  className="toggle"
                  checked={showElapsed}
                  onChange={(e) => setShowElapsed(e.target.checked)}
                />
              </div>
            </>
          )}
        </div>
      </div>

      {/* Discord Webhooks */}
      <div className="mb-4">
        <div className="section-header px-1">Discord Webhooks</div>
        <div className="card overflow-hidden">
          <div className="setting-row flex-col items-start gap-2">
            <div>
              <div className="text-sm font-medium text-white">Webhook URL</div>
              <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                Receive notifications when you join or leave a game
              </div>
            </div>
            <div className="w-full flex gap-2">
              <input
                className="mac-input flex-1 text-sm"
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                placeholder="https://discord.com/api/webhooks/..."
              />
              {webhookUrl && (
                <button className="btn-secondary text-xs" onClick={testWebhook}>
                  Test
                </button>
              )}
            </div>
          </div>
        </div>
        <p className="text-xs px-1 mt-1.5" style={{ color: 'var(--text-faint)' }}>
          Create a webhook in your Discord server: Channel Settings → Integrations → Webhooks.
        </p>
      </div>

      {/* Preview card */}
      {discordEnabled && (
        <div>
          <div className="section-header px-1">Rich Presence Preview</div>
          <div
            className="card p-4 flex gap-3"
            style={{ borderLeft: '4px solid #5865F2' }}
          >
            <div
              className="w-16 h-16 rounded-mac flex items-center justify-center text-2xl flex-shrink-0"
              style={{ background: '#5865F220' }}
            >
              🎮
            </div>
            <div className="min-w-0">
              <div className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#5865F2' }}>
                Playing a game
              </div>
              <div className="text-sm font-semibold text-white mt-0.5">Roblox</div>
              {showPlaceName && (
                <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                  {currentGame ?? 'Natural Disaster Survival'}
                </div>
              )}
              {showElapsed && (
                <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                  12:34 elapsed
                </div>
              )}
              <div className="text-xs mt-1" style={{ color: 'var(--text-faint)' }}>
                via AppleBlox
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
