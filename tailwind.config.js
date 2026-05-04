/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#fff7ed",
          100: "#ffedd5",
          500: "#f97316",
          600: "#ea580c",
          700: "#c2410c",
          900: "#7c2d12"
        },
        ink: "#241b17",
        sand: "#fffaf5",
        mint: "#e6fff6",
        rose: "#fff1f2"
      },
      boxShadow: {
        soft: "0 16px 40px rgba(94, 43, 16, 0.10)"
      },
      fontFamily: {
        sans: ["Pretendard", "system-ui", "sans-serif"]
      }
    },
  },
  plugins: [],
};
