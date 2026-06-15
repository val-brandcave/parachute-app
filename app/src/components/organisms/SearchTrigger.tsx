"use client";

import { useEffect, useState } from "react";
import { Icon } from "@/components/atoms";

/** Compact "Search ⌘K" pill that opens the command palette. */
export function SearchTrigger({ onOpen }: { onOpen: () => void }) {
  const [isMac, setIsMac] = useState(false);
  useEffect(() => {
    // Browser-only platform read after mount (avoids an SSR hydration mismatch).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsMac(/mac/i.test(navigator.platform));
  }, []);

  return (
    <button className="searchtrigger" onClick={onOpen} aria-label="Search (Ctrl+K)">
      <Icon name="search" size={16} />
      <span className="st-label">Search…</span>
      <span className="st-kbd">
        <kbd>{isMac ? "⌘" : "Ctrl"}</kbd>
        <kbd>K</kbd>
      </span>
    </button>
  );
}
