/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        space: ['"Space Grotesk"', 'sans-serif']
      },
      colors: {
        signal: {
          blue: '#3b82f6',
          red: '#ef4444'
        }
      },
      transitionTimingFunction: {
        'system-ease': 'cubic-bezier(0.16, 1, 0.3, 1)'
      },
      boxShadow: {
        'signal-blue': '0 0 0 1px rgba(59, 130, 246, 0.5), 0 0 30px rgba(59, 130, 246, 0.24)',
        'signal-red': '0 0 0 1px rgba(239, 68, 68, 0.5), 0 0 30px rgba(239, 68, 68, 0.24)'
      }
    }
  },
  plugins: []
}
