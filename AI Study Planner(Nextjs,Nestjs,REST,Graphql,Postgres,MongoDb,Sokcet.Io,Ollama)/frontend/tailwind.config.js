/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#6C47FF",
          light: "#8B6FFF",
          dark: "#5035CC",
        },
        sidebar: "#F8F9FC",
        card: "#FFFFFF",
        accent: "#FF6B6B",
        success: "#4CAF50",
        warning: "#FF9800",
        muted: "#9CA3AF",
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
      },
    },
  },
  plugins: [],
};
