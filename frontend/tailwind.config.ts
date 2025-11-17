import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#2B6EFF",
          dark: "#1E4DB8",
          light: "#5A8FFF",
        },
        success: {
          DEFAULT: "#2EC27E",
          dark: "#1E9B5F",
          light: "#4ED99E",
        },
        background: "#F6F7FB",
        card: "#FFFFFF",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        heading: ["Poppins", "Inter", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;



