import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        canvas: "#fafaf9",
        node: {
          root: "#1f2937",
          branch: "#3b82f6",
          leaf: "#f3f4f6",
        },
      },
    },
  },
  plugins: [],
};

export default config;
