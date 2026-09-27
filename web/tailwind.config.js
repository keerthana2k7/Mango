/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        forest: {
          900: '#064E3B',
          800: '#065F46',
          700: '#047857',
          600: '#059669',
          500: '#10B981',
          100: '#D1FAE5',
          50: '#ECFDF5',
        },
        surface: {
          backdrop: '#F4F7F5',
          card: '#FFFFFF',
          cardMuted: '#FAFCFB',
          border: '#E5EAE7',
        }
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
      boxShadow: {
        'card': '0 8px 30px rgba(0, 0, 0, 0.04)',
        'float': '0 20px 40px -15px rgba(0, 0, 0, 0.06)',
      }
    },
  },
  plugins: [],
}
