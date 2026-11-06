import { useContext } from "react";
import WorkspaceContext from "./workspaceContext.js";

/** Access the shared demo workspace state and actions. */
export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error("useWorkspace must be used inside <WorkspaceProvider>");
  }
  return context;
}

export default useWorkspace;
