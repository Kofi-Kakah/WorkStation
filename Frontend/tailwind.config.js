const colors = {
  base: "var(--bg-base)",
  app: "var(--bg-base)",
  "app-dark": "var(--bg-base)",
  sidebar: "var(--bg-sidebar)",
  surface: "var(--bg-surface)",
  "surface-raised": "var(--bg-surface-raised)",
  "border-subtle": "var(--border-subtle)",
  primary: "var(--text-primary)",
  secondary: "var(--text-secondary)",
  muted: "var(--text-muted)",
  "text-primary": "var(--text-primary)",
  "text-secondary": "var(--text-secondary)",
  "text-secondary-dark": "var(--text-secondary)",
  "text-muted": "var(--text-muted)",
  accent: "var(--accent)",
  "accent-hot": "var(--accent-hot)",
  "accent-deep": "var(--accent-deep)",
  "accent-soft": "var(--accent-soft)",
  "accent-border": "var(--accent-border)",
  success: "var(--success)",
  "success-soft": "var(--success-soft)",
  danger: "var(--danger)",
  warning: "var(--warning)",
  info: "var(--info)",
  amethyst: {
    50: "var(--bg-base)",
    100: "var(--accent-soft)",
    200: "var(--accent-soft)",
    300: "var(--accent-hot)",
    400: "var(--accent-hot)",
    500: "var(--accent)",
    600: "var(--accent)",
    700: "var(--accent-deep)",
    800: "var(--accent-deep)",
    900: "var(--accent-deep)",
    950: "var(--bg-base)",
  },
};

/** @type {import('tailwindcss').Config} */
export default {
  theme: {
    extend: {
      colors,
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      borderRadius: {
        card: "var(--radius-card)",
        control: "var(--radius-control)",
        icon: "var(--radius-icon)",
      },
      boxShadow: {
        "accent-glow": "var(--shadow-accent)",
      },
      backgroundImage: {
        primary: "var(--gradient-primary)",
      },
    },
  },
};
