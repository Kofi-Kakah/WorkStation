import { useCallback, useMemo, useState } from "react";
import UiContext from "./uiContext.js";

/**
 * Cross-module overlay state (issue drawer, create sheet, command palette).
 * Kept separate from workspace data so overlays never re-render the data layer.
 */
export function UiProvider({ children }) {
  const [issueId, setIssueId] = useState(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [createPreset, setCreatePreset] = useState({});
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const openIssue = useCallback((id) => {
    if (id) setIssueId(id);
  }, []);

  const closeIssue = useCallback(() => setIssueId(null), []);

  const openCreateIssue = useCallback((preset = {}) => {
    setCreatePreset(preset);
    setCreateOpen(true);
  }, []);

  const value = useMemo(
    () => ({
      issueId,
      openIssue,
      closeIssue,
      createOpen,
      createPreset,
      openCreateIssue,
      closeCreateIssue: () => setCreateOpen(false),
      paletteOpen,
      setPaletteOpen,
      mobileNavOpen,
      setMobileNavOpen,
    }),
    [issueId, openIssue, closeIssue, createOpen, createPreset, openCreateIssue, paletteOpen, mobileNavOpen],
  );

  return <UiContext.Provider value={value}>{children}</UiContext.Provider>;
}

export default UiProvider;
