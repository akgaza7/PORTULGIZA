import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}", "./components/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: "#12211a",
        moss: "#dfece4",
        pine: "#204533",
        sand: "#f6f3ec",
        coral: "#ff8d6d",
        gold: "#f2c66d",
        ocean: "#0d4b74",
        sky: "#94c6d7",
        sun: "#f4b942",
        clay: "#e96b4c",
        portugalGreen: "#046a38",
        portugalBlue: "#003399",
        portugalRed: "#c8102e",
        portugalGold: "#ffcd00"
      },
      boxShadow: {
        soft: "0 20px 50px rgba(20, 46, 34, 0.1)"
      },
      fontFamily: {
        sans: ["Palatino Linotype", "Book Antiqua", "Palatino", "Georgia", "serif"],
        display: ["Palatino Linotype", "Book Antiqua", "Palatino", "Georgia", "serif"]
      }
    }
  },
  plugins: []
};

export default config;
