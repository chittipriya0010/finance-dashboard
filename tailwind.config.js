/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}"
  ],
  theme: {
    extend: {
      colors: {
        ink: "#12181B",
        paper: "#F7F5F0",
        moss: "#3F5E4F",
        clay: "#B4592F",
        slate: "#5A6670",
        line: "#DEDAD0"
      },
      fontFamily: {
        display: ["'Fraunces'", "serif"],
        body: ["'Inter'", "sans-serif"],
        mono: ["'IBM Plex Mono'", "monospace"]
      }
    },
  },
  plugins: [],
}
