/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#2563EB', // SaaS Blue
        secondary: '#1E293B', // Slate Dark
      }
    },
  },
  plugins: [],
}