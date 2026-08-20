/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}",
    "./lib/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          light: "#F9FAFB", // pure clean background
          dark: "#111827", // deep minimalist dark
          accent: "#2563EB", // primary focused accent
          accentDark: "#3B82F6",
          borderLight: "#E5E7EB",
          borderDark: "#1F2937",
          surfaceLight: "#FFFFFF",
          surfaceDark: "#1A2233",
        },
      },
      fontFamily: {
        sans: [
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "sans-serif",
        ],
      },
      maxWidth: {
        feed: "640px",
      },
    },
  },
  plugins: [],
};
