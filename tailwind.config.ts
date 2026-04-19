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
        brand: {
          gunmetal: "#20373B",
          moonstone: "#519CAB",
          saffron: "#FFC64F",
          lightblue: "#C3E7F1",
          bg: "#F9FAFB",
          success: "#22c55e",
          error: "#ef4444",
        },
        text: {
          primary: "#20373B",
          secondary: "#4B5563",
          muted: "#9CA3AF",
        },
      },
      fontFamily: {
        sans: ["var(--font-ibm-plex)", "ui-sans-serif", "system-ui"],
        display: ["var(--font-sora)", "var(--font-outfit)", "ui-serif"],
      },
      boxShadow: {
        sm: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
        md: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
        lg: "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
        soft: "0 20px 25px -5px rgb(0 0 0 / 0.05), 0 8px 10px -6px rgb(0 0 0 / 0.05)",
      },
      borderRadius: {
        xl: "24px",
        lg: "20px",
        md: "12px",
        sm: "8px",
      },
    },
  },
  plugins: [],
};
export default config;
