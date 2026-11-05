import { ChakraProvider, useColorMode } from "@chakra-ui/react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import ThemeProvider from "./ThemeProvider.jsx";

const STORAGE_KEY = "workstation-theme";

function ThemeToggle() {
  const { colorMode, toggleColorMode } = useColorMode();
  return (
    <button type="button" onClick={toggleColorMode}>
      {colorMode}
    </button>
  );
}

function renderTheme() {
  return render(
    <ChakraProvider>
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>
    </ChakraProvider>,
  );
}

describe("ThemeProvider", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.className = "";
    document.documentElement.style.colorScheme = "";
    window.__prefersDark = false;
  });

  it("restores a persisted dark preference and applies it to the document", async () => {
    localStorage.setItem(STORAGE_KEY, "dark");
    renderTheme();

    await waitFor(() => {
      expect(document.documentElement).toHaveClass("dark");
      expect(document.documentElement.style.colorScheme).toBe("dark");
      expect(localStorage.getItem(STORAGE_KEY)).toBe("dark");
    });
    expect(screen.getByRole("button", { name: "dark" })).toBeVisible();
  });

  it("persists the opposite theme when the user toggles the color mode", async () => {
    localStorage.setItem(STORAGE_KEY, "light");
    renderTheme();

    await waitFor(() => {
      expect(document.documentElement).not.toHaveClass("dark");
      expect(localStorage.getItem(STORAGE_KEY)).toBe("light");
    });

    fireEvent.click(screen.getByRole("button", { name: "light" }));

    await waitFor(() => {
      expect(document.documentElement).toHaveClass("dark");
      expect(document.documentElement.style.colorScheme).toBe("dark");
      expect(localStorage.getItem(STORAGE_KEY)).toBe("dark");
    });

    fireEvent.click(screen.getByRole("button", { name: "dark" }));

    await waitFor(() => {
      expect(document.documentElement).not.toHaveClass("dark");
      expect(localStorage.getItem(STORAGE_KEY)).toBe("light");
    });
  });

  it("follows the system preference on a first visit without saved settings", async () => {
    window.__prefersDark = true;
    renderTheme();

    await waitFor(() => {
      expect(document.documentElement).toHaveClass("dark");
      expect(localStorage.getItem(STORAGE_KEY)).toBe("dark");
    });
  });

  it("keeps light mode when neither storage nor the system requests dark", async () => {
    renderTheme();

    await waitFor(() => {
      expect(document.documentElement).not.toHaveClass("dark");
      expect(document.documentElement.style.colorScheme).toBe("light");
      expect(localStorage.getItem(STORAGE_KEY)).toBe("light");
    });
  });
});
