import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          950: "#000000",
          900: "#0A0A0A",
          800: "#111111",
          700: "#222222"
        },
        neon: {
          cyan: "#00e5ff",
          mint: "#3291ff",
          amber: "#ffcc00"
        }
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(255,255,255,0.08), 0 8px 30px rgba(0,0,0,0.5)"
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
