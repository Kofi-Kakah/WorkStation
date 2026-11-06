const colors = {
  base: "var(--bg-base)",
  "bg-base": "var(--bg-base)",
  sidebar: "var(--bg-sidebar)",
  "bg-sidebar": "var(--bg-sidebar)",
  surface: "var(--bg-surface)",
  "bg-surface": "var(--bg-surface)",
  "surface-raised": "var(--bg-surface-raised)",
  "bg-surface-raised": "var(--bg-surface-raised)",
  "border-subtle": "var(--border-subtle)",
  primary: "var(--text-primary)",
  secondary: "var(--text-secondary)",
  muted: "var(--text-muted)",
  "text-primary": "var(--text-primary)",
  "text-secondary": "var(--text-secondary)",
  "text-muted": "var(--text-muted)",
  "on-accent": "var(--text-on-accent)",
  accent: "var(--accent)",
  "accent-hot": "var(--accent-hot)",
  "accent-deep": "var(--accent-deep)",
  "accent-soft": "var(--accent-soft)",
  "accent-border": "var(--accent-border)",
  success: "var(--success)",
  "success-soft": "var(--success-soft)",
  danger: "var(--danger)",
  warning: "var(--warning)",
  "warning-soft": "var(--warning-soft)",
  info: "var(--info)",
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
        accent: "var(--shadow-accent)",
        "accent-glow": "var(--shadow-accent)",
      },
      backgroundImage: {
        primary: "var(--gradient-primary)",
      },
    },
  },
};
