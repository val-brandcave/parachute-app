"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@/components/atoms";
import { useReviewsStore } from "@/store";

type Crumb = { label: string; href?: string };

const TOP_LABELS: Record<string, string> = {
  dashboard: "Dashboard",
  reviews: "Reviews",
  templates: "Templates",
  settings: "Settings",
  components: "Components",
  styleguide: "Style Guide",
};

// Technical / Administrative (and Builder/Workbook) are IN-PAGE TABS, not routes,
// so they never appear as crumbs. Only true sub-routes do.
const SUB_LABELS: Record<string, string> = {
  triage: "Intake Triage",
};

export function Breadcrumbs() {
  const pathname = usePathname();
  const reviews = useReviewsStore((s) => s.reviews);
  const segs = pathname.split("/").filter(Boolean);

  let crumbs: Crumb[] = [];

  if (segs[0] === "reviews" && segs[1]) {
    const review = reviews.find((r) => r.id === segs[1]);
    crumbs.push({ label: "Reviews", href: "/reviews" });
    crumbs.push({
      label: review?.propertyAddress ?? "Review",
      href: `/reviews/${segs[1]}`,
    });
    if (segs[2] && SUB_LABELS[segs[2]]) crumbs.push({ label: SUB_LABELS[segs[2]] });
  } else if (segs[0]) {
    crumbs.push({ label: TOP_LABELS[segs[0]] ?? segs[0] });
  }

  if (!crumbs.length) crumbs = [{ label: "Parachute" }];

  return (
    <nav className="ui-crumbs" aria-label="Breadcrumb">
      {crumbs.map((c, i) => {
        const last = i === crumbs.length - 1;
        return (
          <span key={i} className="ui-crumb">
            {c.href && !last ? (
              <Link href={c.href}>{c.label}</Link>
            ) : (
              <span className={last ? "cur" : undefined}>{c.label}</span>
            )}
            {!last && <Icon name="chevron-right" size={15} className="sep" />}
          </span>
        );
      })}
    </nav>
  );
}
