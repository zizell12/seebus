/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        navy: {
          950: '#0B1E4D',
          900: '#0F2A66',
          800: '#15347D',
          700: '#1B3F94',
        },
        brand: {
          red: '#E23744',
          teal: '#1BA9B0',
        }
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
