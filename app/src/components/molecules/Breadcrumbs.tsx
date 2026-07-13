"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@/components/atoms";
import { useReviewsStore, useTemplatesStore } from "@/store";

type Crumb = { label: string; href?: string };

const TOP_LABELS: Record<string, string> = {
  launchpad: "Start a review",
  dashboard: "Dashboard",
  reviews: "Reviews",
  configure: "Configure",
  profile: "Profile",
  components: "Components",
  styleguide: "Style Guide",
};

// Technical / Administrative (and Builder/Workbook) are IN-PAGE TABS, not routes,
// so they never appear as crumbs. Only true sub-routes do.
const SUB_LABELS: Record<string, string> = {
  triage: "Intake Triage",
};

// The Configure sections (segs[1]) → label + own route.
const CONFIG_SECTIONS: Record<string, string> = {
  organization: "Organization",
  defaults: "Review defaults",
  "workbook-layouts": "Workbook layouts",
  responses: "Response library",
  checklists: "Compliance checklists",
};

export function Breadcrumbs() {
  const pathname = usePathname();
  const reviews = useReviewsStore((s) => s.reviews);
  const checklists = useTemplatesStore((s) => s.checklists);
  const segs = pathname.split("/").filter(Boolean);

  let crumbs: Crumb[] = [];

  if (segs[0] === "reviews" && segs[1]) {
    const review = reviews.find((r) => r.id === segs[1]);
    crumbs.push({ label: "Reviews", href: "/reviews" });
    // Leaf = the loan number (the canonical record id), not the address — the
    // full property identity lives prominently in the ReviewContextBar instead.
    crumbs.push({
      label: review ? `Loan #${review.loanNo}` : "Review",
      href: `/reviews/${segs[1]}`,
    });
    if (segs[2] && SUB_LABELS[segs[2]]) crumbs.push({ label: SUB_LABELS[segs[2]] });
  } else if (segs[0] === "configure") {
    crumbs.push({ label: "Configure", href: "/configure" });
    const section = segs[1];
    if (section && CONFIG_SECTIONS[section]) {
      const sectionHref = `/configure/${section}`;
      const deeper = segs.length > 2;

      if (section === "workbook-layouts") {
        // .../workbook-layouts/view — the single-layout viewer.
        crumbs.push({ label: "Workbook layouts", href: deeper ? sectionHref : undefined });
        if (segs[2] === "view") {
          crumbs.push({ label: "Org workbook layout" });
        }
      } else if (section === "checklists") {
        // .../checklists/[id] — resolve the family name for the leaf.
        crumbs.push({ label: "Compliance checklists", href: deeper ? sectionHref : undefined });
        if (deeper) {
          const family = checklists.find((c) => c.id === segs[2]);
          crumbs.push({ label: family ? family.name : "Checklist" });
        }
      } else {
        crumbs.push({ label: CONFIG_SECTIONS[section] });
      }
    }
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
