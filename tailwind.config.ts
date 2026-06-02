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
          purple: "#7C3AED",
          "purple-light": "#A78BFA",
          gold: "#D97706",
          "gold-bright": "#F59E0B",
          black: "#1F2937",
          "blue-dark": "#EDE9FE",
          "neon-pink": "#DB2777",
          "show-yellow": "#EAB308",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
        body: ["var(--font-body)", "system-ui", "sans-serif"],
      },
      backgroundImage: {
        "theater-gradient":
          "linear-gradient(160deg, #FFFBEB 0%, #FFFFFF 40%, #F5F3FF 70%, #FDF2F8 100%)",
        spotlight:
          "radial-gradient(ellipse 80% 50% at 50% 0%, rgba(124,58,237,0.08) 0%, transparent 70%)",
      },
    },
  },
  plugins: [],
};

export default config;
