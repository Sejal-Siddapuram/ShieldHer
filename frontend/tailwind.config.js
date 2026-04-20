/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: "#0a0d1a",
          800: "#0f1224",
          700: "#151929",
        },
        shield: {
          purple: "#6d28d9",
          light: "#a78bfa",
          pale: "#c4b5fd",
        },
      },
      fontFamily: {
        orbitron: ["Orbitron", "sans-serif"],
        sans: ["DM Sans", "sans-serif"],
      },
    },
  },
  plugins: [],
};
