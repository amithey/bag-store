import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        cream: "#F5F0E8",
        bone: "#EBE3D5",
        ink: "#1A1A1A",
        taupe: "#8B6F47",
        gold: "#B8956A",
        muted: "#7A6E5E",
        line: "#D9CFC1",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        serif: ["var(--font-serif)", "Georgia", "serif"],
      },
      maxWidth: {
        editorial: "1280px",
      },
      letterSpacing: {
        "eyebrow": "0.3em",
      },
      transitionTimingFunction: {
        "editorial": "cubic-bezier(0.22, 1, 0.36, 1)",
      },
    },
  },
  plugins: [],
};

export default config;
