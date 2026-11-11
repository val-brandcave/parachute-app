"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SidebarAction } from "@realwired/ui";
import { Icon, type IconName } from "@/components/atoms";
import { cn } from "@/lib/utils";
import "./credits-chrome.css";

const ROWS: { href: string; label: string; icon: IconName }[] = [
  { href: "/trust", label: "Trust Center", icon: "shield" },
  { href: "/learn", label: "Learning Center", icon: "school" },
];

/**
 * Sidebar "Trust Center" + "Learning Center" rows above Balance (spec §5.4). DS SidebarAction
 * asChild + next/link so the 19 px icons land in the nav icon column; collapsed = icon + tooltip
 * (the DS wraps the tooltip around `label`). Visible for every role and billing model.
 */
export function SidebarResourceLinks({ collapsed }: { collapsed: boolean }) {
  const pathname = usePathname();
  return (
    <nav className="sb-res" aria-label="Resources">
      {ROWS.map((r) => {
        const active = pathname === r.href || pathname.startsWith(`${r.href}/`);
        return (
          <SidebarAction
            key={r.href}
            asChild
            collapsed={collapsed}
            label={r.label}
            className={cn("sb-res-row", active && "is-active")}
          >
            <Link href={r.href} aria-current={active ? "page" : undefined}>
              <Icon name={r.icon} size={19} />
              {!collapsed && <span className="truncate">{r.label}</span>}
            </Link>
          </SidebarAction>
        );
      })}
    </nav>
  );
}
