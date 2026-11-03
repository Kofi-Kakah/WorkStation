import { useEffect } from "react";
import { useColorMode } from "@chakra-ui/react";

const THEME_STORAGE_KEY = "workstation-theme";

export function ThemeProvider({ children }) {
  const { colorMode, setColorMode } = useColorMode();

  useEffect(() => {
    const root = document.documentElement;
    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
    const preferredTheme =
      savedTheme ||
      (window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light");

    root.classList.toggle("dark", preferredTheme === "dark");
    root.style.colorScheme = preferredTheme;

    if (colorMode !== preferredTheme) {
      setColorMode(preferredTheme);
    }
  }, [colorMode, setColorMode]);

  useEffect(() => {
    const root = document.documentElement;
    const nextTheme = colorMode || "light";

    root.classList.toggle("dark", nextTheme === "dark");
    root.style.colorScheme = nextTheme;
    localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
  }, [colorMode]);

  return children;
}

export default ThemeProvider;
