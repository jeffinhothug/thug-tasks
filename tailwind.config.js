/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#09090b', // zinc-950
        surface: '#18181b',    // zinc-900
        surfaceHover: '#27272a', // zinc-800
        primary: '#3b82f6',    // blue-500
        secondary: '#a1a1aa',  // zinc-400
      }
    },
  },
  plugins: [],
}
