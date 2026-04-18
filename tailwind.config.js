/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/renderer/src/**/*.{js,ts,jsx,tsx}', './src/renderer/index.html'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'SF Pro Display', 'SF Pro Text', 'Helvetica Neue', 'sans-serif']
      },
      colors: {
        mac: {
          blue:    '#007AFF',
          green:   '#34C759',
          red:     '#FF3B30',
          orange:  '#FF9500',
          yellow:  '#FFCC00',
          purple:  '#AF52DE',
          pink:    '#FF2D55',
          gray:    '#8E8E93',
          bg:      'rgba(28,28,30,0.85)',
          sidebar: 'rgba(20,20,22,0.92)',
          card:    'rgba(44,44,46,0.7)',
          border:  'rgba(255,255,255,0.08)',
          hover:   'rgba(255,255,255,0.06)'
        }
      },
      backgroundImage: {
        'glass': 'linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)'
      },
      borderRadius: {
        'mac': '10px',
        'mac-lg': '14px'
      },
      boxShadow: {
        'mac': '0 2px 10px rgba(0,0,0,0.3), 0 0 0 0.5px rgba(255,255,255,0.06)',
        'mac-inset': 'inset 0 1px 0 rgba(255,255,255,0.08)'
      }
    }
  },
  plugins: []
}
