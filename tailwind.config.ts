import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        'strava-orange': '#FC4C02',
        'strava-light': '#FFFFFF',
        strava: {
          orange: '#fc4c02',
          gray: '#242428',
          navy: '#1a1a1f',
          light: '#f7f7fa',
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
