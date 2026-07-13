"use client";

import { useState } from "react";
import { Icon, IconButton } from "@/components/atoms";
import type { ActivityActor, ActivityEntry } from "@/store";
import type { IconName } from "@/components/atoms/Icon";

/**
 * Activity ledger drawer (audit layer 3, Phase 2b) — the complete, ordered
 * record of every touch on the document, docked on the right like Customize but
 * strictly read-only. This is the layer that answers the examiner's "did a human
 * actually work this?" — nothing is silent, every button is here.
 *
 * Store-agnostic (Phase 2c): the host passes the ledger in, so the Technical
 * workbook (workspace store) and the Administrative attestation (admin store)
 * share one drawer. Docks via the shared `.run-wb-dock` shell; mutually
 * exclusive with Customize where that panel exists.
 */

const ACTOR_LABEL: Record<ActivityActor, string> = {
  you: "You",
  ai: "Parachute",
  system: "System",
};

const dayKey = (ms: number) => new Date(ms).toDateString();

const fmtTime = (ms: number) =>
  new Date(ms).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });

const fmtDay = (ms: number, todayKey: string, yesterdayKey: string) => {
  const k = dayKey(ms);
  if (k === todayKey) return "Today";
  if (k === yesterdayKey) return "Yesterday";
  return new Date(ms).toLocaleDateString([], { month: "long", day: "numeric" });
};

export function RunActivityPanel({
  entries,
  docNoun = "workbook",
  reviewerName,
  onClose,
}: {
  /** The ledger, newest first (workspace or admin store). */
  entries: ActivityEntry[];
  /** What the document is called in the copy — "workbook" | "attestation". */
  docNoun?: string;
  reviewerName: string;
  onClose: () => void;
}) {
  const activity = entries;

  // "Today"/"Yesterday" anchors captured once — never recompute clock in render.
  const [{ todayKey, yesterdayKey }] = useState(() => {
    const now = Date.now();
    return { todayKey: dayKey(now), yesterdayKey: dayKey(now - 86_400_000) };
  });

  // Group the (already newest-first) ledger into day buckets, preserving order.
  const groups: { day: string; entries: ActivityEntry[] }[] = [];
  for (const e of activity) {
    const label = fmtDay(e.at, todayKey, yesterdayKey);
    const last = groups[groups.length - 1];
    if (last && last.day === label) last.entries.push(e);
    else groups.push({ day: label, entries: [e] });
  }

  const editCount = activity.filter((e) => e.actor === "you").length;

  return (
    <aside className="run-wb-dock run-act scroll" aria-label="Document activity">
      <div className="run-wb-dock-head">
        <div>
          <h2 className="run-cz-title">
            <Icon name="history" size={16} /> Activity
          </h2>
          <p className="run-cz-sub">
            {editCount === 0
              ? "Every change you make is recorded here."
              : `${editCount} reviewer ${editCount === 1 ? "action" : "actions"} on this ${docNoun}.`}
          </p>
        </div>
        <IconButton name="close" onClick={onClose} aria-label="Close activity" />
      </div>

      <div className="run-act-body">
        {groups.map((g) => (
          <section className="run-act-group" key={g.day}>
            <h3 className="run-act-day">{g.day}</h3>
            <ol className="run-act-list">
              {g.entries.map((e) => (
                <ActivityRow key={e.id} entry={e} reviewerName={reviewerName} />
              ))}
            </ol>
          </section>
        ))}
      </div>

      <p className="run-act-foot">
        <Icon name="sso" size={13} />
        This ledger travels with the review — it is not printed on the {docNoun} by default.
      </p>
    </aside>
  );
}

function ActivityRow({ entry: e, reviewerName }: { entry: ActivityEntry; reviewerName: string }) {
  const who = e.actor === "you" ? reviewerName : ACTOR_LABEL[e.actor];
  const showDiff = e.before != null || e.after != null;
  return (
    <li className={`run-act-item run-act-item--${e.kind ?? "system"}`}>
      <span className={`run-act-dot run-act-dot--${e.actor}`} aria-hidden="true">
        <Icon name={(e.icon as IconName) ?? "history"} size={12} />
      </span>
      <div className="run-act-main">
        <p className="run-act-line">
          <span className="run-act-who">{who}</span>{" "}
          <span className="run-act-verb">{e.action.toLowerCase()}</span>
          {e.target && <span className="run-act-target"> {e.target}</span>}
        </p>
        {showDiff && (
          <div className="run-act-diff">
            {e.before && <span className="run-act-before">{e.before}</span>}
            {e.before && e.after && (
              <Icon name="forward" size={12} className="run-act-arrow" />
            )}
            {e.after && <span className="run-act-after">{e.after}</span>}
          </div>
        )}
        <span className="run-act-time">{fmtTime(e.at)}</span>
      </div>
    </li>
  );
}
