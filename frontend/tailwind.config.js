/** @type {import("tailwindcss").Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Couleurs basées sur le logo
        saumon: {
          50: '#fef7f4',
          100: '#fdeee8',
          200: '#fbd6c6',
          300: '#f9bea4',
          400: '#f7a682',
          500: '#F5B496', // Couleur principale du logo
          600: '#dda287',
          700: '#b88771',
          800: '#936c5a',
          900: '#78584a',
        },
        nature: {
          50: '#fbfcf9',
          100: '#f7f9f3',
          200: '#edf2e7',
          300: '#D5DFC7', // Fond vert du logo
          400: '#c0cdad',
          500: '#abbb93',
          600: '#9aa884',
          700: '#808c6e',
          800: '#667058',
          900: '#535b48',
        }
      }
    },
  },
  plugins: [],
}
