import React, { useState } from 'react'
import { ExternalLink, X } from 'lucide-react'

/**
 * ──────────────────────────────────────────────────────────────────────────────
 * Stripe Payment Links
 *  1. Go to https://dashboard.stripe.com/payment-links
 *  2. Create a payment link for each amount
 *  3. Replace the placeholder URLs below
 * ──────────────────────────────────────────────────────────────────────────────
 */
const DONATION_LINKS = {
  5:  'PASTE_YOUR_5_DOLLAR_STRIPE_LINK_HERE',
  10: 'PASTE_YOUR_10_DOLLAR_STRIPE_LINK_HERE',
  20: 'PASTE_YOUR_20_DOLLAR_STRIPE_LINK_HERE'
}

interface Props {
  username?: string
  onClose: () => void
}

export function DonationModal({ username, onClose }: Props) {
  const [hoveredTier, setHoveredTier] = useState<number | null>(null)

  function donate(amount: 5 | 10 | 20) {
    window.api.app.openExternal(DONATION_LINKS[amount])
    onClose()
  }

  const tiers: {
    amount: 5 | 10 | 20
    label: string
    emoji: string
    perks: string
    color: string
    glow: string
  }[] = [
    {
      amount: 5,
      label: 'Supporter',
      emoji: '☕',
      perks: 'Buy the team a coffee',
      color: 'rgba(255,149,0,0.15)',
      glow: 'rgba(255,149,0,0.3)'
    },
    {
      amount: 10,
      label: 'Booster',
      emoji: '⚡',
      perks: 'Keep the servers running',
      color: 'rgba(0,122,255,0.15)',
      glow: 'rgba(0,122,255,0.3)'
    },
    {
      amount: 20,
      label: 'Champion',
      emoji: '🏆',
      perks: 'Fund future features',
      color: 'rgba(175,82,222,0.15)',
      glow: 'rgba(175,82,222,0.3)'
    }
  ]

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(12px)' }}
    >
      <div
        className="relative w-full max-w-md animate-fade-up"
        style={{
          background: 'rgba(24,24,28,0.97)',
          border: '1px solid rgba(255,255,255,0.09)',
          borderRadius: 20,
          boxShadow: '0 40px 100px rgba(0,0,0,0.7), 0 0 0 0.5px rgba(255,255,255,0.04)'
        }}
      >
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-7 h-7 rounded-full flex items-center justify-center transition-colors"
          style={{ background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.5)' }}
          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.13)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.07)')}
        >
          <X size={13} />
        </button>

        {/* Header */}
        <div className="px-8 pt-8 pb-5 text-center">
          <div className="text-3xl mb-3">💜</div>
          <h2 className="text-xl font-bold text-white">
            {username ? `Welcome, ${username.split('@')[0]}!` : 'Welcome to AppleBlox!'}
          </h2>
          <p className="text-sm mt-2" style={{ color: 'rgba(255,255,255,0.5)' }}>
            LaunchFrame is completely free. If you enjoy it, consider supporting the team behind it — every donation goes directly to{' '}
            <span className="font-semibold text-white">QXEPrograms</span> to keep development going.
          </p>
        </div>

        {/* Tier cards */}
        <div className="px-6 pb-2 grid grid-cols-3 gap-3">
          {tiers.map((tier) => {
            const hovered = hoveredTier === tier.amount
            return (
              <button
                key={tier.amount}
                onClick={() => donate(tier.amount)}
                onMouseEnter={() => setHoveredTier(tier.amount)}
                onMouseLeave={() => setHoveredTier(null)}
                className="flex flex-col items-center py-4 px-2 rounded-2xl text-center transition-all duration-150"
                style={{
                  background: hovered ? tier.color : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${hovered ? tier.glow : 'rgba(255,255,255,0.07)'}`,
                  boxShadow: hovered ? `0 8px 32px ${tier.glow}` : 'none',
                  transform: hovered ? 'translateY(-2px)' : 'none'
                }}
              >
                <div className="text-2xl mb-2">{tier.emoji}</div>
                <div className="text-lg font-bold text-white">${tier.amount}</div>
                <div className="text-xs font-medium mt-0.5" style={{ color: 'rgba(255,255,255,0.7)' }}>
                  {tier.label}
                </div>
                <div className="text-xs mt-1.5 leading-tight" style={{ color: 'rgba(255,255,255,0.4)' }}>
                  {tier.perks}
                </div>
                {hovered && (
                  <div className="flex items-center gap-1 mt-2 text-xs font-medium" style={{ color: '#007AFF' }}>
                    Donate <ExternalLink size={10} />
                  </div>
                )}
              </button>
            )
          })}
        </div>

        {/* Stripe note */}
        <p className="text-center text-xs px-8 pb-4 mt-2" style={{ color: 'rgba(255,255,255,0.2)' }}>
          Secure payment via Stripe · No account required
        </p>

        {/* Skip */}
        <div className="px-6 pb-6">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl text-sm font-medium text-center transition-all"
            style={{ color: 'rgba(255,255,255,0.4)', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.08)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
          >
            Maybe later — take me to the app
          </button>
        </div>
      </div>
    </div>
  )
}
