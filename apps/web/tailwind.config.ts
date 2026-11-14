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
        background: "#FDFCF7",
        foreground: "#0B132B",
        muted: "#64748B",
        border: "#E2E8F0",
        brand: {
          teal: "#0F766E",
          tealLight: "#CCFBF1",
          navy: "#1E3A8A",
          navyDark: "#0B132B",
        },
        emergency: {
          red: "#DC2626",
          redDark: "#991B1B",
          redLight: "#FEE2E2",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        subtle: "0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px -1px rgba(0, 0, 0, 0.05)",
        card: "0 4px 6px -1px rgba(11, 19, 43, 0.05), 0 2px 4px -2px rgba(11, 19, 43, 0.05)",
      },
      borderRadius: {
        lg: "0.75rem",
        md: "0.5rem",
        sm: "0.375rem",
      },
    },
  },
  plugins: [],
};

export default config;
