import { useEffect, useState } from "react";
import { onAuthStateChanged, signOut, getIdToken } from "firebase/auth";
import { auth } from "../lib/firebase.js";
import { api } from "../services/apiClient.js";
import AuthContext from "./AuthContext.jsx";

/**
 * AuthContext holds:
 *  - user: the Firebase Auth user (or null)
 *  - profile: the server-side user profile (fetched from /auth/me)
 *  - loading: true until the initial auth state is resolved
 *
 * Login/signup are handled by Firebase Auth directly on the frontend;
 * this provider only tracks state and syncs the profile.
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const syncProfile = async (firebaseUser) => {
    if (!firebaseUser) {
      setProfile(null);
      return;
    }
    try {
      const res = await api.get("/auth/me");
      setProfile(res.user || null);
    } catch (error) {
      // Token may be stale; the API call failing is not fatal.
      console.warn("Profile sync failed", error?.message);
      setProfile(null);
    }
  };

  useEffect(() => {
    let mounted = true;
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!mounted) return;
      setUser(firebaseUser);
      await syncProfile(firebaseUser);
      if (mounted) setLoading(false);
    });
    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  const logout = async () => {
    await signOut(auth);
    setUser(null);
    setProfile(null);
  };

  const value = {
    user,
    profile,
    loading,
    authenticated: !!user,
    logout,
    getIdToken: () => getIdToken(auth),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export default AuthProvider;
