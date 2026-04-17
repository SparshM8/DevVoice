import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          950: "#080b14",
          900: "#101525",
          800: "#1a2238",
          700: "#263150"
        },
        neon: {
          cyan: "#26d9ff",
          mint: "#57f0ba",
          amber: "#ffc36f"
        }
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(38,217,255,0.3), 0 10px 45px rgba(5,12,34,0.55)"
      },
      animation: {
        "pulse-soft": "pulseSoft 1.8s ease-in-out infinite",
        float: "float 3.5s ease-in-out infinite"
      },
      keyframes: {
        pulseSoft: {
          "0%, 100%": { opacity: "0.8" },
          "50%": { opacity: "1" }
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-8px)" }
        }
      }
    }
  },
  plugins: [],
};

export default config;
