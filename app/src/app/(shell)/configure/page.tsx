"use client";

import Link from "next/link";
import { Illustration, type IllustrationName } from "@/components/atoms";



type ConfigCard = {
  href: string;
  /** Spot illustration on the right of the card (same tile language as Learning Center and the empty states). */
  ill: IllustrationName;
  title: string;
  desc: string;
  tags: string[];
};

// The org-setup surfaces. Grouped by what each shapes: identity/inputs, the run
// defaults, each authoring library (workbook layouts + the response library are
// first-class siblings), the ingested admin form, then trust and billing.
const CARDS: ConfigCard[] = [
  {
    href: "/configure/organization",
    ill: "16b-organization",
    title: "Organization",
    desc: "Your bank's name, logo, branding and credit policy.",
    tags: ["Name and logo", "Branding", "Credit policy"],
  },
  {
    href: "/configure/defaults",
    ill: "17b-review-defaults",
    title: "Review defaults",
    desc: "The settings every new review starts with.",
    tags: ["Profile and SLA", "Quality gate", "Confidence"],
  },
  {
    href: "/configure/workbook-layouts",
    ill: "08b-signed-workbook",
    title: "Workbook layouts",
    desc: "How the Technical workbook is laid out: sections, order and versions.",
    tags: ["Technical workbook", "Versions"],
  },
  {
    href: "/configure/responses",
    ill: "07b-finding-citation",
    title: "Response library",
    desc: "Reusable replies for your findings, shared or just for you.",
    tags: ["Shared and personal", "Merge fields"],
  },
  {
    href: "/configure/checklists",
    ill: "06b-first-upload",
    title: "Compliance checklists",
    desc: "Your bank's compliance checklist: upload it, map it, keep it current.",
    tags: ["Upload and map", "Set active"],
  },
  {
    href: "/trust",
    ill: "03b-trust-center",
    title: "Trust Center",
    desc: "What your IT team needs to approve Parachute as a vendor.",
    tags: ["Documents", "At a glance", "Send to IT"],
  },
  {
    href: "/configure/billing",
    ill: "02b-wallet-top-up",
    title: "Billing & credits",
    desc: "Your balance, receipts, payment method and auto-reload.",
    tags: ["Balance", "Activity", "Payment"],
  },
];

export default function ConfigureHub() {
  return (
    <>
      <div className="pagebody">
        <div className="cfg-grid">
          {CARDS.map((c) => (
            <Link key={c.href} href={c.href} className="cfg-card">
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
              <Illustration name={c.ill} size={104} className="cfg-card-ill" />
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}
