/** @type {import("tailwindcss").Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Couleurs basées sur le logo avec contrastes améliorés
        saumon: {
          50: '#fef7f4',
          100: '#fdeee8',
          200: '#fbd6c6',
          300: '#f9bea4',
          400: '#f7a682',
          500: '#F5B496', // Couleur principale du logo
          600: '#e29474', // Plus foncé pour le contraste
          700: '#c47a5b', // Encore plus foncé pour le texte sur fond clair
          800: '#a66145',
          900: '#884a31',
        },
        nature: {
          50: '#fbfcf9',
          100: '#f7f9f3',
          200: '#edf2e7',
          300: '#D5DFC7', // Fond vert du logo
          400: '#c0cdad',
          500: '#abbb93',
          600: '#8a9a72', // Plus foncé pour le contraste
          700: '#6b7a56',
          800: '#4d5a3b',
          900: '#323a24',
        }
      }
    },
  },
  plugins: [],
}
