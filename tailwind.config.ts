import type { Config } from "tailwindcss";

export default {
  content: {
    files: ["./app/**/*.{js,jsx,ts,tsx}"],
  },
  theme: {
    extend: {
      colors: {
        admin: {
          bg: "#f8fafc",
          sidebar: "#0f172a",
          "sidebar-hover": "#1e293b",
          "sidebar-active": "#334155",
          primary: "#3b82f6",
          "primary-hover": "#2563eb",
          accent: "#8b5cf6",
          success: "#10b981",
          warning: "#f59e0b",
          danger: "#ef4444",
          muted: "#64748b",
          border: "#e2e8f0",
          card: "#ffffff",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 3px 0 rgb(0 0 0 / 0.04), 0 1px 2px -1px rgb(0 0 0 / 0.04)",
        "card-hover":
          "0 4px 6px -1px rgb(0 0 0 / 0.06), 0 2px 4px -2px rgb(0 0 0 / 0.06)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
