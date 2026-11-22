import type { Config } from "tailwindcss";
export default {
  content: ["./app/**/*.tsx", "./components/**/*.tsx"],
  theme: {
    extend: {
      colors: {
        bg:      "#F5F4F1",   // warm off-white canvas
        surface: "#FFFFFF",   // pure white card surface
        ink:     "#1A1A1A",   // near-black body text
        mute:    "#7A7A72",   // secondary text
        line:    "#E6E5E0",   // borders, dividers
        brand:   "#276B5A",   // forest green — primary action
        amber:   "#D89B54",   // amber — warnings, secondary goal badge
        info:    "#5685B8",   // slate blue — info
        danger:  "#C65B55",   // terracotta — errors, urgent
        ok:      "#43866B",   // sage green — success
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["ui-monospace", "Menlo", "SF Mono", "monospace"],
      },
      borderRadius: {
        xl: "12px",
        "2xl": "16px",
      },
      boxShadow: {
        sm: "0 1px 3px 0 rgb(0 0 0 / 0.06), 0 1px 2px -1px rgb(0 0 0 / 0.04)",
        md: "0 4px 12px 0 rgb(0 0 0 / 0.08)",
      },
    },
  },
  plugins: [],
} satisfies Config;
