import { extendTheme } from "@chakra-ui/react";

const colors = {
  amethyst: {
    50: "#ffffff",
    100: "#f7ecff",
    200: "#efdaff",
    300: "#e5c7ff",
    400: "#dbb3ff",
    500: "#ce97ff",
    600: "#bd79ff",
    700: "#9660ce",
    800: "#694192",
    900: "#392053",
    950: "#261437",
  },
  semantic: {
    success: "#22c55e",
    warning: "#f59e0b",
    error: "#ef4444",
    info: "#3b82f6",
  },
};

const theme = extendTheme({
  colors,
  fonts: {
    body: 'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    heading:
      'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    mono: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
  },
  styles: {
    global: (props) => ({
      body: {
        bg: props.colorMode === "dark" ? "#1a1026" : "#f7ecff",
        color: props.colorMode === "dark" ? "#f5f0ff" : "#1f1a2e",
        minHeight: "100vh",
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
          bg: "amethyst.600",
          color: "white",
          _hover: { bg: "amethyst.700" },
          _active: { bg: "amethyst.800" },
        }),
        ghost: (props) => ({
          color: props.colorMode === "dark" ? "amethyst.300" : "amethyst.700",
          _hover: {
            bg: props.colorMode === "dark" ? "whiteAlpha.100" : "amethyst.100",
          },
        }),
      },
    },
  },
  config: {
    initialColorMode: "system",
    useSystemColorMode: true,
  },
});

export default theme;
