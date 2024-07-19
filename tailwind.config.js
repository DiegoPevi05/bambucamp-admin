/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#146c73",
        secondary: "#00AAA9",
        tertiary: "#eab485",
        fourth: "#dbada4",
        fifth: "#a57964",
        sixth: "#ecdccc",
      },
      fontFamily: {
        primary: ["helveticaNeue-bold", "sans-serif"],
        secondary: ["HelveticaNeue-Medium", "sans-serif"],
        tertiary: ["GothamRounded-Book", "sans-serif"],
      },
      backgroundImage: {
        'black-to-transparent': 'linear-gradient(to bottom, rgba(0, 0, 0, 0.6) 0%, rgba(0, 0, 0, 0.2) 50% , rgba(0, 0, 0, 0.01) 100%)',

      },
    },
  },

  plugins: [],
}

