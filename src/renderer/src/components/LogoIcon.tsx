import React from 'react'

interface Props {
  size?: number
  className?: string
}

/**
 * LaunchFrame logo — rendered as inline SVG so it always looks crisp
 * and the gradient renders correctly at any size.
 */
export function LogoIcon({ size = 32, className = '' }: Props) {
  const id = `lf-grad-${size}`
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 512 512"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ flexShrink: 0 }}
    >
      <defs>
        <linearGradient id={id} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%"   stopColor="#00c6ff" />
          <stop offset="100%" stopColor="#0072ff" />
        </linearGradient>
      </defs>
      {/* Background */}
      <rect width="512" height="512" rx="100" fill="#0d1117" />
      {/* Frame */}
      <rect
        x="96" y="96" width="320" height="320" rx="40"
        fill="none"
        stroke={`url(#${id})`}
        strokeWidth="16"
      />
      {/* Arrow / launch */}
      <path
        d="M256 160 L320 224 L288 224 L288 320 L224 320 L224 224 L192 224 Z"
        fill={`url(#${id})`}
      />
    </svg>
  )
}
