import { useContext } from "react";
import UiContext from "./uiContext.js";

/** Access overlay state shared by every module. */
export function useUi() {
  const context = useContext(UiContext);
  if (!context) throw new Error("useUi must be used inside <UiProvider>");
  return context;
}

export default useUi;
