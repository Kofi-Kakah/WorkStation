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
  textOnAccent: "var(--text-on-accent)",
  accent: "var(--accent)",
  accentHot: "var(--accent-hot)",
  accentDeep: "var(--accent-deep)",
  accentSoft: "var(--accent-soft)",
  accentBorder: "var(--accent-border)",
  success: "var(--success)",
  successSoft: "var(--success-soft)",
  danger: "var(--danger)",
  warning: "var(--warning)",
  warningSoft: "var(--warning-soft)",
  info: "var(--info)",
  orange: {
    50: "#FFF7ED",
    100: "#FFEDD5",
    200: "#FED7AA",
    300: "#FDBA74",
    400: "#FB923C",
    500: "#FF6A2B",
    600: "#EA580C",
    700: "#C2410C",
    800: "#9A3412",
    900: "#7C2D12",
  },
  gray: {
    50: "#F5F1EE",
    100: "#E6E0DA",
    200: "#C9C0B8",
    300: "#A39A94",
    400: "#857B74",
    500: "#6B625C",
    600: "#4A423D",
    700: "#2A2420",
    800: "#1C1816",
    900: "#151210",
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
    heading: '"Inter", ui-sans-serif, system-ui, sans-serif',
    mono: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
  },
  radii: {
    card: "16px",
    control: "12px",
    icon: "10px",
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
        borderRadius: "12px",
        transition: "all 150ms ease",
      },
      variants: {
        solid: () => ({
          bg: "var(--gradient-primary)",
          color: "textOnAccent",
          _hover: {
            filter: "brightness(1.08)",
            boxShadow: "var(--shadow-accent)",
          },
          _active: {
            filter: "brightness(0.95)",
          },
        }),
        ghost: () => ({
          color: "textSecondary",
          _hover: {
            bg: "surfaceRaised",
            color: "textPrimary",
          },
        }),
        outline: () => ({
          borderColor: "borderSubtle",
          color: "textPrimary",
          bg: "transparent",
          _hover: {
            bg: "surfaceRaised",
            borderColor: "borderSubtle",
          },
        }),
      },
    },
    Input: {
      variants: {
        outline: () => ({
          field: {
            bg: "surfaceRaised",
            borderColor: "borderSubtle",
            borderRadius: "12px",
            color: "textPrimary",
            _placeholder: { color: "textMuted" },
            _hover: { borderColor: "borderSubtle" },
            _focusVisible: {
              borderColor: "accent",
              boxShadow: "0 0 0 1px var(--accent)",
            },
          },
        }),
      },
      defaultProps: {
        variant: "outline",
      },
    },
    Modal: {
      baseStyle: {
        dialog: {
          bg: "surface",
          borderColor: "borderSubtle",
          borderWidth: "1px",
          borderRadius: "16px",
          color: "textPrimary",
          boxShadow: "0 20px 48px rgba(0, 0, 0, 0.6)",
        },
        header: {
          color: "textPrimary",
          fontWeight: "600",
          fontSize: "lg",
        },
        overlay: {
          bg: "blackAlpha.800",
          backdropFilter: "blur(4px)",
        },
      },
    },
    Menu: {
      baseStyle: {
        list: {
          bg: "surface",
          borderColor: "borderSubtle",
          borderWidth: "1px",
          borderRadius: "12px",
          color: "textPrimary",
          boxShadow: "0 16px 36px rgba(0, 0, 0, 0.5)",
          p: 1,
        },
        item: {
          bg: "transparent",
          color: "textSecondary",
          borderRadius: "8px",
          fontSize: "sm",
          _hover: {
            bg: "surfaceRaised",
            color: "textPrimary",
          },
          _focus: {
            bg: "surfaceRaised",
            color: "textPrimary",
          },
        },
      },
    },
    Popover: {
      baseStyle: {
        content: {
          bg: "surface",
          borderColor: "borderSubtle",
          borderWidth: "1px",
          borderRadius: "12px",
          color: "textPrimary",
          boxShadow: "0 16px 36px rgba(0, 0, 0, 0.5)",
        },
      },
    },
    Tooltip: {
      baseStyle: {
        bg: "surfaceRaised",
        color: "textPrimary",
        borderColor: "borderSubtle",
        borderWidth: "1px",
        borderRadius: "8px",
        fontSize: "xs",
        px: 2,
        py: 1,
      },
    },
    Card: {
      baseStyle: {
        container: {
          bg: "surface",
          borderColor: "borderSubtle",
          borderWidth: "1px",
          borderRadius: "16px",
          color: "textPrimary",
        },
      },
    },
  },
  config: {
    initialColorMode: "dark",
    useSystemColorMode: false,
  },
});

export default theme;
