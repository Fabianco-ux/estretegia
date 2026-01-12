/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        linkedinStart: '#0A66C2',
        linkedinEnd: '#4FA3FF',
        instagramStart: '#FF2A2A',
        instagramEnd: '#FF7878',
        gaStart: '#FFC107',
        gaEnd: '#FFEB7A',
      },
      boxShadow: {
        soft: '0 2px 8px rgba(0,0,0,0.06)'
      }
    },
  },
  plugins: [],
};
