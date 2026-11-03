import { ChakraProvider } from "@chakra-ui/react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import LoginPage from "./LoginPage.jsx";
import { api } from "../../services/apiClient.js";

const { signInWithEmailAndPassword, sendPasswordResetEmail, navigate } =
  vi.hoisted(() => ({
    signInWithEmailAndPassword: vi.fn(),
    sendPasswordResetEmail: vi.fn(),
    navigate: vi.fn(),
  }));

vi.mock("firebase/auth", () => ({
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
}));

vi.mock("../../lib/firebase.js", () => ({
  auth: {},
}));

vi.mock("../../services/apiClient.js", () => ({
  api: { post: vi.fn() },
}));

vi.mock("../../contexts/useAuth.jsx", () => ({
  useAuth: () => ({ authenticated: false, loading: false }),
}));

vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, useNavigate: () => navigate };
});

function renderLoginPage() {
  return render(
    <ChakraProvider>
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    </ChakraProvider>,
  );
}

describe("LoginPage", () => {
  beforeEach(() => {
    signInWithEmailAndPassword.mockResolvedValue({
      user: { getIdToken: vi.fn().mockResolvedValue("firebase-id-token") },
    });
    sendPasswordResetEmail.mockResolvedValue(undefined);
    api.post.mockResolvedValue({ ok: true });
  });

  it("validates the email before attempting Firebase sign-in", async () => {
    renderLoginPage();
    fireEvent.change(screen.getByLabelText("Email address"), {
      target: { value: "invalid" },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "correct-horse" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Sign in" }));

    expect(await screen.findByText("Enter a valid email address.")).toBeVisible();
    expect(signInWithEmailAndPassword).not.toHaveBeenCalled();
  });

  it("verifies the Firebase ID token with the API and navigates after sign-in", async () => {
    renderLoginPage();
    fireEvent.change(screen.getByLabelText("Email address"), {
      target: { value: "  user@example.com " },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "correct-horse" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Sign in" }));

    await waitFor(() => {
      expect(signInWithEmailAndPassword).toHaveBeenCalledWith(
        {},
        "user@example.com",
        "correct-horse",
      );
      expect(api.post).toHaveBeenCalledWith("/auth/verify", {
        idToken: "firebase-id-token",
      });
      expect(navigate).toHaveBeenCalledWith("/dashboard", { replace: true });
    });
  });

  it("shows a sign-in error when Firebase rejects the credentials", async () => {
    signInWithEmailAndPassword.mockRejectedValue({
      code: "auth/invalid-credential",
    });
    renderLoginPage();
    fireEvent.change(screen.getByLabelText("Email address"), {
      target: { value: "user@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "wrong-password" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Sign in" }));

    expect(
      await screen.findByRole("alert"),
    ).toHaveTextContent("The email or password you entered is incorrect.");
    expect(api.post).not.toHaveBeenCalled();
  });

  it("uses a generic message for password-reset requests", async () => {
    sendPasswordResetEmail.mockRejectedValue({ code: "auth/user-not-found" });
    renderLoginPage();
    fireEvent.click(screen.getByRole("button", { name: "Forgot password?" }));
    fireEvent.change(screen.getByLabelText("Email address"), {
      target: { value: "user@example.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Send reset link" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "We couldn't send a reset email. Please try again.",
    );
    expect(sendPasswordResetEmail).toHaveBeenCalledTimes(1);
  });
});
