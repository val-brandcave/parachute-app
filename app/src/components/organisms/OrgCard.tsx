"use client";

/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Icon, Tooltip } from "@/components/atoms";
import { useIdentityStore } from "@/store";
import { CURRENT_ORG } from "@/lib/current-user";

/** Organization card pinned to the bottom of the sidebar → the Configure hub
 *  (templates, checklists, defaults, org identity). The avatar shows the org
 *  initials in the same navy square as the org logo (AvatarUpload), so the two
 *  stay visually consistent. */
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
  const orgAvatar = useIdentityStore((s) => s.orgAvatar);
  const active = pathname.startsWith("/configure");

  const card = (
    <Link
      href="/configure"
      className={cn("org-card", active && "active", collapsed && "collapsed")}
    >
      {orgAvatar ? (
        <img src={orgAvatar} alt="" className="org-av" style={{ objectFit: "cover" }} />
      ) : (
        <span className="org-av">{initials}</span>
      )}
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
      <Tooltip content={`${name} · Configure`} side="right" block>
        {card}
      </Tooltip>
    );
  }
  return card;
}
