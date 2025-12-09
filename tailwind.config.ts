import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // RevoForms Design System
        space: {
          DEFAULT: '#0A0E27',
          dark: '#050814',
          light: '#141B42',
        },
        neon: {
          cyan: '#00FFFF',
          purple: '#8A2BE2',
          pink: '#FF1493',
        },
        glass: {
          DEFAULT: 'rgba(255, 255, 255, 0.08)',
          light: 'rgba(255, 255, 255, 0.12)',
          dark: 'rgba(0, 0, 0, 0.4)',
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'glass-gradient': 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
        'cyan-gradient': 'linear-gradient(135deg, rgba(0,255,255,0.15) 0%, rgba(0,255,255,0.08) 100%)',
        'purple-gradient': 'linear-gradient(135deg, rgba(138,43,226,0.15) 0%, rgba(138,43,226,0.08) 100%)',
      },
      boxShadow: {
        'glass': '0 8px 32px rgba(0, 0, 0, 0.37)',
        'cyan-glow': '0 0 20px rgba(0, 255, 255, 0.4)',
        'purple-glow': '0 0 20px rgba(138, 43, 226, 0.4)',
        'neon': '0 0 40px rgba(0, 255, 255, 0.6)',
      },
      animation: {
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'float': 'float 3s ease-in-out infinite',
        'grid-pulse': 'gridPulse 4s ease-in-out infinite',
        'thinking': 'thinking 1.5s ease-in-out infinite',
        'wave': 'wave 1.4s ease-in-out infinite',
      },
      keyframes: {
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(0, 255, 255, 0.4)' },
          '50%': { boxShadow: '0 0 40px rgba(0, 255, 255, 0.8)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        gridPulse: {
          '0%, 100%': { opacity: '0.8' },
          '50%': { opacity: '1' },
        },
        thinking: {
          '0%, 100%': { transform: 'scale(1)', opacity: '0.5' },
          '50%': { transform: 'scale(1.2)', opacity: '1' },
        },
        wave: {
          '0%, 60%, 100%': { transform: 'translateY(0)' },
          '30%': { transform: 'translateY(-4px)' },
        },
      },
      backdropBlur: {
        'xs': '2px',
      },
    },
  },
  plugins: [],
}
export default config
