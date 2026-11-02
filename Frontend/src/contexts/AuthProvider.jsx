import { useCallback, useEffect, useState } from "react";
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
  const [profileError, setProfileError] = useState(null);
  const [workspaces, setWorkspaces] = useState([]);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState(null);
  const [workspaceError, setWorkspaceError] = useState(null);
  const [workspaceLoading, setWorkspaceLoading] = useState(false);
  const [loading, setLoading] = useState(true);

  const refreshProfile = useCallback(async () => {
    if (!auth.currentUser) return null;
    const uid = auth.currentUser.uid;
    try {
      const res = await api.get("/auth/me");
      if (auth.currentUser?.uid !== uid) return null;
      const nextProfile = res.user?.profile || res.user || null;
      setProfileError(null);
      setProfile(nextProfile);
      return nextProfile;
    } catch (error) {
      if (auth.currentUser?.uid !== uid) throw error;
      setProfileError(error.message || "Unable to load your profile.");
      throw error;
    }
  }, []);

  const refreshWorkspaces = useCallback(async (preferredWorkspaceId) => {
    if (!auth.currentUser) return [];
    const uid = auth.currentUser.uid;
    setWorkspaceLoading(true);
    setWorkspaceError(null);
    try {
      const response = await api.get("/workspaces");
      if (auth.currentUser?.uid !== uid) return [];
      const nextWorkspaces = response.workspaces || [];
      const storedWorkspaceId = window.localStorage.getItem(
        `workstation.activeWorkspace.${uid}`,
      );
      const selection = preferredWorkspaceId || storedWorkspaceId;
      const selectedWorkspace = nextWorkspaces.some(
        (workspace) => workspace.id === selection,
      )
        ? selection
        : nextWorkspaces[0]?.id || null;

      setWorkspaces(nextWorkspaces);
      setActiveWorkspaceId(selectedWorkspace);
      if (selectedWorkspace) {
        window.localStorage.setItem(
          `workstation.activeWorkspace.${uid}`,
          selectedWorkspace,
        );
      } else {
        window.localStorage.removeItem(
          `workstation.activeWorkspace.${uid}`,
        );
      }
      return nextWorkspaces;
    } catch (error) {
      if (auth.currentUser?.uid !== uid) throw error;
      setWorkspaceError(error.message || "Unable to load your workspaces.");
      throw error;
    } finally {
      if (auth.currentUser?.uid === uid) setWorkspaceLoading(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    let authSequence = 0;
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!mounted) return;
      const currentSequence = ++authSequence;
      setUser(firebaseUser);
      if (!firebaseUser) {
        setProfile(null);
        setProfileError(null);
        setWorkspaces([]);
        setActiveWorkspaceId(null);
        setWorkspaceError(null);
        setWorkspaceLoading(false);
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        await refreshProfile();
      } catch {
        // The visible profile error is exposed through AuthContext.
      }
      if (!mounted || currentSequence !== authSequence) return;
      try {
        await refreshWorkspaces();
      } catch {
        // The visible workspace error is exposed through AuthContext.
      }
      if (mounted && currentSequence === authSequence) setLoading(false);
    });
    return () => {
      mounted = false;
      unsubscribe();
    };
  }, [refreshProfile, refreshWorkspaces]);

  const logout = useCallback(async () => {
    await signOut(auth);
    setUser(null);
    setProfile(null);
    setProfileError(null);
    setWorkspaces([]);
    setActiveWorkspaceId(null);
    setWorkspaceError(null);
    setWorkspaceLoading(false);
  }, []);

  const selectWorkspace = useCallback((workspaceId) => {
    if (!workspaces.some((workspace) => workspace.id === workspaceId)) {
      throw new Error("Select a workspace you belong to.");
    }
    setActiveWorkspaceId(workspaceId);
    if (user) {
      window.localStorage.setItem(
        `workstation.activeWorkspace.${user.uid}`,
        workspaceId,
      );
    }
  }, [user, workspaces]);

  const createWorkspace = useCallback(async (input) => {
    const response = await api.post("/workspaces", input);
    await refreshWorkspaces(response.workspace.id);
    return response.workspace;
  }, [refreshWorkspaces]);

  const value = {
    user,
    profile,
    profileError,
    loading,
    authenticated: !!user,
    workspaces,
    activeWorkspace:
      workspaces.find((workspace) => workspace.id === activeWorkspaceId) || null,
    activeWorkspaceId,
    workspaceError,
    workspaceLoading,
    refreshProfile,
    refreshWorkspaces,
    selectWorkspace,
    createWorkspace,
    logout,
    getIdToken: () => getIdToken(auth),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export default AuthProvider;
