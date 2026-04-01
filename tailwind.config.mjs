/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          purple: '#8B5CF6',
          'purple-deep': '#6D28D9',
          teal: '#14B8A6',
          dark: '#0B0E17',
          'dark-card': '#141927',
          'dark-border': '#1E2A3A',
        },
      },
    },
  },
  plugins: [],
};
