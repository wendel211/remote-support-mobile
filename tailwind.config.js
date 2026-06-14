/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './App.{js,jsx,ts,tsx}',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        background: '#F4F7FB',
        foreground: '#111827',
        muted: '#667085',
        surface: '#FFFFFF',
        border: '#D7DEE8',
        primary: {
          50: '#EEF4FF',
          100: '#DCE8FF',
          500: '#315DFF',
          600: '#244AE2',
          700: '#1E3BB8',
        },
        accent: {
          50: '#EAFBF7',
          500: '#0E9F8A',
          600: '#087F70',
        },
        danger: {
          50: '#FEF2F2',
          500: '#EF4444',
          600: '#DC2626',
        },
        warning: {
          50: '#FFF7ED',
          500: '#F97316',
        },
      },
      borderRadius: {
        ui: '10px',
        panel: '14px',
      },
      boxShadow: {
        soft: '0 10px 28px rgba(17, 24, 39, 0.10)',
      },
    },
  },
  plugins: [],
};
