/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // Dusty Rose & Cream palette (original Mindora choice).
        // Values are CSS variables so light/dark themes can adapt.
        brand: {
          50: "rgb(var(--color-brand-50) / <alpha-value>)",
          100: "rgb(var(--color-brand-100) / <alpha-value>)",
          200: "rgb(var(--color-brand-200) / <alpha-value>)",
          300: "rgb(var(--color-brand-300) / <alpha-value>)",
          400: "rgb(var(--color-brand-400) / <alpha-value>)",
          500: "rgb(var(--color-brand-500) / <alpha-value>)",
          600: "rgb(var(--color-brand-600) / <alpha-value>)",
          700: "rgb(var(--color-brand-700) / <alpha-value>)",
          800: "rgb(var(--color-brand-800) / <alpha-value>)",
          900: "rgb(var(--color-brand-900) / <alpha-value>)",
        },
        // Neutral text scale.
        ink: {
          DEFAULT: "rgb(var(--color-ink-default) / <alpha-value>)",
          900: "rgb(var(--color-ink-900) / <alpha-value>)",
          800: "rgb(var(--color-ink-800) / <alpha-value>)",
          700: "rgb(var(--color-ink-700) / <alpha-value>)",
          600: "rgb(var(--color-ink-600) / <alpha-value>)",
          500: "rgb(var(--color-ink-500) / <alpha-value>)",
          400: "rgb(var(--color-ink-400) / <alpha-value>)",
          300: "rgb(var(--color-ink-300) / <alpha-value>)",
        },
        // Semantic surfaces and borders.
        canvas: "rgb(var(--color-canvas) / <alpha-value>)",
        surface: "rgb(var(--color-surface) / <alpha-value>)",
        "surface-muted": "rgb(var(--color-surface-muted) / <alpha-value>)",
        mist: "rgb(var(--color-mist) / <alpha-value>)",
        blush: "rgb(var(--color-blush) / <alpha-value>)",
        line: "rgb(var(--color-line) / <alpha-value>)",
        "line-strong": "rgb(var(--color-line-strong) / <alpha-value>)",
        // Deep indigo companion ramp for emphasis and high-contrast accents
        // that pair with the brand lavender.
        accent: {
          50: "#eef2ff",
          100: "#e0e7ff",
          200: "#c7d2fe",
          300: "#a5b4fc",
          400: "#818cf8",
          500: "#6366f1",
          600: "#4f46e5",
          700: "#4338ca",
          800: "#3730a3",
          900: "#312e81",
        },
        // Shared chart palette so admin and professional visualisations stay
        // consistent with the lavender/indigo design system.
        chart: {
          lavender: "#8878ed",
          indigo: "#6366f1",
          sky: "#4f9dff",
          mint: "#34c98f",
          amber: "#e0a44a",
          rose: "#e57384",
          grid: "#ebe7f4",
          axis: "#716d7c",
        },
      },
      fontFamily: {
        sans: [
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          '"Segoe UI"',
          "Roboto",
          "sans-serif",
        ],
      },
      fontSize: {
        display: [
          "2.75rem",
          { lineHeight: "1.05", letterSpacing: "-0.04em", fontWeight: "700" },
        ],
        title: [
          "1.75rem",
          { lineHeight: "1.15", letterSpacing: "-0.03em", fontWeight: "600" },
        ],
      },
      borderRadius: {
        "4xl": "2rem",
        "5xl": "2.5rem",
      },
      boxShadow: {
        soft: "0 1px 2px rgba(56,52,49,0.04), 0 10px 30px -14px rgba(143,81,91,0.16)",
        card: "0 1px 3px rgba(56,52,49,0.05), 0 14px 36px -18px rgba(143,81,91,0.18)",
        lift: "0 22px 44px -22px rgba(143,81,91,0.24)",
        panel:
          "0 1px 2px rgba(56,52,49,0.04), 0 20px 44px -26px rgba(79,44,50,0.22)",
      },
      transitionTimingFunction: {
        "out-soft": "cubic-bezier(0.22, 1, 0.36, 1)",
      },
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(4px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "scale-in": {
          "0%": { opacity: "0", transform: "scale(0.97)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.3s ease-out both",
        "scale-in": "scale-in 0.15s ease-out both",
      },
    },
  },
  plugins: [],
};
