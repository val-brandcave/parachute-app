"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  AppShell as RwAppShell,
  IconButton,
  SidebarAction,
  type NavGroup,
  type NavNode,
} from "@realwired/ui";

import { Icon, Logo } from "@/components/atoms";
import { Breadcrumbs } from "@/components/molecules";
import { OrgCard } from "@/components/organisms/OrgCard";
import { BalancePill } from "@/components/organisms/BalancePill";
import { EarnedToastHost } from "@/components/organisms/EarnedToastHost";
import { UserMenu } from "@/components/organisms/UserMenu";
import { SearchTrigger } from "@/components/organisms/SearchTrigger";
import { CommandPalette } from "@/components/organisms/CommandPalette";
import { RunModal } from "@/components/run/RunModal";
import { DemoDock } from "@/components/organisms/DemoDock";
import { ReceiptDialog } from "@/components/organisms/wallet";
import { CreditsPill } from "@/components/organisms/CreditsPill";
import { SidebarResourceLinks } from "@/components/organisms/SidebarResourceLinks";
import { LockDialog } from "@/components/organisms/LockDialog";
import { CheckoutLauncher } from "@/components/organisms/CheckoutLauncher";
import { HeaderChipSlot } from "@/components/organisms/HeaderChipSlot";
import { TourHost } from "@/components/organisms/tour/TourHost";
import { ProtoPill } from "@/components/organisms/prototype/ProtoPill";
import { useStartGate } from "@/components/organisms/home/useStartGate";
import { useSetupGuideVisible } from "@/lib/landing";
import { usePrefsStore, useSessionStore, useSetupSummary } from "@/store";

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

const MAIN_ITEMS: NavNode[] = [
  { id: "dashboard", label: "Dashboard", icon: "dashboard", href: "/dashboard" },
  { id: "reviews", label: "Reviews", icon: "reviews", href: "/reviews" },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const mode = useSessionStore((s) => s.mode);
  const navCollapsed = usePrefsStore((s) => s.navCollapsed);
  const toggleNav = usePrefsStore((s) => s.toggleNav);

  const [searchOpen, setSearchOpen] = useState(false);
  const startGate = useStartGate();

  // "Get started" sits above Dashboard while setup is open and not hidden. It
  // carries the progress count; finishing or hiding the guide removes the row.
  const setupVisible = useSetupGuideVisible();
  const { doneCount, total } = useSetupSummary();
  const pct = total > 0 ? Math.round((doneCount / total) * 100) : 0;
  // The library row takes a string label and a pill badge, which cannot hold a
  // progress bar. Its label slot renders any node at runtime, so the expanded row
  // passes a two-line label (name + count, then the bar) and the library keeps the
  // row, the sliding pill and the focus ring. Collapsed, the tooltip needs a string.
  useEffect(() => {
    document.documentElement.style.setProperty("--gs-pct-n", String(pct / 100));
  }, [pct]);
  const nav = useMemo<NavGroup[]>(() => {
    const expandedLabel = (
      <span className="gs-label" aria-label={`Get started, ${doneCount} of ${total} steps done`}>
        <span className="gs-label-row">
          <span className="gs-label-name">Get started</span>
          <span className="gs-label-count" aria-hidden="true">
            {doneCount}/{total}
          </span>
        </span>
        <span className="gs-bar" aria-hidden="true">
          <span className="gs-bar-fill" style={{ width: `${pct}%` }} />
        </span>
      </span>
    );
    const items: NavNode[] = setupVisible
      ? [
          {
            id: "get-started",
            label: (navCollapsed
              ? `Get started, ${doneCount} of ${total}`
              : expandedLabel) as unknown as string,
            icon: "rocket",
            href: "/get-started",
          },
          ...MAIN_ITEMS,
        ]
      : MAIN_ITEMS;
    return [{ id: "main", items }];
  }, [setupVisible, doneCount, total, pct, navCollapsed]);

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
        nav={nav}
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
        navAction={(collapsed) =>
          startGate.locked ? (
            // Pending approval (spec §5.5 lock-then-explain): same structure as the enabled
            // link so icon + label keep their row; never disabled. aria-disabled + a
            // visually-hidden reason; click / Enter / Space opens the approval dialog.
            // (LockedAction can't wrap a SidebarAction asChild — Slot takes one child — so the
            // same contract is applied inline here.)
            <SidebarAction
              asChild
              collapsed={collapsed}
              label={collapsed ? `Start a review. ${startGate.reasonText}` : "Start a review"}
              aria-disabled="true"
              className="start-locked"
            >
              <span
                role="button"
                tabIndex={0}
                aria-describedby="sb-start-reason"
                onClick={(e) => startGate.explain(e.currentTarget)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    startGate.explain(e.currentTarget);
                  }
                }}
              >
                <Icon name="parachute" size={19} />
                {!collapsed && <span className="truncate">Start a review</span>}
                {!collapsed && (
                  <span className="locked-glyph" aria-hidden="true">
                    <Icon name="hourglass-high" size={14} />
                  </span>
                )}
                <span id="sb-start-reason" className="ui-visually-hidden">
                  {startGate.reasonText}
                </span>
              </span>
            </SidebarAction>
          ) : (
            <SidebarAction asChild collapsed={collapsed} label="Start a review">
              <Link href="/launchpad">
                <Icon name="parachute" size={19} />
                {!collapsed && <span className="truncate">Start a review</span>}
              </Link>
            </SidebarAction>
          )
        }
        sidebarFooter={(collapsed) => (
          <div className="sb-foot">
            <SidebarResourceLinks collapsed={collapsed} />
            <BalancePill collapsed={collapsed} />
            <OrgCard collapsed={collapsed} />
          </div>
        )}
        header={{
          start: (
            <>
              <Breadcrumbs />
              <HeaderChipSlot />
            </>
          ),
          end: (
            <>
              <SearchTrigger onOpen={() => setSearchOpen(true)} />
              <CreditsPill />
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
      <ReceiptDialog />
      <DemoDock />
      <LockDialog />
      <CheckoutLauncher />
      <TourHost scope="shell" />
      <ProtoPill />
    </>
  );
}
