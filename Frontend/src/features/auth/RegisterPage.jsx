import { useState } from "react";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { auth as firebaseAuth } from "../../lib/firebase.js";
import { api } from "../../services/apiClient.js";
import PrimaryButton from "../../components/ui/PrimaryButton.jsx";
import GlassCard from "../../components/ui/GlassCard.jsx";

/**
 * Registration page.
 * Creates the Firebase Auth user, then confirms the token server-side
 * (which auto-creates the Firestore profile via /auth/verify).
 */
export function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(firebaseAuth, email, password);
      if (displayName) {
        await updateProfile(cred.user, { displayName });
      }
      const idToken = await cred.user.getIdToken();
      await api.post("/auth/verify", { idToken });
    } catch (err) {
      if (err?.code === "auth/email-already-in-use") {
        setError("Email already in use");
      } else if (err?.code === "auth/weak-password") {
        setError("Password is too weak");
      } else {
        setError(err?.message || "Sign up failed");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-bg-app dark:bg-bg-app-dark">
      <GlassCard className="w-full max-w-md p-6">
        <div className="text-center mb-6">
          <div className="w-12 h-12 mx-auto rounded-xl bg-gradient-to-br from-amethyst-500 to-amethyst-700 flex items-center justify-center text-white font-bold text-xl">U</div>
          <h1 className="text-xl font-bold mt-3">Create your account</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Get started in seconds</p>
        </div>

        <form onSubmit={onSubmit} className="flex flex-col gap-3">
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Display name"
            className="w-full px-3 py-2 rounded-lg bg-white dark:bg-whiteAlpha-50 border border-blackAlpha-200 dark:border-whiteAlpha-100 text-sm focus:outline-none focus:ring-2 focus:ring-amethyst-400"
          />
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
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password (min 6 characters)"
            className="w-full px-3 py-2 rounded-lg bg-white dark:bg-whiteAlpha-50 border border-blackAlpha-200 dark:border-whiteAlpha-100 text-sm focus:outline-none focus:ring-2 focus:ring-amethyst-400"
          />
          {error && <p className="text-sm text-red-500">{error}</p>}
          <PrimaryButton type="submit" isLoading={loading}>Create account</PrimaryButton>
        </form>

        <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-4">
          Already have an account?{" "}
          <a href="/login" className="text-amethyst-600 hover:underline">Sign in</a>
        </p>
      </GlassCard>
    </div>
  );
}

export default RegisterPage;
