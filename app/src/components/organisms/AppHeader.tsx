"use client";

import { Breadcrumbs } from "@/components/molecules";
import { IconButton, Icon } from "@/components/atoms";
import { UserMenu } from "./UserMenu";
import { usePrefsStore } from "@/store";

export function AppHeader() {
  const { navCollapsed, toggleNav } = usePrefsStore();

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
      <div className="tb-search">
        <Icon name="search" size={16} />
        <input placeholder="Search reviews, properties, loan #…" />
      </div>
      <IconButton name="bell" aria-label="Notifications" />
      <IconButton name="help" aria-label="Help" />
      <UserMenu />
    </header>
  );
}
