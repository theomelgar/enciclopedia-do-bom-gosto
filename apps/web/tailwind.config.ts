import type { Config } from "tailwindcss";

export default {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
      primary: {
          DEFAULT: "rgb(var(--primary) / <alpha-value>)",
          dark: "rgb(var(--primary-dark) / <alpha-value>)",
          accent: "rgb(var(--primary-accent) / <alpha-value>)",
        },
        background: "rgb(var(--background) / <alpha-value>)",
        surface: "rgb(var(--surface) / <alpha-value>)",
        neutral: "rgb(var(--neutral) / <alpha-value>)",
        success: "rgb(var(--success) / <alpha-value>)",
        destructive: "rgb(var(--destructive) / <alpha-value>)",
        text: "rgb(var(--text) / <alpha-value>)",
      },
      fontFamily: {
        display: ["Fraunces", "serif"],
        sans: ["Inter", "sans-serif"],
      },
      borderRadius: { xl: "1rem" },
    },
  },
  plugins: [],
} satisfies Config;
