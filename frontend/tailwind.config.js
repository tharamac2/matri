/** @type {import('tailwindcss').Config} */
export default {
  important: '.admin-app',
  content: [
    "./src/admin/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'matrimony-orange': '#F7813F',
        'matrimony-red': '#D63031',
        brand: {
          50:  '#FDF2F4',
          100: '#FBDDE2',
          200: '#F5B5C0',
          300: '#EC8A9A',
          400: '#D9576C',
          500: '#C0394F',
          600: '#9A2B3D',
          700: '#7B2032',
          800: '#5C1825',
          900: '#3D1019',
        },
        primary: {
          50:  '#FDF2F4',
          100: '#FBDDE2',
          200: '#F5B5C0',
          300: '#EC8A9A',
          400: '#D9576C',
          500: '#C0394F',
          600: '#9A2B3D',
          700: '#7B2032',
          800: '#5C1825',
          900: '#3D1019',
        },
        cream: {
          50:  '#FFFDF9',
          100: '#FAFAFA',
          200: '#FDF4EE',
          300: '#FAEAE0',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 4px rgba(0,0,0,0.06), 0 2px 8px rgba(0,0,0,0.04)',
        'card-md': '0 2px 8px rgba(0,0,0,0.08), 0 4px 16px rgba(0,0,0,0.04)',
      },
    },
  },
  corePlugins: {
    preflight: false,
  },
  plugins: [],
}
