import { useEffect, useRef } from 'react';
import { useColorMode } from '@chakra-ui/react';

const THEME_STORAGE_KEY = 'unified-platform-theme';

/**
 * One shared theme state. Chakra's `useColorMode` is the single source of
 * truth for light/dark. This component:
 *  - applies the `dark` class to <html> so Tailwind's `dark` variant and our
 *    CSS custom-variant stay in sync,
 *  - persists the user's explicit choice to localStorage,
 *  - restores the stored choice on load to avoid a flash of the wrong theme.
 */
export function ThemeProvider({ children }) {
  const { colorMode, setColorMode } = useColorMode();
  const isFirstRender = useRef(true);

  // On mount, restore an explicit stored preference. Chakra already handles
  // system detection on first visit via ColorModeScript; this layer only
  // restores an explicit user choice made earlier.
  useEffect(() => {
    try {
      const stored = localStorage.getItem(THEME_STORAGE_KEY);
      if (stored === 'light' || stored === 'dark') {
        setColorMode(stored);
      }
    } catch {
      // localStorage may be unavailable (private mode); fall back to system.
    }
  }, [setColorMode]);

  // Keep <html> in sync with Chakra's color mode so Tailwind dark variant works.
  useEffect(() => {
    const root = document.documentElement;
    if (colorMode === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [colorMode]);

  // Persist explicit user choices (skip the very first render to avoid
  // writing the system-resolved value back before the restore effect runs).
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    try {
      localStorage.setItem(THEME_STORAGE_KEY, colorMode);
    } catch {
      // ignore
    }
  }, [colorMode]);

  return children;
}

export default ThemeProvider;