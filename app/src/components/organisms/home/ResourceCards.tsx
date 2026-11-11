"use client";

import Link from "next/link";
import { Icon, Illustration, type IllustrationName } from "@/components/atoms";
import { TRUST_HREF } from "@/lib/setup-steps";

const CARDS: { title: string; body: string; href: string; art: IllustrationName }[] = [
  {
    title: "Learning Center",
    body: "Short videos and guides for every step, grouped by task.",
    href: "/learn",
    art: "04b-learning-center",
  },
  {
    title: "Trust Center",
    body: "Security and compliance documents for your IT team.",
    href: TRUST_HREF,
    art: "03b-trust-center",
  },
  {
    title: "How credits work",
    body: "What each review costs, and what happens at zero.",
    href: "/configure/billing?tab=credits",
    art: "01b-credits",
  },
];

/** "More resources": Learning Center · Trust Center · How credits work (spots 04b, 03b, 01b, 120 px, panel on). */
export function ResourceCards() {
  return (
    <section className="gs-res" aria-labelledby="gs-res-title">
      <h2 className="gs-res-title" id="gs-res-title">
        More resources
      </h2>
      <div className="gs-res-grid">
        {CARDS.map((c) => (
          <Link key={c.title} href={c.href} className="card gs-res-card">
            <span className="gs-res-art">
              <Illustration name={c.art} size={120} panel />
            </span>
            <span className="gs-res-body">
              <span className="gs-res-name">
                {c.title}
                <span aria-hidden="true">
                  <Icon name="arrow-up-right" size={16} />
                </span>
              </span>
              <span className="gs-res-desc">{c.body}</span>
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
