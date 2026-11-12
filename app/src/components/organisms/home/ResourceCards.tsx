"use client";

import Link from "next/link";
import { Illustration, type IllustrationName } from "@/components/atoms";
import { TRUST_HREF } from "@/lib/setup-steps";
import "./gs-cards.css";

const CARDS: { title: string; body: string; href: string; action: string; art: IllustrationName }[] = [
  {
    title: "Learning Center",
    body: "Short videos and guides for every step, grouped by task.",
    href: "/learn",
    action: "Open Learning Center",
    art: "04b-learning-center",
  },
  {
    title: "Trust Center",
    body: "Security and compliance documents for your IT team.",
    href: TRUST_HREF,
    action: "Open Trust Center",
    art: "03b-trust-center",
  },
  {
    title: "How credits work",
    body: "What each review costs, and what happens at zero.",
    href: "/configure/billing?tab=credits",
    action: "See how credits work",
    art: "01b-credits",
  },
];

/**
 * "More resources": Learning Center · Trust Center · How credits work. Same tile language
 * as the Configure hub (`.cfg-card`): title + one line on the left, spot illustration on
 * the right (04b, 03b, 01b at 96 px). The outline button is the action, not the card.
 */
export function ResourceCards() {
  return (
    <section className="gs-res" aria-labelledby="gs-res-title">
      <h2 className="gs-res-title" id="gs-res-title">
        More resources
      </h2>
      <div className="gs-res-grid">
        {CARDS.map((c) => (
          <article key={c.title} className="gs-res-card">
            <div className="gs-res-body">
              <h3 className="gs-res-name">{c.title}</h3>
              <p className="gs-res-desc">{c.body}</p>
              <Link href={c.href} className="ui-btn ui-btn--sm ui-btn--outline gs-res-btn">
                {c.action}
              </Link>
            </div>
            <Illustration name={c.art} size={96} className="gs-res-art" />
          </article>
        ))}
      </div>
    </section>
  );
}
