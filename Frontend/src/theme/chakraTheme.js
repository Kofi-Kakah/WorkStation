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
    50: "var(--amethyst-50)",
    100: "var(--amethyst-100)",
    200: "var(--amethyst-200)",
    300: "var(--amethyst-300)",
    400: "var(--amethyst-400)",
    500: "var(--amethyst-500)",
    600: "var(--amethyst-600)",
    700: "var(--amethyst-700)",
    800: "var(--amethyst-800)",
    900: "var(--amethyst-900)",
  },
  amethyst: {
    50: "var(--amethyst-50)",
    100: "var(--amethyst-100)",
    200: "var(--amethyst-200)",
    300: "var(--amethyst-300)",
    400: "var(--amethyst-400)",
    500: "var(--amethyst-500)",
    600: "var(--amethyst-600)",
    700: "var(--amethyst-700)",
    800: "var(--amethyst-800)",
    900: "var(--amethyst-900)",
    950: "var(--amethyst-950)",
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
    initialColorMode: "system",
    useSystemColorMode: false,
  },
});

export default theme;
