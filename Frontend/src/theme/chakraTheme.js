import { extendTheme } from "@chakra-ui/react";

const colors = {
  base: "var(--bg-base)",
  sidebar: "var(--bg-sidebar)",
  surface: "var(--bg-surface)",
  surfaceRaised: "var(--bg-surface-raised)",
  borderSubtle: "var(--border-subtle)",
  textPrimary: "var(--text-primary)",
  textSecondary: "var(--text-secondary)",
  textMuted: "var(--text-muted)",
  accent: "var(--accent)",
  accentHot: "var(--accent-hot)",
  accentDeep: "var(--accent-deep)",
  accentSoft: "var(--accent-soft)",
  accentBorder: "var(--accent-border)",
  success: "var(--success)",
  successSoft: "var(--success-soft)",
  danger: "var(--danger)",
  warning: "var(--warning)",
  info: "var(--info)",
  gray: {
    50: "var(--text-primary)",
    100: "var(--text-primary)",
    200: "var(--text-secondary)",
    300: "var(--text-secondary)",
    400: "var(--text-muted)",
    500: "var(--text-muted)",
    600: "var(--text-secondary)",
    700: "var(--text-secondary)",
    800: "var(--text-primary)",
    900: "var(--bg-base)",
  },
  orange: {
    50: "var(--accent-soft)",
    100: "var(--accent-soft)",
    200: "var(--accent-border)",
    300: "var(--accent-hot)",
    400: "var(--accent-hot)",
    500: "var(--accent)",
    600: "var(--accent)",
    700: "var(--accent-deep)",
    800: "var(--accent-deep)",
    900: "var(--accent-deep)",
  },
  ember: {
    50: "var(--accent-soft)",
    100: "var(--accent-soft)",
    200: "var(--accent-border)",
    300: "var(--accent-hot)",
    400: "var(--accent-hot)",
    500: "var(--accent)",
    600: "var(--accent)",
    700: "var(--accent-deep)",
    800: "var(--accent-deep)",
    900: "var(--accent-deep)",
  },
  amethyst: {
    50: "var(--accent-soft)",
    100: "var(--accent-soft)",
    200: "var(--accent-border)",
    300: "var(--accent-hot)",
    400: "var(--accent-hot)",
    500: "var(--accent)",
    600: "var(--accent)",
    700: "var(--accent-deep)",
    800: "var(--accent-deep)",
    900: "var(--accent-deep)",
  },
  semantic: {
    success: "var(--success)",
    warning: "var(--warning)",
    error: "var(--danger)",
    info: "var(--info)",
  },
};

const theme = extendTheme({
  colors,
  fonts: {
    body: '"Inter", ui-sans-serif, system-ui, sans-serif',
    heading:
      '"Inter", ui-sans-serif, system-ui, sans-serif',
    mono: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
  },
  styles: {
    global: () => ({
      "html, body, #root": {
        minHeight: "100%",
        height: "100%",
      },
      body: {
        bg: "var(--bg-base)",
        color: "var(--text-primary)",
        minHeight: "100%",
        overflowX: "hidden",
      },
    }),
  },
  components: {
    Button: {
      baseStyle: {
        fontWeight: "600",
        borderRadius: "10px",
      },
      variants: {
        solid: () => ({
          bg: "accent",
          color: "white",
          _hover: { bg: "accentHot" },
          _active: { bg: "accentDeep" },
        }),
        ghost: () => ({
          color: "textSecondary",
          _hover: {
            bg: "surfaceRaised",
            color: "textPrimary",
          },
        }),
      },
    },
  },
  config: {
    initialColorMode: "dark",
    useSystemColorMode: false,
  },
});

export default theme;
