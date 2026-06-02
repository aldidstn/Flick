import type { Config } from "tailwindcss";
import forms from "@tailwindcss/forms";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        duo: "#58cc02",
        "duo-dark": "#3f8f01",
        "duo-light": "#d7ffb8",
        sky: "#1cb0f6",
        sunshine: "#ffc700",
        grape: "#a570ff",
        bubblegum: "#cc348d",
        snow: "#ffffff",
        cloud: "#e5e5e5",
        silver: "#afafaf",
        graphite: "#777777",
        charcoal: "#4b4b4b",
        ink: "#3c3c3c",
        cocoa: "#777777",
        milk: "#ffffff",
        citrus: "#58cc02",
        coral: "#1cb0f6",
        aqua: "#a570ff",
        plum: "#4b4b4b"
      },
      boxShadow: {
        button: "0 4px 0 #3f8f01",
        "button-blue": "0 4px 0 #1181b8",
        surface: "0 18px 44px rgb(60 60 60 / 0.08)"
      },
      fontFamily: {
        display: ["var(--font-feather)", "Arial Rounded MT Bold", "sans-serif"],
        body: ["var(--font-din-round)", "Nunito Sans", "sans-serif"]
      }
    }
  },
  plugins: [forms]
};

export default config;
