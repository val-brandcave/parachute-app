"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { Illustration, type IllustrationName } from "@/components/atoms";
import { HOW_CREDITS_HREF } from "@/components/organisms/checkout/CostBlock";

/**
 * Tab- and section-level empty state (rule, 12 Nov 2026): a compact card in the How credits work
 * style — title, one line, the main action and a link to the related help on the left, a spot
 * illustration on the right. Page-level first runs (Dashboard, Reviews) use FirstRunHero with a
 * video instead.
 * // DS-candidate: EmptyCard — compact illustrated empty state for tabs and sections.
 */
export function BillingEmptyCard({
  title,
  children,
  action,
  ill,
  status,
  help = { label: "How credits work", href: HOW_CREDITS_HREF },
}: {
  title: ReactNode;
  children: ReactNode;
  action?: ReactNode;
  ill: IllustrationName;
  status?: ReactNode;
  /** The related help link; null hides it. */
  help?: { label: string; href: string } | null;
}) {
  return (
    <section className="card bl-card bec">
      <div className="bec-tx">
        {status && (
          <p className="bec-status" role="status">
            {status}
          </p>
        )}
        <h2 className="bl-h bec-h">{title}</h2>
        <p className="bl-body bec-body tw-pretty">{children}</p>
        {(action || help) && (
          <div className="bec-acts">
            {action}
            {help && (
              <Link href={help.href} className="bec-link">
                {help.label} →
              </Link>
            )}
          </div>
        )}
      </div>
      <Illustration name={ill} size={120} className="bec-ill" />
    </section>
  );
}
