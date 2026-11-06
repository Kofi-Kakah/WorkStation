import { createContext } from "react";

/** Shared workspace data context. Use the useWorkspace hook to consume it. */
const WorkspaceContext = createContext(null);

export default WorkspaceContext;
