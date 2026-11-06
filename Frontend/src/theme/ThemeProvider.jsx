import { useEffect } from "react";
import { useColorMode } from "@chakra-ui/react";

const LEGACY_THEME_STORAGE_KEY = "workstation-theme";

/**
 * Emberline is dark-only. Pin Chakra and the document to dark mode so a
 * stored or system preference cannot revert the palette.
 */
export function ThemeProvider({ children }) {
  const { colorMode, setColorMode } = useColorMode();

  useEffect(() => {
    const root = document.documentElement;
    root.classList.add("dark");
    root.style.colorScheme = "dark";
    if (colorMode !== "dark") setColorMode("dark");
    localStorage.removeItem(LEGACY_THEME_STORAGE_KEY);
  }, [colorMode, setColorMode]);

  return children;
}

export default ThemeProvider;
