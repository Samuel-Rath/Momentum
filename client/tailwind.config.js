/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // ── Editorial, professional palette ──
        // Paper tones (backgrounds)
        paper: '#F3F1EB',
        'paper-2': '#ECE8DC',
        'paper-3': '#E3DED0',
        'paper-4': '#D9D2C1',

        // Ink tones (text)
        ink: '#0F1823',
        'ink-soft': '#2C3745',
        slate: '#5E6A77',
        'slate-soft': '#8A939E',
        'slate-subtle': '#A9B0B9',

        // Hairlines
        rule: '#D6CFBE',
        'rule-soft': '#E3DED0',
        'rule-strong': '#B8B09B',

        // Deep navy — primary action & brand
        accent: {
          DEFAULT: '#1E3A5F',
          hover: '#2D5380',
          deep: '#13263F',
          soft: 'rgba(30, 58, 95, 0.08)',
          ring: 'rgba(30, 58, 95, 0.35)',
          fg: '#F3F1EB',
        },

        // Brass — editorial italic highlight (used sparingly)
        brass: {
          DEFAULT: '#8A6F3D',
          deep: '#6E582E',
          soft: 'rgba(138, 111, 61, 0.12)',
        },

        // Status
        success: { DEFAULT: '#2C6E4F', soft: 'rgba(44, 110, 79, 0.1)' },
        warning: { DEFAULT: '#A8741F', soft: 'rgba(168, 116, 31, 0.1)' },
        danger: { DEFAULT: '#8F2A2A', soft: 'rgba(143, 42, 42, 0.1)' },
        info: { DEFAULT: '#3B6FAA', soft: 'rgba(59, 111, 170, 0.1)' },

        // Chart series
        chart: {
          1: '#1E3A5F',
          2: '#8A6F3D',
          3: '#2C6E4F',
          4: '#3B6FAA',
          5: '#6B5847',
          6: '#A8741F',
        },

        // ── Legacy aliases (so any lingering token references still compile) ──
        background: '#F3F1EB',
        surface: '#F3F1EB',
        'surface-container-lowest': '#F3F1EB',
        'surface-container-low': '#ECE8DC',
        'surface-container': '#ECE8DC',
        'surface-container-high': '#E3DED0',
        'surface-container-highest': '#D9D2C1',
        'surface-bright': '#F7F5EF',
        'surface-dim': '#ECE8DC',
        'surface-variant': '#E3DED0',

        'on-surface': '#0F1823',
        'on-background': '#0F1823',
        'on-surface-variant': '#5E6A77',
        'inverse-surface': '#0F1823',
        'inverse-on-surface': '#F3F1EB',

        primary: '#1E3A5F',
        'primary-container': '#1E3A5F',
        'primary-fixed': '#CBD6E3',
        'primary-fixed-dim': '#9FB2C9',
        'inverse-primary': '#2D5380',
        'on-primary': '#F3F1EB',
        'on-primary-container': '#F3F1EB',
        'on-primary-fixed': '#0B1A2E',
        'on-primary-fixed-variant': '#1E3A5F',

        secondary: '#8A6F3D',
        'secondary-container': '#6E582E',
        'on-secondary': '#F3F1EB',
        'on-secondary-container': '#F3F1EB',

        tertiary: '#2C6E4F',
        'tertiary-container': '#1F5238',
        'on-tertiary': '#F3F1EB',
        'on-tertiary-container': '#F3F1EB',

        error: '#8F2A2A',
        'error-container': '#F3D5D5',
        'on-error': '#F3F1EB',
        'on-error-container': '#8F2A2A',

        outline: '#8A939E',
        'outline-variant': '#D6CFBE',
        'surface-tint': '#1E3A5F',

        // Older token aliases
        base: '#F3F1EB',
        elevated: '#ECE8DC',
        muted: '#5E6A77',
        bg: '#F3F1EB',
        fg: '#0F1823',
        'fg-muted': '#5E6A77',
        'fg-subtle': '#8A939E',
        'fg-disabled': '#A9B0B9',
        'surface-2': '#ECE8DC',
        'surface-3': '#E3DED0',
        'surface-hover': '#E3DED0',
        border: '#D6CFBE',
        'border-subtle': '#E3DED0',
        'border-strong': '#B8B09B',
      },
      fontFamily: {
        serif: ['Instrument Serif', 'Times New Roman', 'serif'],
        display: ['Instrument Serif', 'Times New Roman', 'serif'],
        sans: ['Space Grotesk', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
        body: ['Space Grotesk', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'SF Mono', 'ui-monospace', 'Consolas', 'monospace'],
        label: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
      fontSize: {
        '2xs': ['0.6875rem', { lineHeight: '1rem' }],
      },
      letterSpacing: {
        tracked: '0.18em',
        'tracked-tight': '0.14em',
      },
      borderRadius: {
        DEFAULT: '0.125rem',
        sm: '0.125rem',
        md: '0.25rem',
        lg: '0.375rem',
        xl: '0.5rem',
        '2xl': '0.75rem',
        full: '9999px',
      },
      boxShadow: {
        card: '0 1px 2px 0 rgba(15, 24, 35, 0.04)',
        'card-hover': '0 4px 16px -4px rgba(15, 24, 35, 0.08)',
        elevated: '0 12px 32px -8px rgba(15, 24, 35, 0.15)',
      },
      animation: {
        'fade-in': 'fade-in 0.4s ease-out',
        'slide-up': 'slide-up 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
        'pulse-soft': 'pulse-soft 2.5s ease-in-out infinite',
      },
      keyframes: {
        'fade-in': {
          from: { opacity: 0 },
          to: { opacity: 1 },
        },
        'slide-up': {
          from: { opacity: 0, transform: 'translateY(12px)' },
          to: { opacity: 1, transform: 'translateY(0)' },
        },
        'pulse-soft': {
          '0%, 100%': { opacity: 1 },
          '50%': { opacity: 0.55 },
        },
      },
      transitionTimingFunction: {
        'out-expo': 'cubic-bezier(0.19, 1, 0.22, 1)',
      },
    },
  },
  plugins: [],
};
