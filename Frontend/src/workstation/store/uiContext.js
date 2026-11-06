import { createContext } from "react";

/** Cross-module overlay state (issue drawer, create sheet, command palette). */
const UiContext = createContext(null);

export default UiContext;
