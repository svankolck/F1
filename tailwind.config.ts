import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        "f1-bg": "#1a0a0a",
        "f1-surface": "#221010",
        "f1-red": "#e10600",
        "f1-red-glow": "rgba(225, 6, 0, 0.4)",
        "f1-card": "rgba(255, 255, 255, 0.05)",
        "f1-border": "rgba(255, 255, 255, 0.1)",
        "f1-text": "#ffffff",
        "f1-text-secondary": "#9ca3af",
        "f1-text-muted": "#6b7280",
      },
      fontFamily: {
        display: ["Space Grotesk", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      backgroundImage: {
        "grid-pattern":
          "linear-gradient(to right, #331515 1px, transparent 1px), linear-gradient(to bottom, #331515 1px, transparent 1px)",
      },
      animation: {
        "pulse-glow": "pulseGlow 2s ease-in-out infinite",
        "count-tick": "countTick 1s ease-in-out",
      },
      keyframes: {
        pulseGlow: {
          "0%, 100%": { boxShadow: "0 0 15px rgba(225, 6, 0, 0.3)" },
          "50%": { boxShadow: "0 0 30px rgba(225, 6, 0, 0.6)" },
        },
        countTick: {
          "0%": { transform: "scale(1.1)", opacity: "0.7" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
