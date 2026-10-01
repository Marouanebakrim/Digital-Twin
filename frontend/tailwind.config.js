/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      colors: {
        industrial: {
          950: '#090d16',
          900: '#0f172a',
          850: '#152035',
          800: '#1e293b',
          700: '#334155',
          600: '#475569',
          accent: '#06b6d4',
          running: '#10b981',
          warning: '#f59e0b',
          critical: '#ef4444',
          stopped: '#64748b'
        }
      },
      animation: {
        'pulse-fast': 'pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(6, 182, 212, 0.4)' },
          '100%': { boxShadow: '0 0 20px rgba(6, 182, 212, 0.8)' },
        }
      }
    },
  },
  plugins: [],
}
