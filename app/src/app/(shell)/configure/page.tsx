"use client";

import Link from "next/link";
import { Icon, type IconName } from "@/components/atoms";

type ConfigCard = {
  href: string;
  icon: IconName;
  tone: "org" | "defaults" | "templates" | "checklists";
  title: string;
  desc: string;
  tags: string[];
};

// The four org-setup surfaces. Grouped by what each shapes: identity/inputs,
// the run defaults, the authoring libraries, and the ingested admin form.
const CARDS: ConfigCard[] = [
  {
    href: "/configure/organization",
    icon: "org",
    tone: "org",
    title: "Organization",
    desc: "Identity, branding, and org-wide inputs.",
    tags: ["Logo & name", "Branding", "Bank policy"],
  },
  {
    href: "/configure/defaults",
    icon: "filter",
    tone: "defaults",
    title: "Review defaults",
    desc: "The smart defaults that make a run one-click.",
    tags: ["Profile & SLA", "Quality gate", "Confidence"],
  },
  {
    href: "/configure/templates",
    icon: "templates",
    tone: "templates",
    title: "Templates & layouts",
    desc: "Workbook layouts and the shared response library.",
    tags: ["Workbook · Technical", "Response · shared"],
  },
  {
    href: "/configure/checklists",
    icon: "checklist",
    tone: "checklists",
    title: "Compliance checklists",
    desc: "The bank's admin form — upload, map, version.",
    tags: ["Upload & map", "Set active"],
  },
];

export default function ConfigureHub() {
  return (
    <>
      <div className="pagebody">
        <div className="cfg-grid">
          {CARDS.map((c) => (
            <Link key={c.href} href={c.href} className={`cfg-card cfg-card--${c.tone}`}>
              <span className="cfg-card-ic">
                <Icon name={c.icon} size={20} />
              </span>
              <span className="cfg-card-body">
                <span className="cfg-card-title">{c.title}</span>
                <span className="cfg-card-desc">{c.desc}</span>
                <span className="cfg-card-tags">
                  {c.tags.map((t) => (
                    <span key={t} className="cfg-card-tag">
                      {t}
                    </span>
                  ))}
                </span>
              </span>
              <Icon name="chevron-right" size={18} className="cfg-card-go" />
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}
