/** @type {import('tailwindcss').Config} */

export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    container: {
      center: true,
    },
    extend: {
      colors: {
        navy: {
          DEFAULT: '#355872',
          50: '#e8eef3',
          100: '#c5d5e2',
          200: '#9fb9cf',
          300: '#799dbc',
          400: '#5381a9',
          500: '#355872',
          600: '#2a475c',
          700: '#203545',
          800: '#15222f',
          900: '#0b1018',
        },
        sea: {
          DEFAULT: '#7AAACE',
          50: '#f0f6fa',
          100: '#d9eaf4',
          200: '#bdd9ea',
          300: '#a1c8df',
          400: '#85b7d5',
          500: '#7AAACE',
          600: '#5a93bc',
          700: '#457ca5',
          800: '#35657d',
          900: '#254456',
        },
        sky: {
          DEFAULT: '#9CD5FF',
          50: '#ffffff',
          100: '#f0f8ff',
          200: '#e0f3ff',
          300: '#c5ebff',
          400: '#9CD5FF',
          500: '#6fc1ff',
          600: '#42adef',
          700: '#1a99df',
          800: '#157aad',
          900: '#105c82',
        },
        cream: {
          DEFAULT: '#F7F8F0',
          50: '#ffffff',
          100: '#F7F8F0',
          200: '#e8ead8',
          300: '#d9dcc0',
          400: '#caced8',
          500: '#bbc0a0',
        },
      },
    },
  },
  plugins: [],
};
