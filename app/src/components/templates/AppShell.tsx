"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  AppShell as RwAppShell,
  IconButton,
  SidebarAction,
  type NavGroup,
} from "@realwired/ui";

import { Icon, Logo } from "@/components/atoms";
import { Breadcrumbs } from "@/components/molecules";
import { OrgCard } from "@/components/organisms/OrgCard";
import { SetupDock } from "@/components/organisms/SetupDock";
import { BalancePill } from "@/components/organisms/BalancePill";
import { EarnedToastHost } from "@/components/organisms/EarnedToastHost";
import { UserMenu } from "@/components/organisms/UserMenu";
import { SearchTrigger } from "@/components/organisms/SearchTrigger";
import { CommandPalette } from "@/components/organisms/CommandPalette";
import { RunModal } from "@/components/run/RunModal";
import { DemoDock } from "@/components/organisms/DemoDock";
import { TopUpModal, ReceiptDialog } from "@/components/organisms/wallet";
import { usePrefsStore, useSessionStore } from "@/store";

/**
 * Parachute's shell, now rendered by the design system.
 *
 * This file is the point of the whole branch. Before, Parachute owned a
 * bespoke `.shell` grid, a bespoke `Sidebar` organism and a bespoke `AppHeader`
 * layout — about 200 lines of CSS in `globals.css` plus two components. Now it
 * owns none of that. It supplies its own CONTENT into the library's slots and
 * gets the structure, the collapse behaviour, the nesting model and the active
 * treatment from `@realwired/ui`.
 *
 * Two things this proves, which were previously only claims:
 *
 * 1. **Import-as-dependency works end to end** (Cody's C1). Parachute installs
 *    a versioned package. Nothing was copied between repos, so nothing can
 *    drift.
 *
 * 2. **The library runs unmodified on Next.js.** The shell never imports a
 *    router — `next/link` is injected below. The Next-to-Vite migration is
 *    therefore decoupled from library adoption and can stay where the plan put
 *    it, after the customer ship, instead of blocking it.
 *
 * It also collapses the two-Bibles problem. Engineers reading this app for
 * visual truth and importing from the library are now looking at the same
 * artifact, so the two cannot disagree.
 */

const NAV: NavGroup[] = [
  {
    id: "main",
    items: [
      { id: "dashboard", label: "Dashboard", icon: "dashboard", href: "/dashboard" },
      { id: "reviews", label: "Reviews", icon: "reviews", href: "/reviews" },
    ],
  },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const mode = useSessionStore((s) => s.mode);
  const navCollapsed = usePrefsStore((s) => s.navCollapsed);
  const toggleNav = usePrefsStore((s) => s.toggleNav);

  const [searchOpen, setSearchOpen] = useState(false);

  // Cmd/Ctrl+K opens the command palette anywhere in the app. Kept here rather
  // than in the library: a command palette's CONTENTS are product knowledge,
  // and a shortcut the shell owns is a shortcut every product has to accept.
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

  // Embedded (J1): the run flow takes over the viewport and returns to
  // YouConnect on sign. The library models this as `chromeless`.
  const embedded = mode === "embedded";

  return (
    <>
      <RwAppShell
        nav={NAV}
        currentPath={pathname}
        // The routing seam. On Vite this becomes React Router's Link; on
        // Inertia, @inertiajs/react's. The library is unaware of all three.
        linkComponent={Link}
        chromeless={embedded}
        collapsed={navCollapsed}
        onCollapsedChange={toggleNav}
        brand={(collapsed) =>
          collapsed ? (
            <Logo themeAware full={false} height={26} />
          ) : (
            <Logo themeAware full height={24} />
          )
        }
        // SidebarAction rather than a Button: its geometry mirrors the nav
        // row (h42, padding 0 12, gap 12) so its icon lands in the SAME icon
        // column as the rows beneath it. A Button centres its content, which
        // breaks that column the moment the label length changes.
        navAction={(collapsed) => (
          <SidebarAction asChild collapsed={collapsed} label="Start a review">
            <Link href="/launchpad">
              <Icon name="parachute" size={19} />
              {!collapsed && <span className="truncate">Start a review</span>}
            </Link>
          </SidebarAction>
        )}
        sidebarFooter={(collapsed) => (
          <div className="sb-foot">
            <SetupDock collapsed={collapsed} />
            <BalancePill collapsed={collapsed} />
            <OrgCard collapsed={collapsed} />
          </div>
        )}
        header={{
          start: <Breadcrumbs />,
          end: (
            <>
              <SearchTrigger onOpen={() => setSearchOpen(true)} />
              <IconButton icon="bell" label="Notifications" />
              <UserMenu />
            </>
          ),
        }}
      >
        {children}
      </RwAppShell>

      <CommandPalette open={searchOpen} onClose={() => setSearchOpen(false)} />
      <RunModal />
      <EarnedToastHost />
      <TopUpModal />
      <ReceiptDialog />
      <DemoDock />
    </>
  );
}
