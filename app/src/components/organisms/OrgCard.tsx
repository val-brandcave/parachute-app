"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Icon, Tooltip } from "@/components/atoms";
import { CURRENT_ORG } from "@/lib/current-user";

/** Organization card pinned to the bottom of the sidebar → org settings. The
 *  avatar shows the org initials in the same navy square as the settings logo
 *  (AvatarUpload), so the two stay visually consistent. */
export function OrgCard({
  collapsed,
  name = CURRENT_ORG.name,
  sub = CURRENT_ORG.kind,
  initials = CURRENT_ORG.initials,
}: {
  collapsed: boolean;
  name?: string;
  sub?: string;
  initials?: string;
}) {
  const pathname = usePathname();
  const active = pathname.startsWith("/settings");

  const card = (
    <Link
      href="/settings"
      className={cn("org-card", active && "active", collapsed && "collapsed")}
    >
      <span className="org-av">{initials}</span>
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
