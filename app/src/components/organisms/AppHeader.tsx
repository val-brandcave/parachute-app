"use client";

import { useEffect, useState } from "react";
import { Breadcrumbs } from "@/components/molecules";
import { IconButton } from "@/components/atoms";
import { UserMenu } from "./UserMenu";
import { SearchTrigger } from "./SearchTrigger";
import { CommandPalette } from "./CommandPalette";
import { usePrefsStore } from "@/store";

export function AppHeader() {
  const { navCollapsed, toggleNav } = usePrefsStore();
  const [searchOpen, setSearchOpen] = useState(false);

  // ⌘K / Ctrl+K opens the command palette anywhere in the app.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen((o) => !o);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  return (
    <header className="topbar">
      <IconButton
        name={navCollapsed ? "panel-open" : "panel-close"}
        size={18}
        onClick={toggleNav}
        aria-label={navCollapsed ? "Expand navigation" : "Collapse navigation"}
      />
      <Breadcrumbs />
      <div style={{ flex: 1 }} />
      <SearchTrigger onOpen={() => setSearchOpen(true)} />
      <IconButton name="bell" aria-label="Notifications" />
      <UserMenu />
      <CommandPalette open={searchOpen} onClose={() => setSearchOpen(false)} />
    </header>
  );
}
