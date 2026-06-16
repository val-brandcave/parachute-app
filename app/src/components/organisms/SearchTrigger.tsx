"use client";

import { IconButton } from "@/components/atoms";

/** Icon-only search button in the header; opens the command palette (also bound to ⌘K/Ctrl+K). */
export function SearchTrigger({ onOpen }: { onOpen: () => void }) {
  return <IconButton name="search" onClick={onOpen} aria-label="Search" />;
}
