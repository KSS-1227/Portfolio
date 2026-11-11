import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#030303",
        surface: {
          50: "#18181b",
          100: "#121214",
          200: "#0c0c0e",
          300: "#070708",
        },
        border: "rgba(255, 255, 255, 0.08)",
        foreground: "#ededed",
        muted: "#8b8b93",
      },
      fontFamily: {
        serif: [
          "'Instrument Serif'",
          "'Playfair Display'",
          "'Cormorant Garamond'",
          "Georgia",
          "Cambria",
          "serif",
        ],
        sans: [
          "'Plus Jakarta Sans'",
          "-apple-system",
          "BlinkMacSystemFont",
          "'Segoe UI'",
          "Roboto",
          "sans-serif",
        ],
        mono: [
          "'JetBrains Mono'",
          "'SF Mono'",
          "Consolas",
          "monospace",
        ],
      },
      letterSpacing: {
        tightest: "-0.04em",
        tighter: "-0.02em",
        widestEditorial: "0.25em",
      },
    },
  },
  plugins: [],
};
export default config;
