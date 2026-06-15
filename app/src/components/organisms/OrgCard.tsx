"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Icon, Tooltip } from "@/components/atoms";

/** Organization card pinned to the bottom of the sidebar → org settings. */
export function OrgCard({
  collapsed,
  name = "Demo Bank, N.A.",
  sub = "Organization",
}: {
  collapsed: boolean;
  name?: string;
  sub?: string;
}) {
  const pathname = usePathname();
  const active = pathname.startsWith("/settings");

  const card = (
    <Link
      href="/settings"
      className={cn("org-card", active && "active", collapsed && "collapsed")}
    >
      <span className="org-av">
        <Icon name="org" size={collapsed ? 20 : 19} />
      </span>
      {!collapsed && (
        <>
          <span className="org-main">
            <span className="org-name">{name}</span>
            <span className="org-sub">{sub}</span>
          </span>
          <span className="org-go">
            <Icon name="settings" size={17} />
          </span>
        </>
      )}
    </Link>
  );

  if (collapsed) {
    return (
      <Tooltip content={`${name} · Settings`} side="right" block>
        {card}
      </Tooltip>
    );
  }
  return card;
}
