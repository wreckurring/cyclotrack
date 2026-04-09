/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./App.jsx",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Roboto", "system-ui", "sans-serif"],
      },
      colors: {
        g: {
          // Surfaces
          bg:      "#F1F3F4",
          surface: "#FFFFFF",
          "bg-subtle": "#F8F9FA",

          // Borders
          border:  "#DADCE0",
          "border-strong": "#BDC1C6",

          // Text
          ink:     "#202124",
          "ink-2": "#3C4043",
          muted:   "#5F6368",
          faint:   "#80868B",

          // Primary (Google Blue)
          blue:    "#1A73E8",
          "blue-hover": "#1557B0",
          "blue-tint":  "#E8F0FE",
          "blue-tint-hover": "#D2E3FC",

          // Status: Green
          green:       "#1E8E3E",
          "green-tint": "#E6F4EA",

          // Status: Yellow
          yellow:       "#F9AB00",
          "yellow-tint": "#FEF7E0",

          // Status: Red
          red:       "#D93025",
          "red-tint": "#FCE8E6",

          // Status: Gray (disconnected)
          gray:       "#80868B",
          "gray-tint": "#F1F3F4",
        },
      },
      boxShadow: {
        "g-card": "0 1px 2px 0 rgba(60,64,67,.15), 0 1px 3px 1px rgba(60,64,67,.1)",
        "g-card-hover": "0 1px 3px 0 rgba(60,64,67,.3), 0 4px 8px 3px rgba(60,64,67,.1)",
        "g-nav": "0 1px 3px 0 rgba(60,64,67,.15)",
      },
    },
  },
  plugins: [],
};
