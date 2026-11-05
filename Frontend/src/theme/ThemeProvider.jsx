import { useEffect, useRef } from "react";
import { useColorMode } from "@chakra-ui/react";

const THEME_STORAGE_KEY = "workstation-theme";

function readPreferredTheme() {
  const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
  if (savedTheme === "dark" || savedTheme === "light") return savedTheme;
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function applyTheme(theme) {
  const root = document.documentElement;
  root.classList.toggle("dark", theme === "dark");
  root.style.colorScheme = theme;
  localStorage.setItem(THEME_STORAGE_KEY, theme);
}

export function ThemeProvider({ children }) {
  const { colorMode, setColorMode } = useColorMode();
  const initializedRef = useRef(false);

  // Resolve the stored/system preference once, then persist actual colorMode
  // changes. Re-resolving on every change would fight user toggles.
  useEffect(() => {
    if (!initializedRef.current) {
      initializedRef.current = true;
      const preferredTheme = readPreferredTheme();
      if (colorMode !== preferredTheme) setColorMode(preferredTheme);
      applyTheme(preferredTheme);
      return;
    }
    applyTheme(colorMode);
  }, [colorMode, setColorMode]);

  return children;
}

export default ThemeProvider;
