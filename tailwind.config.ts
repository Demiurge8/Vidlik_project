import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        vidblack: "#0a0a0a",
        vidgray: "#0f1012",
        acid: "#98ff22",
      },
      boxShadow: {
        acid20: "0 0 20px #98ff22",
        acid24: "0 0 24px #98ff22",
        acid40: "0 0 40px #98ff22",
        acid44: "0 0 44px #98ff22",
        acid60: "0 0 60px rgba(152,255,34,0.25)",
      },
    },
  },
  plugins: [],
};

export default config;
