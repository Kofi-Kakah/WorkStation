import { useContext } from "react";
import AuthContext from "./AuthContext.jsx";

/**
 * Hook to access the auth state.
 * Kept in its own file so AuthContext.jsx only exports a single value,
 * satisfying the react-refresh/only-export-components rule.
 */
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export default useAuth;
