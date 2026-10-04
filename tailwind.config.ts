import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        serif: ['Fraunces', 'ui-serif', 'Georgia', 'serif'],
      },
      colors: {
        vitaly: {
          ink: 'rgb(var(--vitaly-ink) / <alpha-value>)',
          muted: 'rgb(var(--vitaly-muted) / <alpha-value>)',
          line: 'rgb(var(--vitaly-line) / <alpha-value>)',
          canvas: 'rgb(var(--vitaly-canvas) / <alpha-value>)',
          paper: 'rgb(var(--vitaly-paper) / <alpha-value>)',
          surface: 'rgb(var(--vitaly-surface) / <alpha-value>)',
          accent: 'rgb(var(--vitaly-accent) / <alpha-value>)',
          accentDeep: 'var(--vitaly-accent-deep)',
          accentWarm: '#e2683c',
          glow: '#f0a85f',
          accentSoft: 'var(--vitaly-accent-soft)',
          emergency: 'var(--vitaly-emergency)',
          emergencySoft: 'var(--vitaly-emergency-soft)',
          moss: 'rgb(var(--vitaly-moss) / <alpha-value>)',
          mossSoft: 'var(--vitaly-moss-soft)',
          slate: 'rgb(var(--vitaly-slate) / <alpha-value>)',
          slateSoft: 'var(--vitaly-slate-soft)',
          amber: 'rgb(var(--vitaly-amber) / <alpha-value>)',
          amberSoft: 'var(--vitaly-amber-soft)',
        },
      },
      boxShadow: {
        soft: '0 16px 44px rgba(28, 27, 26, 0.08)',
      },
      borderRadius: {
        '2xl': '1.25rem',
        '3xl': '1.75rem',
      },
    },
  },
  plugins: [],
}

export default config
