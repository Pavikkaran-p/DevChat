import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-inter)", "Inter", "system-ui", "sans-serif"],
      },
      colors: {
        surface: {
          50: "#f0f1f5",
          100: "#d0d3de",
          200: "#a1a7bd",
          300: "#727a9c",
          400: "#535c80",
          500: "#3a4268",
          600: "#2d3352",
          700: "#1e2340",
          800: "#151a30",
          900: "#0d1120",
          950: "#080b16",
        },
        accent: {
          50: "#eef0ff",
          100: "#dde1ff",
          200: "#c3c8ff",
          300: "#a0a6ff",
          400: "#8185ff",
          500: "#6c5ce7",
          600: "#5a3fd4",
          700: "#4c33b0",
          800: "#3e2b8e",
          900: "#352873",
          950: "#1f1744",
        },
        glow: {
          indigo: "#6c5ce7",
          violet: "#a855f7",
          cyan: "#22d3ee",
          emerald: "#34d399",
        },
      },
      animation: {
        "fade-in": "fadeIn 0.3s ease-out",
        "fade-in-up": "fadeInUp 0.4s ease-out",
        "slide-in-left": "slideInLeft 0.3s ease-out",
        "slide-in-right": "slideInRight 0.3s ease-out",
        "pulse-soft": "pulseSoft 2s ease-in-out infinite",
        "bounce-dot": "bounceDot 1.4s ease-in-out infinite",
        "shimmer": "shimmer 2s linear infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        fadeInUp: {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        slideInLeft: {
          "0%": { opacity: "0", transform: "translateX(-16px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        slideInRight: {
          "0%": { opacity: "0", transform: "translateX(16px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        pulseSoft: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.6" },
        },
        bounceDot: {
          "0%, 80%, 100%": { transform: "scale(0)" },
          "40%": { transform: "scale(1)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
      backdropBlur: {
        xs: "2px",
      },
      boxShadow: {
        glow: "0 0 20px rgba(108, 92, 231, 0.3)",
        "glow-lg": "0 0 40px rgba(108, 92, 231, 0.4)",
        "inner-glow": "inset 0 1px 0 rgba(255, 255, 255, 0.05)",
      },
    },
  },
  plugins: [],
};

export default config;
