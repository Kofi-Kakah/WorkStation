import { ChakraProvider } from "@chakra-ui/react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import RegisterPage from "./RegisterPage.jsx";
import { api } from "../../services/apiClient.js";

const { createUserWithEmailAndPassword, updateProfile, navigate } = vi.hoisted(
  () => ({
    createUserWithEmailAndPassword: vi.fn(),
    updateProfile: vi.fn(),
    navigate: vi.fn(),
  }),
);

vi.mock("firebase/auth", () => ({
  createUserWithEmailAndPassword,
  updateProfile,
}));

vi.mock("../../lib/firebase.js", () => ({
  auth: {},
}));

vi.mock("../../services/apiClient.js", () => ({
  api: { post: vi.fn() },
}));

vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, useNavigate: () => navigate };
});

function renderRegisterPage() {
  return render(
    <ChakraProvider>
      <MemoryRouter>
        <RegisterPage />
      </MemoryRouter>
    </ChakraProvider>,
  );
}

describe("RegisterPage", () => {
  beforeEach(() => {
    createUserWithEmailAndPassword.mockResolvedValue({
      user: {
        displayName: "Avery Quinn",
        getIdToken: vi.fn().mockResolvedValue("firebase-id-token"),
      },
    });
    updateProfile.mockResolvedValue(undefined);
    api.post.mockResolvedValue({ ok: true });
  });

  it("blocks submission until the form is valid", async () => {
    renderRegisterPage();
    fireEvent.click(screen.getByRole("button", { name: "Create account" }));

    expect(
      await screen.findByText("Enter a name with at least 2 characters."),
    ).toBeVisible();
    expect(screen.getByText("Enter a valid email address.")).toBeVisible();
    expect(screen.getByText("Use at least 6 characters.")).toBeVisible();
    expect(createUserWithEmailAndPassword).not.toHaveBeenCalled();
  });

  it("creates the Firebase user and verifies the token before navigating", async () => {
    renderRegisterPage();
    fireEvent.change(screen.getByLabelText("Display name"), {
      target: { value: "  Avery Quinn " },
    });
    fireEvent.change(screen.getByLabelText("Email address"), {
      target: { value: "  avery@example.com " },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "correct-horse" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Create account" }));

    await waitFor(() => {
      expect(createUserWithEmailAndPassword).toHaveBeenCalledWith(
        {},
        "avery@example.com",
        "correct-horse",
      );
      expect(updateProfile).toHaveBeenCalledWith(expect.anything(), {
        displayName: "Avery Quinn",
      });
      expect(api.post).toHaveBeenCalledWith("/auth/verify", {
        idToken: "firebase-id-token",
      });
      expect(navigate).toHaveBeenCalledWith("/dashboard", { replace: true });
    });
  });
});
