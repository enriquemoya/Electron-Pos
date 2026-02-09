/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        base: {
          900: "#0b0f14",
          800: "#111827",
          700: "#1f2937"
        },
        accent: {
          500: "#f59e0b",
          600: "#d97706"
        }
      }
    }
  },
  plugins: []
};
