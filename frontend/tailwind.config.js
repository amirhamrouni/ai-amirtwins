/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#121212',
        surface: '#1E1E1E',
        border: '#2A2A2A',
        accent: '#6C63FF',
        blue: '#4FC3F7',
        muted: '#757575',
      },
    },
  },
  plugins: [],
};
