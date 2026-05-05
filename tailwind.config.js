export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#020617',
          'foreground': '#f8fafc'
        },
        secondary: {
          DEFAULT: '#f1f5f9',
          'foreground': '#0f172a'
        },
        accent: {
          DEFAULT: '#2563eb',
          'foreground': '#ffffff'
        },
        destructive: {
          DEFAULT: '#dc2626',
          'foreground': '#ffffff'
        },
        muted: {
            DEFAULT: '#f1f5f9',
            foreground: '#64748b'
        }
      },
      animation: {
        'slide-in': 'slideIn 0.3s ease-out',
        'progress': 'progress linear forwards'
      },
      keyframes: {
        slideIn: {
          '0%': { transform: 'translateX(100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' }
        },
        progress: {
          '0%': { width: '100%' },
          '100%': { width: '0%' }
        }
      }
    }
  },
  plugins: [],
}
