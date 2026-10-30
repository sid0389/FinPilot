/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        zinc: { 950: '#09090b', 900: '#18181b', 800: '#27272a', 700: '#3f3f46' },
        lime: { 300:'#bef264', 400:'#a3e635', 500:'#84cc16', 600:'#65a30d' },
      },
      fontFamily: {
        sans:    ['Inter', 'system-ui', 'sans-serif'],
        display: ['Space Grotesk', 'Inter', 'sans-serif'],
        mono:    ['JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        'glow-lime':   '0 0 24px rgba(163,230,53,0.2)',
        'glow-cyan':   '0 0 24px rgba(34,211,238,0.15)',
        'glow-violet': '0 0 24px rgba(167,139,250,0.15)',
      },
      animation: {
        'spin-slow': 'spin 3s linear infinite',
      },
    },
  },
  plugins: [],
};
