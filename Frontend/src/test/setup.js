import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

function evaluateMediaQuery(query, width) {
  if (query.includes("prefers-color-scheme: dark")) {
    return Boolean(window.__prefersDark);
  }
  if (query.includes("prefers-color-scheme: light")) {
    return !window.__prefersDark;
  }
  const min = /min-width:\s*([\d.]+)em/.exec(query);
  const max = /max-width:\s*([\d.]+)em/.exec(query);
  let matches = true;
  if (min) matches = matches && width >= Number(min[1]) * 16;
  if (max) matches = matches && width <= Number(max[1]) * 16;
  return matches;
}

window.__prefersDark = false;

window.matchMedia = vi.fn().mockImplementation((query) => ({
  matches: evaluateMediaQuery(query, window.innerWidth),
  media: query,
  onchange: null,
  addListener: vi.fn(),
  removeListener: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn(),
}));

// jsdom does not implement smooth scrolling APIs used by menu/palette widgets.
if (!Element.prototype.scrollTo) {
  Element.prototype.scrollTo = () => {};
}
if (!Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = () => {};
}

if (!globalThis.ResizeObserver) {
  globalThis.ResizeObserver = class ResizeObserver {
    observe() {}

    unobserve() {}

    disconnect() {}
  };
}

if (!Element.prototype.scrollTo) {
  Element.prototype.scrollTo = vi.fn();
}

if (!window.scrollTo) {
  window.scrollTo = vi.fn();
}

afterEach(() => {
  cleanup();
});
