"use client";

import { usePathname } from "next/navigation";
import { Logo } from "@/components/atoms";
import { NavItem } from "@/components/molecules";
import { OrgCard } from "./OrgCard";
import { usePrefsStore } from "@/store";
import type { IconName } from "@/components/atoms";

const PRIMARY: { href: string; icon: IconName; label: string }[] = [
  { href: "/launchpad", icon: "rocket", label: "Launchpad" },
  { href: "/dashboard", icon: "dashboard", label: "Dashboard" },
  { href: "/reviews", icon: "reviews", label: "Reviews" },
  { href: "/templates", icon: "templates", label: "Templates" },
];

export function Sidebar() {
  const pathname = usePathname();
  const navCollapsed = usePrefsStore((s) => s.navCollapsed);

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/");

  return (
    <aside className={`sidebar${navCollapsed ? " collapsed" : ""}`}>
      <div className="sb-head">
        {navCollapsed ? (
          <Logo themeAware full={false} height={26} />
        ) : (
          <Logo themeAware full height={24} />
        )}
      </div>

      <nav className="sb-nav scroll">
        {PRIMARY.map((n) => (
          <NavItem
            key={n.href}
            href={n.href}
            icon={n.icon}
            label={n.label}
            active={isActive(n.href)}
            collapsed={navCollapsed}
          />
        ))}
      </nav>

      <div className="sb-foot">
        <OrgCard collapsed={navCollapsed} />
      </div>
    </aside>
  );
}
