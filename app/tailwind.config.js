/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          950: "#050617",
          900: "#0b1026",
          800: "#131a3a",
        },
        paper: {
          50: "#fbfaf7",
          100: "#f6f1e6",
        },
        saffron: {
          50: "#fff7ed",
          500: "#f59e0b",
          600: "#d97706",
        },
        lotus: {
          500: "#ec4899",
          600: "#db2777",
        },
        jade: {
          500: "#10b981",
          600: "#059669",
        },
        maroon: {
          950: "#2a0610",
          900: "#3a0a16",
          800: "#5b0f1a",
        },
        gold: {
          50: "#fff9db",
          200: "#fde68a",
          500: "#fbbf24",
          700: "#b45309",
        },
      },
      fontFamily: {
        display: ["ui-serif", "Georgia", "serif"],
        sans: ["ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "Roboto", "Helvetica", "Arial", "Noto Sans", "sans-serif"],
      },
      boxShadow: {
        soft: "0 12px 30px rgba(0,0,0,0.18)",
        glow: "0 0 0 1px rgba(251,191,36,0.20), 0 18px 45px rgba(0,0,0,0.18)",
      },
      backgroundImage: {
        // Soft “thangka/mandala” light play: warm gold + lotus + jade, with a faint conic accent.
        "mandala":
          "radial-gradient(1100px circle at 12% 8%, rgba(245,158,11,0.22), transparent 60%)," +
          "radial-gradient(950px circle at 88% 28%, rgba(236,72,153,0.18), transparent 60%)," +
          "radial-gradient(950px circle at 50% 115%, rgba(16,185,129,0.14), transparent 60%)," +
          "conic-gradient(from 210deg at 55% 35%, rgba(251,191,36,0.08), rgba(219,39,119,0.06), rgba(5,150,105,0.06), rgba(251,191,36,0.08))",
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
};

