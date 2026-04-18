import React, { useEffect, useState, useMemo } from 'react'
import {
  Flag, Plus, Trash2, RotateCcw, Save, Check, Zap, Search, ChevronRight
} from 'lucide-react'
import type { FastFlagPreset } from '../types'

type FlagValue = string | number | boolean

interface FlagEntry { key: string; value: string }

const CATEGORY_META: Record<string, { label: string; color: string; emoji: string }> = {
  performance: { label: 'Performance', color: '#FF9500', emoji: '⚡' },
  graphics:    { label: 'Graphics',    color: '#007AFF', emoji: '🎨' },
  ui:          { label: 'UI & Privacy',color: '#34C759', emoji: '🛡️' },
  network:     { label: 'Network',     color: '#5AC8FA', emoji: '🌐' },
  fun:         { label: 'Fun & Experimental', color: '#AF52DE', emoji: '✨' }
}

export function FastFlagsPage() {
  const [flags, setFlags]           = useState<Record<string, FlagValue>>({})
  const [presets, setPresets]       = useState<FastFlagPreset[]>([])
  const [entries, setEntries]       = useState<FlagEntry[]>([])
  const [newKey, setNewKey]         = useState('')
  const [newVal, setNewVal]         = useState('')
  const [saved, setSaved]           = useState(false)
  const [query, setQuery]           = useState('')
  const [activeCategory, setActiveCategory] = useState<string>('all')
  const [appliedIds, setAppliedIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    async function load() {
      const [f, p] = await Promise.all([
        window.api.fastFlags.get(),
        window.api.fastFlags.getPresets()
      ])
      setFlags(f)
      setEntries(Object.entries(f).map(([key, value]) => ({ key, value: String(value) })))
      setPresets(p)
    }
    load()
  }, [])

  const filteredPresets = useMemo(() => {
    let list = presets
    if (activeCategory !== 'all') list = list.filter(p => p.category === activeCategory)
    if (query.trim()) {
      const q = query.toLowerCase()
      list = list.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        Object.keys(p.flags).some(k => k.toLowerCase().includes(q))
      )
    }
    return list
  }, [presets, activeCategory, query])

  async function save() {
    const obj: Record<string, FlagValue> = {}
    for (const { key, value } of entries) {
      if (!key.trim()) continue
      if (value === 'true')       obj[key] = true
      else if (value === 'false') obj[key] = false
      else if (/^-?\d+$/.test(value)) obj[key] = parseInt(value)
      else obj[key] = value
    }
    await window.api.fastFlags.set(obj)
    setFlags(obj)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  async function reset() {
    if (!confirm('Reset all fast flags to default? This cannot be undone.')) return
    await window.api.fastFlags.reset()
    setFlags({})
    setEntries([])
    setAppliedIds(new Set())
  }

  async function applyPreset(preset: FastFlagPreset) {
    const updated = await window.api.fastFlags.applyPreset(preset.id)
    setFlags(updated)
    setEntries(Object.entries(updated).map(([key, value]) => ({ key, value: String(value) })))
    setAppliedIds(prev => new Set([...prev, preset.id]))
  }

  function addFlag() {
    if (!newKey.trim()) return
    setEntries(prev => [...prev, { key: newKey.trim(), value: newVal }])
    setNewKey('')
    setNewVal('')
  }

  function removeFlag(i: number) {
    setEntries(prev => prev.filter((_, idx) => idx !== i))
  }

  function updateEntry(i: number, field: 'key' | 'value', val: string) {
    setEntries(prev => prev.map((e, idx) => idx === i ? { ...e, [field]: val } : e))
  }

  const categories = ['all', ...Object.keys(CATEGORY_META)]

  return (
    <div className="px-6 pb-6" style={{ paddingTop: 'var(--titlebar-h)' }}>

      {/* Header */}
      <div className="mb-5 flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Fast Flags</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
            {presets.length} presets · {entries.length} active flag{entries.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex gap-2">
          <button className="btn-danger" onClick={reset}>
            <RotateCcw size={13} /> Reset All
          </button>
          <button className="btn-primary" onClick={save}>
            {saved ? <Check size={13} /> : <Save size={13} />}
            {saved ? 'Saved!' : 'Save Flags'}
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
        <input
          className="mac-input pl-9 text-sm"
          placeholder="Search presets…"
          value={query}
          onChange={e => setQuery(e.target.value)}
        />
      </div>

      {/* Category tabs */}
      <div className="flex gap-1.5 mb-4 overflow-x-auto pb-0.5">
        {categories.map(cat => {
          const meta = CATEGORY_META[cat]
          const active = activeCategory === cat
          return (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all duration-100 flex-shrink-0"
              style={{
                background: active
                  ? (meta ? `${meta.color}22` : 'var(--accent)')
                  : 'rgba(255,255,255,0.05)',
                color: active
                  ? (meta ? meta.color : '#fff')
                  : 'var(--text-muted)',
                border: `1px solid ${active ? (meta ? `${meta.color}44` : 'var(--accent)') : 'transparent'}`
              }}
            >
              {meta?.emoji && <span>{meta.emoji}</span>}
              {cat === 'all' ? 'All Presets' : meta?.label ?? cat}
            </button>
          )
        })}
      </div>

      {/* Presets grid */}
      {filteredPresets.length === 0 ? (
        <div className="card py-10 text-center text-sm mb-4" style={{ color: 'var(--text-muted)' }}>
          No presets match your search.
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2 mb-6">
          {filteredPresets.map(preset => {
            const meta = CATEGORY_META[preset.category]
            const applied = appliedIds.has(preset.id)
            return (
              <div
                key={preset.id}
                className="card p-4 flex flex-col gap-2.5 transition-all duration-150"
                style={{ cursor: 'default' }}
              >
                <div className="flex items-start gap-2">
                  <div
                    className="w-8 h-8 rounded-mac flex items-center justify-center text-base flex-shrink-0"
                    style={{ background: meta ? `${meta.color}20` : 'rgba(255,255,255,0.05)' }}
                  >
                    {meta?.emoji ?? '🔧'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-white leading-snug">{preset.name}</div>
                    <div className="text-xs mt-0.5 leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                      {preset.description}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span
                    className="text-xs px-2 py-0.5 rounded-full"
                    style={{
                      background: meta ? `${meta.color}15` : 'rgba(255,255,255,0.05)',
                      color: meta ? meta.color : 'var(--text-muted)'
                    }}
                  >
                    {Object.keys(preset.flags).length} flag{Object.keys(preset.flags).length !== 1 ? 's' : ''}
                  </span>
                  <button
                    onClick={() => applyPreset(preset)}
                    className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold transition-all"
                    style={
                      applied
                        ? { background: 'rgba(52,199,89,0.15)', color: '#34C759', border: '1px solid rgba(52,199,89,0.25)' }
                        : { background: 'var(--accent)', color: '#fff' }
                    }
                  >
                    {applied ? <><Check size={11} /> Applied</> : <><Zap size={11} /> Apply</>}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Custom flags editor */}
      <div>
        <div className="section-header px-1">Custom Flags</div>
        <div className="card overflow-hidden mb-2">
          {entries.length === 0 ? (
            <div className="py-7 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
              No flags set. Apply a preset or add a custom flag below.
            </div>
          ) : (
            entries.map((entry, i) => (
              <div key={i} className="setting-row gap-2">
                <input
                  className="mac-input flex-1 text-xs font-mono"
                  value={entry.key}
                  onChange={e => updateEntry(i, 'key', e.target.value)}
                  placeholder="FlagName"
                />
                <input
                  className="mac-input w-36 text-xs font-mono"
                  value={entry.value}
                  onChange={e => updateEntry(i, 'value', e.target.value)}
                  placeholder="value"
                />
                <button
                  onClick={() => removeFlag(i)}
                  className="p-1.5 rounded transition-colors flex-shrink-0"
                  style={{ color: 'var(--text-muted)' }}
                  onMouseEnter={e => (e.currentTarget.style.color = 'var(--red)')}
                  onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Add flag row */}
        <div className="card p-3 flex gap-2 items-center">
          <input
            className="mac-input flex-1 text-xs font-mono"
            value={newKey}
            onChange={e => setNewKey(e.target.value)}
            placeholder="FlagName"
            onKeyDown={e => e.key === 'Enter' && addFlag()}
          />
          <input
            className="mac-input w-36 text-xs font-mono"
            value={newVal}
            onChange={e => setNewVal(e.target.value)}
            placeholder="value"
            onKeyDown={e => e.key === 'Enter' && addFlag()}
          />
          <button className="btn-primary px-3 py-1.5 text-xs flex-shrink-0" onClick={addFlag}>
            <Plus size={13} /> Add
          </button>
        </div>

        <p className="text-xs px-1 mt-2" style={{ color: 'var(--text-faint)' }}>
          Written to <code>~/Library/Preferences/Roblox/ClientAppSettings.json</code> · Applied on next launch
        </p>
      </div>
    </div>
  )
}
