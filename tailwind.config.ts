import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          gold: "#8F6814",
          "gold-light": "#C9A227",
          ink: "#1A1410",
          dark: "#F8F6F2",
          surface: "#FFFFFF",
          card: "#FFFFFF",
          muted: "#5C5248",
          line: "#E5DDD0",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
