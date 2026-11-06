import { useRef } from "react";

/** Tracks the pointer inside an element and exposes it as --mx/--my. */
export function useSpotlight() {
  const ref = useRef(null);

  const onPointerMove = (event) => {
    const node = ref.current;
    if (!node) return;
    const rect = node.getBoundingClientRect();
    node.style.setProperty("--mx", `${event.clientX - rect.left}px`);
    node.style.setProperty("--my", `${event.clientY - rect.top}px`);
  };

  return { ref, onPointerMove };
}

export default useSpotlight;
