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
        display: ["var(--font-newsreader)", "Iowan Old Style", "Palatino", "Georgia", ...fontFamily.serif],
      },
      spacing: {
        18: "4.5rem",
        22: "5.5rem",
      },
      colors: {
        cloudus: {
          bg: "var(--cloudus-bg)",
          fg: "var(--cloudus-foreground)",
          card: "var(--cloudus-card)",
          border: "var(--cloudus-border)",
          accent: "var(--cloudus-accent)",
        },
        os: {
          bg: "var(--os-bg)",
          elevated: "var(--os-bg-elevated)",
          fg: "var(--os-fg)",
          muted: "var(--os-fg-muted)",
          card: "var(--os-card)",
          border: "var(--os-border)",
          accent: "var(--os-accent)",
          soft: "var(--os-accent-soft)",
          success: "var(--os-success)",
          warning: "var(--os-warning)",
          danger: "var(--os-danger)",
          ink: "var(--os-ink)",
          navy: "var(--os-navy)",
          gold: "var(--os-gold)",
          bronze: "var(--os-bronze)",
          rust: "var(--os-rust)",
          burgundy: "var(--os-burgundy)",
          forest: "var(--os-forest)",
          ochre: "var(--os-ochre)",
        },
      },
      boxShadow: {
        os: "var(--os-shadow)",
      },
      borderRadius: {
        os: "1.5rem",
      },
    },
  },
  plugins: [],
} satisfies Config);
