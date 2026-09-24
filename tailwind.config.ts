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
        tava: {
          // Paleta afiche "TAVA EN EL ACTO"
          purple: "#1A3A82",
          "purple-light": "#2B54B8",
          gold: "#FFC600",
          "gold-bright": "#FFD84D",
          black: "#0B1220",
          "blue-dark": "#0F2558",
          "neon-pink": "#D61A21",
          "show-yellow": "#FFC600",
          red: "#D61A21",
          yellow: "#FFC600",
          blue: "#1A3A82",
          curtain: {
            DEFAULT: "#D61A21",
            dark: "#8B1014",
            light: "#F03A40",
          },
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "Impact", "Arial Black", "sans-serif"],
        body: ["var(--font-body)", "system-ui", "sans-serif"],
        show: ["var(--font-show)", "cursive"],
        hand: ["var(--font-hand)", "cursive"],
      },
      backgroundImage: {
        "theater-gradient":
          "radial-gradient(ellipse 90% 60% at 50% -10%, rgba(255,198,0,0.22) 0%, transparent 55%), linear-gradient(165deg, #0F2558 0%, #1A3A82 42%, #142E6B 78%, #0B1220 100%)",
        spotlight:
          "radial-gradient(ellipse 80% 50% at 50% 0%, rgba(255,198,0,0.18) 0%, transparent 70%)",
        "halftone-dots":
          "radial-gradient(circle, rgba(255,255,255,0.12) 1.2px, transparent 1.4px)",
      },
      backgroundSize: {
        halftone: "10px 10px",
      },
    },
  },
  plugins: [],
};

export default config;
