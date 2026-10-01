/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#5B3FD6',
          purple: '#5B3FD6',
        },
        'deep-purple': '#3B248C',
        'golden-yellow': '#F4B400',
        'accent-gold': '#FFC933',
        'soft-lavender': '#F6F3FF',
        'accent-orange': '#F4B400',
        'accent-green': '#3B248C',
        'text-primary': '#111827',
        'text-secondary': '#6b7280',
      },
      borderRadius: {
        'custom': '12px',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
