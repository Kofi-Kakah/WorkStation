import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth as firebaseAuth } from "../../lib/firebase.js";
import { api } from "../../services/apiClient.js";
import PrimaryButton from "../../components/ui/PrimaryButton.jsx";
import GlassCard from "../../components/ui/GlassCard.jsx";

/**
 * Sign-in page.
 * Uses Firebase Auth directly on the frontend, then confirms the token
 * server-side via /auth/verify (which auto-creates the profile).
 *
 * @param {{ [key: string]: any }} props
 */
export function LoginPage({ ...props }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const cred = await signInWithEmailAndPassword(
        firebaseAuth,
        email,
        password,
      );
      const idToken = await cred.user.getIdToken();
      await api.post("/auth/verify", { idToken });
      // AuthProvider will pick up the new user via onAuthStateChanged.
    } catch (err) {
      setError(
        err?.code === "auth/invalid-credential"
          ? "Invalid email or password"
          : err?.message || "Sign in failed",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-bg-app dark:bg-bg-app-dark">
      <GlassCard className="w-full max-w-md p-6" {...props}>
        <div className="text-center mb-6">
          <div className="w-12 h-12 mx-auto rounded-xl bg-gradient-to-br from-amethyst-500 to-amethyst-700 flex items-center justify-center text-white font-bold text-xl">
            U
          </div>
          <h1 className="text-xl font-bold mt-3">Sign in to your workspace</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Welcome back
          </p>
        </div>

        <form onSubmit={onSubmit} className="flex flex-col gap-3">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className="w-full px-3 py-2 rounded-lg bg-white dark:bg-whiteAlpha-50 border border-blackAlpha-200 dark:border-whiteAlpha-100 text-sm focus:outline-none focus:ring-2 focus:ring-amethyst-400"
          />
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="w-full px-3 py-2 rounded-lg bg-white dark:bg-whiteAlpha-50 border border-blackAlpha-200 dark:border-whiteAlpha-100 text-sm focus:outline-none focus:ring-2 focus:ring-amethyst-400"
          />
          {error && <p className="text-sm text-red-500">{error}</p>}
          <PrimaryButton type="submit" isLoading={loading}>
            Sign in
          </PrimaryButton>
        </form>

        <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-4">
          Don't have an account?{" "}
          <a href="/register" className="text-amethyst-600 hover:underline">
            Create one
          </a>
        </p>
      </GlassCard>
    </div>
  );
}

export default LoginPage;
