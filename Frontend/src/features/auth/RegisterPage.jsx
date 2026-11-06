import { useRef, useState } from "react";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { Eye, EyeOff, LockKeyhole, Mail, UserRound } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { auth as firebaseAuth } from "../../lib/firebase.js";
import { api } from "../../services/apiClient.js";
import { Button } from "../../components/ui/Button.jsx";
import { AuthLayout } from "../../layouts/AuthLayout.jsx";

/**
 * Registration page.
 * Creates the Firebase Auth user, then confirms the token server-side
 * (which auto-creates the Firestore profile via /auth/verify).
 */
export function RegisterPage() {
  const navigate = useNavigate();
  const submitting = useRef(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (submitting.current) return;

    const trimmedName = displayName.trim();
    const trimmedEmail = email.trim();
    const nextFieldErrors = {};

    if (trimmedName.length < 2) {
      nextFieldErrors.displayName = "Enter a name with at least 2 characters.";
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      nextFieldErrors.email = "Enter a valid email address.";
    }
    if (password.length < 6) {
      nextFieldErrors.password = "Use at least 6 characters.";
    }
    setFieldErrors(nextFieldErrors);
    if (Object.keys(nextFieldErrors).length > 0) return;

    submitting.current = true;
    setLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(
        firebaseAuth,
        trimmedEmail,
        password,
      );
      if (trimmedName) {
        await updateProfile(cred.user, { displayName: trimmedName });
      }
      const idToken = await cred.user.getIdToken();
      await api.post("/auth/verify", { idToken });
      navigate("/dashboard", { replace: true });
    } catch (err) {
      const messages = {
        "auth/email-already-in-use":
          "An account with this email already exists. Try signing in instead.",
        "auth/invalid-email": "Enter a valid email address.",
        "auth/weak-password": "Choose a stronger password with at least 6 characters.",
        "auth/network-request-failed":
          "Unable to connect. Check your internet connection and try again.",
        "auth/too-many-requests":
          "Too many attempts. Wait a moment and try again.",
      };
      setError(
        messages[err?.code] ||
          err?.message ||
          "We couldn't create your account. Please try again.",
      );
    } finally {
      submitting.current = false;
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <header className="mb-7 text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-primary">
            Create your account
          </h1>
          <p className="mt-2 text-sm text-secondary">
            Get started in seconds.
          </p>
        </header>

        <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
          <div>
            <label
              htmlFor="display-name"
              className="mb-2 block text-sm font-medium text-primary"
            >
              Display name
            </label>
            <div className="relative">
              <UserRound
                aria-hidden="true"
                size={18}
                className="auth-input-icon pointer-events-none absolute left-3 top-1/2 -translate-y-1/2"
              />
              <input
                id="display-name"
                name="displayName"
                type="text"
                autoComplete="name"
                required
                minLength={2}
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your name"
                aria-invalid={Boolean(fieldErrors.displayName)}
                aria-describedby={
                  fieldErrors.displayName ? "display-name-error" : undefined
                }
                className="auth-input auth-input--leading"
              />
            </div>
            {fieldErrors.displayName && (
              <p
                id="display-name-error"
                className="mt-1.5 text-xs text-danger"
              >
                {fieldErrors.displayName}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="email"
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
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                aria-invalid={Boolean(fieldErrors.email)}
                aria-describedby={fieldErrors.email ? "email-error" : undefined}
                className="auth-input auth-input--leading"
              />
            </div>
            {fieldErrors.email && (
              <p
                id="email-error"
                className="mt-1.5 text-xs text-danger"
              >
                {fieldErrors.email}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-2 block text-sm font-medium text-primary"
            >
              Password
            </label>
            <div className="relative">
              <LockKeyhole
                aria-hidden="true"
                size={18}
                className="auth-input-icon pointer-events-none absolute left-3 top-1/2 -translate-y-1/2"
              />
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                aria-invalid={Boolean(fieldErrors.password)}
                aria-describedby={
                  fieldErrors.password ? "password-error" : "password-hint"
                }
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
            {fieldErrors.password ? (
              <p
                id="password-error"
                className="mt-1.5 text-xs text-danger"
              >
                {fieldErrors.password}
              </p>
            ) : (
              <p
                id="password-hint"
                className="mt-1.5 text-xs text-secondary"
              >
                Use at least 6 characters.
              </p>
            )}
          </div>

          {error && (
            <p
              role="alert"
              className="rounded-control border border-danger/20 bg-danger/10 px-3 py-2.5 text-sm text-danger"
            >
              {error}
            </p>
          )}

          <Button
            variant="primary"
            type="submit"
            isLoading={loading}
            isDisabled={loading}
            loadingText="Creating account..."
            className="mt-1 h-12 w-full rounded-control"
          >
            Create account
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-secondary">
          Already have an account?{" "}
          <Link
            to="/login"
            className="auth-link font-semibold"
          >
            Sign in
          </Link>
        </p>
    </AuthLayout>
  );
}

export default RegisterPage;
