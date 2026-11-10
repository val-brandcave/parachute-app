"use client";

import Link from "next/link";
import { Avatar, Icon } from "@/components/atoms";

/** Realwired Admin's own bar: a foreign product, so it does not borrow the Parachute shell. */
export function TopBar({
  orgName,
  initials,
  backHref,
}: {
  orgName: string;
  initials: string;
  backHref: string;
}) {
  return (
    <header className="bx-top">
      <div className="bx-brand">
        <span className="bx-brand-mark" aria-hidden="true">
          <Icon name="shield" size={17} />
        </span>
        <span className="bx-brand-name">Realwired</span>
        <span className="bx-brand-sub">Admin</span>
      </div>
      <span className="bx-top-org">{orgName}</span>
      <div className="bx-top-end">
        <Link href={backHref} className="bx-back">
          <Icon name="back" size={15} />
          Back to Parachute
        </Link>
        <Avatar initials={initials} size={28} tone="soft" />
      </div>
    </header>
  );
}
