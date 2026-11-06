import { ChakraProvider, useColorMode } from "@chakra-ui/react";
import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import ThemeProvider from "./ThemeProvider.jsx";

const LEGACY_STORAGE_KEY = "workstation-theme";

function ColorModeProbe() {
  const { colorMode } = useColorMode();
  return <span>{colorMode}</span>;
}

function renderTheme() {
  return render(
    <ChakraProvider>
      <ThemeProvider>
        <ColorModeProbe />
      </ThemeProvider>
    </ChakraProvider>,
  );
}

describe("ThemeProvider (dark-only)", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.className = "";
    document.documentElement.style.colorScheme = "";
  });

  it("applies the dark class and color scheme to the document", async () => {
    renderTheme();

    await waitFor(() => {
      expect(document.documentElement).toHaveClass("dark");
      expect(document.documentElement.style.colorScheme).toBe("dark");
    });
  });

  it("forces Chakra into dark mode", async () => {
    renderTheme();

    await waitFor(() => {
      expect(screen.getByText("dark")).toBeInTheDocument();
    });
  });

  it("overrides and clears a legacy light preference", async () => {
    localStorage.setItem(LEGACY_STORAGE_KEY, "light");
    renderTheme();

    await waitFor(() => {
      expect(document.documentElement).toHaveClass("dark");
      expect(document.documentElement.style.colorScheme).toBe("dark");
      expect(localStorage.getItem(LEGACY_STORAGE_KEY)).toBeNull();
    });
    expect(screen.getByText("dark")).toBeInTheDocument();
  });
});
