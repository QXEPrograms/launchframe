import { readFileSync, writeFileSync, existsSync, mkdirSync, unlinkSync } from 'fs'
import { homedir } from 'os'
import path from 'path'

const FLAGS_DIR  = path.join(homedir(), 'Library', 'Preferences', 'Roblox')
const FLAGS_FILE = path.join(FLAGS_DIR, 'ClientAppSettings.json')

export type FlagValue = string | number | boolean

export interface FastFlagPreset {
  id: string
  name: string
  description: string
  category: 'performance' | 'graphics' | 'ui' | 'network' | 'fun'
  flags: Record<string, FlagValue>
}

const PRESETS: FastFlagPreset[] = [

  // ─── Performance ───────────────────────────────────────────────────────────
  {
    id: 'fps-unlocker',
    name: 'FPS Unlocker',
    description: 'Removes the 60 FPS cap — play at your monitor\'s native refresh rate.',
    category: 'performance',
    flags: {
      DFIntTaskSchedulerTargetFps: 9999
    }
  },
  {
    id: 'no-player-shadows',
    name: 'No Character Shadows',
    description: 'Disables shadows cast by players and NPCs for a noticeable FPS boost.',
    category: 'performance',
    flags: {
      FIntRenderShadowIntensity: 0
    }
  },
  {
    id: 'no-grass',
    name: 'Remove Grass',
    description: 'Eliminates all terrain grass rendering — big improvement on large open maps.',
    category: 'performance',
    flags: {
      DFIntDebugFRMMaxGrassDistance: 0,
      DFIntDebugFRMMinGrassDistance: 0,
      FIntFRMMinGrassDistance: 0,
      FIntFRMMaxGrassDistance: 0
    }
  },
  {
    id: 'low-textures',
    name: 'Low Texture Quality',
    description: 'Drops texture resolution to reduce VRAM usage on lower-end Macs.',
    category: 'performance',
    flags: {
      FIntDebugTextureManagerSkipMips: 8
    }
  },
  {
    id: 'no-post-fx',
    name: 'Disable Post-Processing',
    description: 'Turns off bloom, depth of field, blur and other post-processing effects.',
    category: 'performance',
    flags: {
      FFlagDisablePostFx: true
    }
  },
  {
    id: 'voxel-lighting',
    name: 'Voxel Lighting Engine',
    description: 'Forces the faster (and older) voxel lighting engine instead of ShadowMap.',
    category: 'performance',
    flags: {
      DFFlagDebugRenderForceTechnologyVoxel: true
    }
  },
  {
    id: 'reduce-particles',
    name: 'Reduce Particle Effects',
    description: 'Lowers the maximum number of active particles in the scene.',
    category: 'performance',
    flags: {
      FIntParticleMaxEmitCount: 50,
      FIntParticleMaxRenderCount: 200
    }
  },
  {
    id: 'minimal-mode',
    name: 'Minimal Rendering Mode',
    description: 'Combines low textures, no shadows, no grass, and no post-fx for maximum FPS.',
    category: 'performance',
    flags: {
      DFIntTaskSchedulerTargetFps: 9999,
      FIntRenderShadowIntensity: 0,
      DFIntDebugFRMMaxGrassDistance: 0,
      DFIntDebugFRMMinGrassDistance: 0,
      FIntDebugTextureManagerSkipMips: 8,
      FFlagDisablePostFx: true,
      DFFlagDebugRenderForceTechnologyVoxel: true
    }
  },
  {
    id: 'no-decals',
    name: 'Disable Decals',
    description: 'Removes all decals from the scene, improving load time and memory.',
    category: 'performance',
    flags: {
      DFFlagEnableV3Rendering: false,
      FFlagNewMeshPartFadingAndLOD: false
    }
  },

  // ─── Graphics ──────────────────────────────────────────────────────────────
  {
    id: 'prefer-metal',
    name: 'Force Metal API (Mac)',
    description: 'Forces Roblox to use Apple\'s Metal GPU API for best performance on Mac.',
    category: 'graphics',
    flags: {
      FFlagDebugGraphicsPreferMetal: true
    }
  },
  {
    id: 'max-quality',
    name: 'Maximum Graphics Quality',
    description: 'Forces Roblox to the highest graphics level — best visuals possible.',
    category: 'graphics',
    flags: {
      FIntRomarkStartWithGraphicQualityLevel: 21
    }
  },
  {
    id: 'fullbright',
    name: 'Fullbright Mode',
    description: 'Eliminates all in-game shadows and ambient darkness — everything is fully lit.',
    category: 'graphics',
    flags: {
      FIntRenderShadowIntensity: 0,
      DFIntCullFactorPixelThresholdShadowMapHighQuality: 2147483647,
      DFIntCullFactorPixelThresholdShadowMapLowQuality: 2147483647
    }
  },
  {
    id: 'no-fog',
    name: 'No Distance Fog',
    description: 'Removes atmospheric fog, giving you full visibility across the entire map.',
    category: 'graphics',
    flags: {
      FFlagRenderFixFog: false
    }
  },
  {
    id: 'better-shadows',
    name: 'Higher Shadow Quality',
    description: 'Increases the shadow map resolution for crisper, more detailed shadows.',
    category: 'graphics',
    flags: {
      FIntRenderShadowmapBias: 0,
      DFIntCullFactorPixelThresholdShadowMapHighQuality: 0
    }
  },
  {
    id: 'no-lens-flare',
    name: 'Disable Lens Flare',
    description: 'Removes the sun lens flare and bloom from bright light sources.',
    category: 'graphics',
    flags: {
      FFlagRenderNoLowFrustumLights: true
    }
  },
  {
    id: 'quality-level-low',
    name: 'Force Low Graphics Quality',
    description: 'Locks graphics to level 1 — maximum performance, minimum visual fidelity.',
    category: 'graphics',
    flags: {
      FIntRomarkStartWithGraphicQualityLevel: 1
    }
  },
  {
    id: 'no-wind',
    name: 'Disable Wind Effects',
    description: 'Stops wind-based sway animations on terrain and accessories.',
    category: 'graphics',
    flags: {
      FFlagAnimatorPostProcessIK: false,
      DFFlagEnablePhysicalPropertiesBasedOnSurface: false
    }
  },

  // ─── UI / Privacy ──────────────────────────────────────────────────────────
  {
    id: 'disable-telemetry',
    name: 'Disable All Telemetry',
    description: 'Prevents Roblox from sending analytics, crash data, and usage statistics.',
    category: 'ui',
    flags: {
      FFlagDebugDisableTelemetryV2: true,
      FStringTelegrafAddress: '',
      FFlagEnableExternalTextureReferencesV5: false
    }
  },
  {
    id: 'hide-gui',
    name: 'Hide Screen UI (Screenshots)',
    description: 'Removes all on-screen GUIs — perfect for taking clean screenshots.',
    category: 'ui',
    flags: {
      FFlagDebugAdornsDisabled: true
    }
  },
  {
    id: 'old-sky',
    name: 'Classic Grey Sky',
    description: 'Restores the old-school solid grey Roblox sky.',
    category: 'ui',
    flags: {
      FFlagDebugSkyGray: true
    }
  },
  {
    id: 'old-chat',
    name: 'Classic Chat UI',
    description: 'Reverts to the older Roblox chat interface style.',
    category: 'ui',
    flags: {
      FFlagEnableBubbleChatFromChatService: false
    }
  },
  {
    id: 'no-idle-animation',
    name: 'No Idle Animation',
    description: 'Disables the breathing / idle animation on your character.',
    category: 'ui',
    flags: {
      DFFlagAnimateCharacterIdleInsteadOfStop: false
    }
  },

  // ─── Network ───────────────────────────────────────────────────────────────
  {
    id: 'faster-join',
    name: 'Faster Game Join',
    description: 'Tweaks network send rates to reduce join latency.',
    category: 'network',
    flags: {
      DFIntGameNetworkSendCountHighPriorityFactor: 7,
      DFIntGameNetworkSendCountLowPriorityFactor: 1
    }
  },
  {
    id: 'no-crash-report',
    name: 'No Crash Reporting',
    description: 'Prevents Roblox from sending crash dump reports.',
    category: 'network',
    flags: {
      FFlagDebugDisableTimeoutDisconnect: false,
      DFFlagDebugDisableTimeoutDisconnect: false
    }
  },
  {
    id: 'reduced-latency',
    name: 'Reduced Network Latency',
    description: 'Increases packet send priority for smoother gameplay on high-ping connections.',
    category: 'network',
    flags: {
      DFIntGameNetworkSendCountHighPriorityFactor: 9,
      DFIntRakNetResendBufferArraySize: 128
    }
  },

  // ─── Fun / Experimental ────────────────────────────────────────────────────
  {
    id: 'flat-shading',
    name: 'Flat / No Shading',
    description: 'Disables the lighting model — everything is rendered as flat unlit polygons.',
    category: 'fun',
    flags: {
      FFlagDebugLightGrid: true
    }
  },
  {
    id: 'old-terrain',
    name: 'Classic Terrain Look',
    description: 'Reverts terrain shading to the classic Roblox visual style.',
    category: 'fun',
    flags: {
      FFlagUnifiedLightingTechnology: false
    }
  }
]

export const fastFlagsManager = {
  getFlags(): Record<string, FlagValue> {
    if (!existsSync(FLAGS_FILE)) return {}
    try {
      return JSON.parse(readFileSync(FLAGS_FILE, 'utf-8'))
    } catch {
      return {}
    }
  },

  setFlags(flags: Record<string, FlagValue>): void {
    if (!existsSync(FLAGS_DIR)) mkdirSync(FLAGS_DIR, { recursive: true })
    writeFileSync(FLAGS_FILE, JSON.stringify(flags, null, 2), 'utf-8')
  },

  resetFlags(): void {
    if (existsSync(FLAGS_FILE)) unlinkSync(FLAGS_FILE)
  },

  getPresets(): FastFlagPreset[] {
    return PRESETS
  },

  applyPreset(presetId: string): Record<string, FlagValue> {
    const preset = PRESETS.find(p => p.id === presetId)
    if (!preset) throw new Error(`Unknown preset: ${presetId}`)
    const merged = { ...this.getFlags(), ...preset.flags }
    this.setFlags(merged)
    return merged
  }
}
