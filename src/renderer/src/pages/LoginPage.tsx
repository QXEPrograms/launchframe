import React, { useState } from 'react'
import {
  signInWithGoogle, signInEmail, createAccount, resetPassword, isFirebaseConfigured
} from '../lib/firebase'
import { Mail, Lock, Eye, EyeOff, Loader2, AlertCircle, CheckCircle, ExternalLink } from 'lucide-react'
import { LogoIcon } from '../components/LogoIcon'

// Google "G" logo svg
function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z" fill="#34A853"/>
      <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58Z" fill="#EA4335"/>
    </svg>
  )
}

type Mode = 'signin' | 'signup' | 'reset'

interface Props {
  onLogin: () => void
}

export function LoginPage({ onLogin }: Props) {
  const [mode, setMode]         = useState<Mode>('signin')
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw]     = useState(false)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState<string | null>(null)
  const [success, setSuccess]   = useState<string | null>(null)

  const configured = isFirebaseConfigured()

  function friendlyError(code: string): string {
    const map: Record<string, string> = {
      'auth/user-not-found':       'No account with that email address.',
      'auth/wrong-password':       'Incorrect password.',
      'auth/email-already-in-use': 'That email is already registered.',
      'auth/weak-password':        'Password must be at least 6 characters.',
      'auth/invalid-email':        'Enter a valid email address.',
      'auth/popup-closed-by-user': 'Google sign-in was cancelled.',
      'auth/network-request-failed': 'Network error — check your connection.',
      'auth/too-many-requests':    'Too many attempts. Try again later.',
      'auth/operation-not-allowed':'This sign-in method is not enabled in Firebase.',
    }
    return map[code] ?? 'Something went wrong. Try again.'
  }

  async function handleGoogle() {
    if (!configured) return showSetupError()
    setError(null)
    setLoading(true)
    try {
      await signInWithGoogle()
      onLogin()
    } catch (e: any) {
      setError(friendlyError(e.code))
    } finally {
      setLoading(false)
    }
  }

  async function handleEmailAction() {
    if (!configured) return showSetupError()
    setError(null)
    setSuccess(null)
    if (!email) return setError('Enter your email address.')
    if (mode === 'reset') {
      setLoading(true)
      try {
        await resetPassword(email)
        setSuccess('Password reset email sent! Check your inbox.')
      } catch (e: any) {
        setError(friendlyError(e.code))
      } finally {
        setLoading(false)
      }
      return
    }
    if (!password) return setError('Enter your password.')
    setLoading(true)
    try {
      if (mode === 'signin') {
        await signInEmail(email, password)
      } else {
        await createAccount(email, password)
      }
      onLogin()
    } catch (e: any) {
      setError(friendlyError(e.code))
    } finally {
      setLoading(false)
    }
  }

  function showSetupError() {
    setError('Firebase is not configured yet. See src/renderer/src/lib/firebase.ts for setup instructions.')
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6 py-8 relative"
      style={{ background: 'linear-gradient(160deg, #0f0f12 0%, #1a1a1f 50%, #0f1118 100%)' }}
    >
      {/* Background glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 70% 50% at 50% 0%, rgba(0,122,255,0.12) 0%, transparent 70%)'
        }}
      />

      {/* Card */}
      <div
        className="relative w-full max-w-sm"
        style={{
          background: 'rgba(28,28,32,0.9)',
          border: '1px solid rgba(255,255,255,0.09)',
          borderRadius: 18,
          boxShadow: '0 32px 80px rgba(0,0,0,0.6), 0 0 0 0.5px rgba(255,255,255,0.05)',
          backdropFilter: 'blur(30px)'
        }}
      >
        {/* Header */}
        <div className="px-8 pt-8 pb-6 text-center border-b" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
          <div className="mx-auto mb-4 drop-shadow-xl" style={{ filter: 'drop-shadow(0 8px 24px rgba(0,114,255,0.4))' }}>
            <LogoIcon size={56} />
          </div>
          <div className="text-xl font-bold text-white tracking-tight">LaunchFrame</div>
          <div className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.45)' }}>
            {mode === 'signin' && 'Sign in to your account'}
            {mode === 'signup' && 'Create your free account'}
            {mode === 'reset' && 'Reset your password'}
          </div>
        </div>

        <div className="px-8 py-6 space-y-3">
          {/* Firebase not configured warning */}
          {!configured && (
            <div
              className="flex items-start gap-2 text-xs p-3 rounded-xl"
              style={{ background: 'rgba(255,149,0,0.12)', color: '#FF9500', border: '1px solid rgba(255,149,0,0.2)' }}
            >
              <AlertCircle size={13} className="mt-0.5 flex-shrink-0" />
              <div>
                <strong>Firebase not configured.</strong> Open <code>src/renderer/src/lib/firebase.ts</code> and add your project credentials.
              </div>
            </div>
          )}

          {/* Google button */}
          {mode !== 'reset' && (
            <button
              onClick={handleGoogle}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2.5 py-2.5 rounded-xl text-sm font-medium text-white transition-all"
              style={{
                background: 'rgba(255,255,255,0.07)',
                border: '1px solid rgba(255,255,255,0.1)',
                opacity: loading ? 0.6 : 1
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.11)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.07)')}
            >
              <GoogleIcon />
              Continue with Google
            </button>
          )}

          {/* Divider */}
          {mode !== 'reset' && (
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.07)' }} />
              <span className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>or</span>
              <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.07)' }} />
            </div>
          )}

          {/* Email field */}
          <div className="relative">
            <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'rgba(255,255,255,0.35)' }} />
            <input
              type="email"
              className="w-full pl-9 pr-4 py-2.5 text-sm text-white rounded-xl outline-none transition-all"
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.09)'
              }}
              placeholder="Email address"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleEmailAction()}
              autoComplete="email"
              onFocus={e => (e.currentTarget.style.borderColor = 'rgba(0,122,255,0.6)')}
              onBlur={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.09)')}
            />
          </div>

          {/* Password field */}
          {mode !== 'reset' && (
            <div className="relative">
              <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'rgba(255,255,255,0.35)' }} />
              <input
                type={showPw ? 'text' : 'password'}
                className="w-full pl-9 pr-10 py-2.5 text-sm text-white rounded-xl outline-none transition-all"
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.09)'
                }}
                placeholder="Password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleEmailAction()}
                autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                onFocus={e => (e.currentTarget.style.borderColor = 'rgba(0,122,255,0.6)')}
                onBlur={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.09)')}
              />
              <button
                type="button"
                onClick={() => setShowPw(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2"
                style={{ color: 'rgba(255,255,255,0.35)' }}
              >
                {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          )}

          {/* Error / success */}
          {error && (
            <div className="flex items-center gap-2 text-xs px-3 py-2.5 rounded-xl" style={{ background: 'rgba(255,59,48,0.12)', color: '#FF3B30', border: '1px solid rgba(255,59,48,0.15)' }}>
              <AlertCircle size={13} className="flex-shrink-0" />
              {error}
            </div>
          )}
          {success && (
            <div className="flex items-center gap-2 text-xs px-3 py-2.5 rounded-xl" style={{ background: 'rgba(52,199,89,0.12)', color: '#34C759', border: '1px solid rgba(52,199,89,0.15)' }}>
              <CheckCircle size={13} className="flex-shrink-0" />
              {success}
            </div>
          )}

          {/* Forgot password link */}
          {mode === 'signin' && (
            <div className="text-right">
              <button
                className="text-xs transition-colors"
                style={{ color: 'rgba(255,255,255,0.4)' }}
                onClick={() => { setMode('reset'); setError(null); setSuccess(null) }}
                onMouseEnter={e => (e.currentTarget.style.color = '#007AFF')}
                onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.4)')}
              >
                Forgot password?
              </button>
            </div>
          )}

          {/* CTA button */}
          <button
            onClick={handleEmailAction}
            disabled={loading}
            className="w-full py-2.5 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 transition-all"
            style={{
              background: 'linear-gradient(135deg, #007AFF 0%, #5856D6 100%)',
              boxShadow: loading ? 'none' : '0 4px 16px rgba(0,122,255,0.35)',
              opacity: loading ? 0.7 : 1
            }}
          >
            {loading && <Loader2 size={15} className="animate-spin" />}
            {mode === 'signin' && 'Sign In'}
            {mode === 'signup' && 'Create Account'}
            {mode === 'reset' && 'Send Reset Email'}
          </button>

          {/* Mode toggles */}
          <div className="flex items-center justify-center gap-1 text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
            {mode === 'signin' ? (
              <>
                No account?
                <button className="font-medium" style={{ color: '#007AFF' }} onClick={() => { setMode('signup'); setError(null); setSuccess(null) }}>
                  Create one
                </button>
              </>
            ) : (
              <>
                Already have one?
                <button className="font-medium" style={{ color: '#007AFF' }} onClick={() => { setMode('signin'); setError(null); setSuccess(null) }}>
                  Sign in
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-6 text-center space-y-2">
        <p className="text-xs font-semibold tracking-wide" style={{ color: 'rgba(255,255,255,0.25)' }}>
          MADE BY QXEPROGRAMS
        </p>
        <button
          onClick={() => window.api.app.openExternal('https://discord.gg/2EfdJfdwpp')}
          className="flex items-center gap-1.5 text-xs mx-auto transition-colors"
          style={{ color: 'rgba(255,255,255,0.3)' }}
          onMouseEnter={e => (e.currentTarget.style.color = '#5865F2')}
          onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.3)')}
        >
          <ExternalLink size={11} />
          Join our Discord for support
        </button>
      </div>
    </div>
  )
}
