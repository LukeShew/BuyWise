import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        ink: "#172126",
        paper: "#f8faf7",
        mint: "#4f9d7e",
        amber: "#d48b2a",
        danger: "#bd4b4b"
      },
      boxShadow: {
        soft: "0 20px 70px rgba(23, 33, 38, 0.08)"
      }
    }
  },
  plugins: []
};

export default config;
