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
        background: "#FFFFFF",
        foreground: "#09090B",
        surface: {
          50: "#FAFAFA",
          100: "#F4F4F5",
          200: "#E4E4E7",
          300: "#D4D4D8",
          800: "#27272A",
          900: "#18181B",
          950: "#09090B",
        },
        muted: {
          DEFAULT: "#71717A",
          dark: "#52525B",
          light: "#A1A1AA",
        },
        border: {
          DEFAULT: "#E4E4E7",
          subtle: "#F4F4F5",
          dark: "#27272A",
        },
        brand: {
          DEFAULT: "#0F172A",
          hover: "#1E293B",
          accent: "#2563EB",
          teal: "#0D9488",
          tealLight: "#F0FDFA",
        },
        emergency: {
          DEFAULT: "#E11D48",
          dark: "#BE123C",
          light: "#FFF1F2",
          border: "#FECDD3",
        },
        verified: {
          DEFAULT: "#059669",
          light: "#ECFDF5",
          border: "#A7F3D0",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
      },
      letterSpacing: {
        tighter: "-0.04em",
        tight: "-0.02em",
        normal: "0em",
        wide: "0.02em",
        wider: "0.05em",
        widest: "0.1em",
      },
      boxShadow: {
        subtle: "0 1px 2px 0 rgba(0, 0, 0, 0.04)",
        card: "0 1px 3px 0 rgba(0, 0, 0, 0.04), 0 1px 2px -1px rgba(0, 0, 0, 0.04)",
        elevated: "0 10px 25px -5px rgba(0, 0, 0, 0.04), 0 8px 10px -6px rgba(0, 0, 0, 0.02)",
        focus: "0 0 0 2px #FFFFFF, 0 0 0 4px #09090B",
      },
      borderRadius: {
        xl: "1rem",
        "2xl": "1.25rem",
        "3xl": "1.5rem",
      },
    },
  },
  plugins: [],
};

export default config;
