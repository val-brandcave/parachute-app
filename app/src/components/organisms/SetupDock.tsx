"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Tooltip } from "@/components/atoms";
import { cn } from "@/lib/utils";
import { useOrgStage, useSetupHidden, useSetupSummary } from "@/store";

/** Sidebar footer: "Getting set up, 4 of 9" with a thin progress bar. A plain
 *  link to the setup card on Home. Shown on every shell page except Home while
 *  setup is `new` and not hidden. */
export function SetupDock({ collapsed }: { collapsed: boolean }) {
  const pathname = usePathname();
  const stage = useOrgStage();
  const hidden = useSetupHidden();
  const { doneCount, total } = useSetupSummary();

  if (stage !== "new" || hidden || pathname.startsWith("/dashboard")) return null;

  const label = `Getting set up, ${doneCount} of ${total}`;
  const pct = total > 0 ? Math.round((doneCount / total) * 100) : 0;
  const bar = (
    <span className="sb-bar" aria-hidden="true">
      <i style={{ width: `${pct}%` }} />
    </span>
  );

  const link = (
    <Link
      href="/dashboard#setup"
      className={cn("sb-dock", collapsed && "is-collapsed")}
      aria-label={label}
    >
      {collapsed ? (
        <>
          <span className="sb-dock-n">
            {doneCount}/{total}
          </span>
          {bar}
        </>
      ) : (
        <>
          <span className="sb-dock-row">
            <span className="sb-dock-title">Getting set up</span>
            <span className="sb-dock-n">
              {doneCount} of {total}
            </span>
          </span>
          {bar}
        </>
      )}
    </Link>
  );

  return collapsed ? (
    <Tooltip content={label} side="right" compact block>
      {link}
    </Tooltip>
  ) : (
    link
  );
}
