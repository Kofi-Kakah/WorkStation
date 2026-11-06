import { useRef, useState } from "react";
import {
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { Eye, EyeOff, LockKeyhole, Mail } from "lucide-react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { auth as firebaseAuth } from "../../lib/firebase.js";
import { api } from "../../services/apiClient.js";
import { useAuth } from "../../contexts/useAuth.jsx";
import { Button } from "../../components/ui/Button.jsx";
import { AuthLayout } from "../../layouts/AuthLayout.jsx";

const AUTH_ERRORS = {
  "auth/invalid-credential": "The email or password you entered is incorrect.",
  "auth/invalid-email": "Enter a valid email address.",
  "auth/user-disabled": "This account has been disabled. Contact your workspace administrator.",
  "auth/too-many-requests": "Too many attempts. Wait a moment and try again.",
  "auth/network-request-failed":
    "Unable to connect. Check your internet connection and try again.",
};

/**
 * Firebase sign-in and password-reset screen.
 */
export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { authenticated, loading: authLoading } = useAuth();
  const submitting = useRef(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [emailError, setEmailError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [resetMode, setResetMode] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const redirectTo = location.state?.from?.pathname || "/dashboard";
  if (!authLoading && authenticated) {
    return <Navigate to={redirectTo} replace />;
  }

  const onSubmit = async (event) => {
    event.preventDefault();
    setError(null);
    setEmailError(null);

    if (submitting.current) return;

    const normalizedEmail = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setEmailError("Enter a valid email address.");
      return;
    }

    if (!resetMode && !password) {
      setError("Enter your password to sign in.");
      return;
    }

    submitting.current = true;
    setLoading(true);
    try {
      if (resetMode) {
        await sendPasswordResetEmail(firebaseAuth, normalizedEmail);
        setResetSent(true);
        return;
      }

      const credential = await signInWithEmailAndPassword(
        firebaseAuth,
        normalizedEmail,
        password,
      );
      const idToken = await credential.user.getIdToken();
      await api.post("/auth/verify", { idToken });
      navigate(redirectTo, { replace: true });
    } catch (authError) {
      if (resetMode) {
        setError(
          AUTH_ERRORS[authError?.code] ||
            "We couldn't send a reset email. Please try again.",
        );
      } else {
        setError(
          AUTH_ERRORS[authError?.code] ||
            authError?.message ||
            "We couldn't sign you in. Please try again.",
        );
      }
    } finally {
      submitting.current = false;
      setLoading(false);
    }
  };

  const changeMode = (nextMode) => {
    setResetMode(nextMode);
    setResetSent(false);
    setError(null);
    setEmailError(null);
  };

  return (
    <AuthLayout>
      <header className="mb-7 text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-primary">
            {resetMode ? "Reset your password" : "Sign in to your workspace"}
          </h1>
          <p className="mt-2 text-sm text-secondary">
            {resetMode
              ? "We’ll email you a link to choose a new password."
              : "Welcome back. Let’s get you back to work."}
          </p>
        </header>

        {resetSent ? (
          <div
            role="status"
            className="rounded-control border border-success/20 bg-success/10 px-4 py-4 text-center text-sm text-success"
          >
            If an account exists for <strong>{email.trim()}</strong>, we’ve sent
            a password reset link.
          </div>
        ) : (
          <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
            <div>
              <label
                htmlFor="login-email"
                className="mb-2 block text-sm font-medium text-primary"
              >
                Email address
              </label>
              <div className="relative">
                <Mail
                  aria-hidden="true"
                  size={18}
                  className="auth-input-icon pointer-events-none absolute left-3 top-1/2 -translate-y-1/2"
                />
                <input
                  id="login-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@example.com"
                  aria-invalid={Boolean(emailError)}
                  aria-describedby={emailError ? "login-email-error" : undefined}
                  className="auth-input auth-input--leading"
                />
              </div>
              {emailError && (
                <p
                  id="login-email-error"
                  className="mt-1.5 text-xs text-danger"
                >
                  {emailError}
                </p>
              )}
            </div>

            {!resetMode && (
              <div>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <label
                    htmlFor="login-password"
                    className="block text-sm font-medium text-primary"
                  >
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => changeMode(true)}
                    className="auth-link text-xs font-medium"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <LockKeyhole
                    aria-hidden="true"
                    size={18}
                    className="auth-input-icon pointer-events-none absolute left-3 top-1/2 -translate-y-1/2"
                  />
                  <input
                    id="login-password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Your password"
                    className="auth-input auth-input--leading auth-input--trailing"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((visible) => !visible)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    aria-pressed={showPassword}
                    className="auth-password-toggle absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                  >
                    {showPassword ? (
                      <EyeOff aria-hidden="true" size={18} />
                    ) : (
                      <Eye aria-hidden="true" size={18} />
                    )}
                  </button>
                </div>
              </div>
            )}

            {error && (
              <p
                role="alert"
                className="rounded-control border border-danger/20 bg-danger/10 px-3 py-2.5 text-sm text-danger"
              >
                {error}
              </p>
            )}

            <Button
              type="submit"
              isLoading={loading}
              isDisabled={loading}
              loadingText={
                resetMode ? "Sending reset link..." : "Signing in..."
              }
              variant="primary"
              className="h-12 w-full rounded-control"
            >
              {resetMode ? "Send reset link" : "Sign in"}
            </Button>

            {resetMode && (
              <button
                type="button"
                onClick={() => changeMode(false)}
                className="auth-link text-sm font-medium"
              >
                Back to sign in
              </button>
            )}
          </form>
        )}

        {!resetMode && (
          <p className="mt-6 text-center text-sm text-secondary">
            Don’t have an account?{" "}
            <Link
              to="/register"
              className="auth-link font-semibold"
            >
              Create one
            </Link>
          </p>
        )}
    </AuthLayout>
  );
}

export default LoginPage;
