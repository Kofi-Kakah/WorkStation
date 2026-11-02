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
import PrimaryButton from "../../components/ui/PrimaryButton.jsx";
import GlassCard from "../../components/ui/GlassCard.jsx";

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
    <div
      role="main"
      className="flex min-h-screen min-h-[100svh] items-center justify-center overflow-x-hidden bg-gradient-to-br from-amethyst-100 via-white to-amethyst-200 px-4 py-8 text-text-primary dark:from-[#1a1026] dark:via-[#261437] dark:to-[#392053] dark:text-white sm:px-6"
    >
      <GlassCard className="w-full max-w-md p-6 sm:p-8">
        <header className="mb-7 text-center">
          <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-amethyst-500 to-amethyst-700 text-xl font-bold text-white shadow-sm">
            U
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-text-primary dark:text-white">
            {resetMode ? "Reset your password" : "Sign in to your workspace"}
          </h1>
          <p className="mt-2 text-sm text-text-secondary dark:text-text-secondary-dark">
            {resetMode
              ? "We’ll email you a link to choose a new password."
              : "Welcome back. Let’s get you back to work."}
          </p>
        </header>

        {resetSent ? (
          <div
            role="status"
            className="rounded-xl border border-green-500/20 bg-green-500/10 px-4 py-4 text-center text-sm text-green-800 dark:text-green-200"
          >
            If an account exists for <strong>{email.trim()}</strong>, we’ve sent
            a password reset link.
          </div>
        ) : (
          <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
            <div>
              <label
                htmlFor="login-email"
                className="mb-2 block text-sm font-medium text-text-primary dark:text-white/90"
              >
                Email address
              </label>
              <div className="relative">
                <Mail
                  aria-hidden="true"
                  size={18}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  id="login-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  style={{ paddingLeft: "2.5rem" }}
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@example.com"
                  aria-invalid={Boolean(emailError)}
                  aria-describedby={emailError ? "login-email-error" : undefined}
                  className={`h-12 w-full rounded-xl border bg-white/75 py-3 pl-10 pr-3 text-sm text-text-primary outline-none transition placeholder:text-gray-400 hover:border-amethyst-300 focus:border-amethyst-500 focus:ring-2 focus:ring-amethyst-500/25 dark:bg-[#1a1026]/35 dark:text-white dark:placeholder:text-white/40 ${
                    emailError
                      ? "border-red-500 dark:border-red-400"
                      : "border-black/10 dark:border-white/10"
                  }`}
                />
              </div>
              {emailError && (
                <p
                  id="login-email-error"
                  className="mt-1.5 text-xs text-red-600 dark:text-red-300"
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
                    className="block text-sm font-medium text-text-primary dark:text-white/90"
                  >
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => changeMode(true)}
                    className="text-xs font-medium text-amethyst-700 hover:text-amethyst-800 hover:underline dark:text-amethyst-300 dark:hover:text-amethyst-200"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <LockKeyhole
                    aria-hidden="true"
                    size={18}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                  <input
                    id="login-password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    required
                    style={{ paddingLeft: "2.5rem", paddingRight: "3rem" }}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Your password"
                    className="h-12 w-full rounded-xl border border-black/10 bg-white/75 py-3 pl-10 pr-12 text-sm text-text-primary outline-none transition placeholder:text-gray-400 hover:border-amethyst-300 focus:border-amethyst-500 focus:ring-2 focus:ring-amethyst-500/25 dark:border-white/10 dark:bg-[#1a1026]/35 dark:text-white dark:placeholder:text-white/40"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((visible) => !visible)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    aria-pressed={showPassword}
                    className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-gray-500 transition hover:bg-black/5 hover:text-amethyst-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amethyst-500 dark:text-white/60 dark:hover:bg-white/10 dark:hover:text-amethyst-300"
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
                className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2.5 text-sm text-red-700 dark:text-red-200"
              >
                {error}
              </p>
            )}

            <PrimaryButton
              type="submit"
              isLoading={loading}
              isDisabled={loading}
              loadingText={
                resetMode ? "Sending reset link..." : "Signing in..."
              }
              className="h-12 w-full rounded-xl"
            >
              {resetMode ? "Send reset link" : "Sign in"}
            </PrimaryButton>

            {resetMode && (
              <button
                type="button"
                onClick={() => changeMode(false)}
                className="text-sm font-medium text-amethyst-700 hover:text-amethyst-800 hover:underline dark:text-amethyst-300 dark:hover:text-amethyst-200"
              >
                Back to sign in
              </button>
            )}
          </form>
        )}

        {!resetMode && (
          <p className="mt-6 text-center text-sm text-text-secondary dark:text-text-secondary-dark">
            Don’t have an account?{" "}
            <Link
              to="/register"
              className="font-semibold text-amethyst-700 hover:text-amethyst-800 hover:underline dark:text-amethyst-300 dark:hover:text-amethyst-200"
            >
              Create one
            </Link>
          </p>
        )}
      </GlassCard>
    </div>
  );
}

export default LoginPage;
