import { type Config } from "tailwindcss";
import { fontFamily } from "tailwindcss/defaultTheme";
import { withUt } from "uploadthing/tw";

export default withUt({
  content: ["./src/**/*.{ts,tsx,mdx}"],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-geist-sans)", ...fontFamily.sans],
      },
      colors: {
        cloudus: {
          bg: "var(--cloudus-bg)",
          fg: "var(--cloudus-foreground)",
          card: "var(--cloudus-card)",
          border: "var(--cloudus-border)",
          accent: "var(--cloudus-accent)",
        },
      },
    },
  },
  plugins: [],
} satisfies Config);
