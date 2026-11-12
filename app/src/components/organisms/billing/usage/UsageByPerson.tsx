"use client";

import { Avatar } from "@/components/atoms";
import { EmptyLine } from "@/components/molecules";

const n = (v: number) => `${Math.round(v * 10) / 10}`;
const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");

/**
 * "By person" (PC-28): a ranked list, most credits first, one hue, bars scaled to the top person.
 * Not a donut: five reviewers make slices unreadable and names need room. The value is text in
 * each row, so nothing needs hover. Same period and same derivation as the donut.
 */
export function UsageByPerson({
  rows,
  name,
}: {
  rows: readonly { userId: string; credits: number }[];
  name: (id: string) => string | undefined;
}) {
  const top = Math.max(0, ...rows.map((r) => r.credits));
  const total = rows.reduce((s, r) => s + r.credits, 0);
  return (
    <section className="card bl-card ubp" aria-labelledby="ubp-t">
      <div className="ud-head">
        <h2 className="bl-h" id="ubp-t">
          By person
        </h2>
        <span className="bl-sub">Most credits first</span>
      </div>
      {rows.length === 0 ? (
        <EmptyLine>No credits used yet this period.</EmptyLine>
      ) : (
        <>
          <ul className="ubp-list" role="list">
            {rows.map((r) => {
              const who = name(r.userId) ?? "Unknown";
              return (
                <li className="ubp-row" key={r.userId}>
                  <span className="ubp-who">
                    <Avatar initials={initials(who)} size={28} tone="soft" />
                    <span className="ubp-name">{who}</span>
                  </span>
                  <span className="ubp-track" aria-hidden="true">
                    <i style={{ width: `${top > 0 ? (r.credits / top) * 100 : 0}%` }} />
                  </span>
                  <span className="ubp-v">
                    {n(r.credits)} <small>{r.credits === 1 ? "credit" : "credits"}</small>
                  </span>
                </li>
              );
            })}
          </ul>
          <div className="ubp-total">
            <b>Total</b>
            <span>
              {n(total)} {total === 1 ? "credit" : "credits"}
            </span>
          </div>
        </>
      )}
    </section>
  );
}
