import { describe, expect, it } from "vitest";
import { isOriginAllowed } from "./cors.js";

describe("CORS origin policy", () => {
  it("allows only configured origins in production", () => {
    expect(
      isOriginAllowed("https://app.example.com", ["https://app.example.com"], "production"),
    ).toBe(true);
    expect(
      isOriginAllowed("https://attacker.example", ["https://app.example.com"], "production"),
    ).toBe(false);
    expect(isOriginAllowed("https://app.example.com", [], "production")).toBe(false);
  });

  it("allows requests without an Origin header and development origins", () => {
    expect(isOriginAllowed(undefined, [], "production")).toBe(true);
    expect(isOriginAllowed("http://localhost:5173", [], "development")).toBe(true);
  });
});
