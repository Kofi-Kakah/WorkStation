import { useEffect } from "react";
import { useColorMode } from "@chakra-ui/react";

/**
 * The Emberline MVP uses one dark appearance across Chakra and Tailwind.
 */
export function ThemeProvider({ children }) {
  const { colorMode, setColorMode } = useColorMode();

  useEffect(() => {
    const root = document.documentElement;
    root.classList.add("dark");
    if (colorMode !== "dark") setColorMode("dark");
  }, [colorMode, setColorMode]);

  return children;
}

export default ThemeProvider;
