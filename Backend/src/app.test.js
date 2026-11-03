import { describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "./app.js";

describe("API routing and authentication hardening", () => {
  const app = createApp();

  it("mounts APIs under the versioned prefix and keeps health unversioned", async () => {
    const health = await request(app).get("/api/health");
    const versionedWorkspace = await request(app).get("/api/v1/workspaces");
    const oldAuthPath = await request(app).post("/api/auth/login");

    expect(health.status).toBe(200);
    expect(versionedWorkspace.status).toBe(401);
    expect(oldAuthPath.status).toBe(404);
  });

  it("does not expose account details through the legacy login endpoint", async () => {
    const response = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: "someone@example.com", password: "not-a-password" });

    expect(response.status).toBe(410);
    expect(response.body).toEqual({
      error: "Sign in using Firebase Authentication",
      code: "FIREBASE_AUTH_REQUIRED",
    });
  });
});
