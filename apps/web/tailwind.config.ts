import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#FAFAFD",
        surface: "#FFFFFF",
        surfaceHover: "#F8FAFC",
        foreground: "#090D1A",
        muted: "#64748B",
        mutedLight: "#94A3B8",
        border: "#E2E8F0",
        borderLight: "#F1F5F9",
        brand: {
          rose: "#E11D48",
          roseHover: "#BE123C",
          roseLight: "#FFE4E6",
          teal: "#0D9488",
          tealHover: "#0F766E",
          tealLight: "#CCFBF1",
          navy: "#0F172A",
          navyHover: "#1E293B",
          navyDark: "#090D1A",
          emerald: "#10B981",
          emeraldLight: "#ECFDF5",
          indigo: "#4F46E5",
          indigoLight: "#EEF2FF",
        },
        emergency: {
          red: "#E11D48",
          redDark: "#9F1239",
          redLight: "#FFE4E6",
        },
      },
      fontFamily: {
        heading: ["'Plus Jakarta Sans'", "system-ui", "-apple-system", "sans-serif"],
        sans: ["'Inter'", "system-ui", "-apple-system", "sans-serif"],
        mono: ["'JetBrains Mono'", "monospace"],
      },
      boxShadow: {
        subtle: "0 1px 3px 0 rgba(0, 0, 0, 0.04), 0 1px 2px -1px rgba(0, 0, 0, 0.04)",
        card: "0 4px 20px -2px rgba(15, 23, 42, 0.05), 0 2px 6px -1px rgba(15, 23, 42, 0.03)",
        cardHover: "0 20px 40px -4px rgba(15, 23, 42, 0.09), 0 4px 12px -2px rgba(15, 23, 42, 0.04)",
        glowRose: "0 0 35px -5px rgba(225, 29, 72, 0.35)",
        glowTeal: "0 0 35px -5px rgba(13, 148, 136, 0.3)",
        glowEmerald: "0 0 35px -5px rgba(16, 185, 129, 0.3)",
      },
      borderRadius: {
        xl: "1rem",
        "2xl": "1.25rem",
        "3xl": "1.75rem",
      },
      keyframes: {
        ripple: {
          "0%": { transform: "scale(0.8)", opacity: "1" },
          "100%": { transform: "scale(2.2)", opacity: "0" },
        },
        radar: {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
      },
      animation: {
        "ripple-fast": "ripple 1.5s cubic-bezier(0, 0.2, 0.8, 1) infinite",
        "ripple-slow": "ripple 3s cubic-bezier(0, 0.2, 0.8, 1) infinite",
        "radar-sweep": "radar 4s linear infinite",
      },
    },
  },
  plugins: [],
};

export default config;
