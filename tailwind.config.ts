import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        cyber: {
          bg: '#0a0e1a',
          surface: '#111827',
          card: '#1a2332',
          border: '#1e3a5f',
          glow: '#00f0ff',
          green: '#00ff88',
          red: '#ff3366',
          yellow: '#ffcc00',
          purple: '#a855f7',
          blue: '#3b82f6',
          text: '#e2e8f0',
          muted: '#64748b',
        },
      },
      boxShadow: {
        'cyber': '0 0 15px rgba(0, 240, 255, 0.15)',
        'cyber-lg': '0 0 30px rgba(0, 240, 255, 0.2)',
        'cyber-green': '0 0 15px rgba(0, 255, 136, 0.15)',
        'cyber-red': '0 0 15px rgba(255, 51, 102, 0.15)',
      },
      animation: {
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'scan-line': 'scanLine 3s linear infinite',
      },
      keyframes: {
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 5px rgba(0, 240, 255, 0.2)' },
          '50%': { boxShadow: '0 0 20px rgba(0, 240, 255, 0.4)' },
        },
        scanLine: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100%)' },
        },
      },
    },
  },
  plugins: [],
}
export default config
