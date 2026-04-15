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
        gold: "#f2c66d"
      },
      boxShadow: {
        soft: "0 20px 50px rgba(20, 46, 34, 0.08)"
      },
      fontFamily: {
        sans: ["ui-sans-serif", "system-ui", "sans-serif"]
      }
    }
  },
  plugins: []
};

export default config;
