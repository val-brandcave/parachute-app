"use client";

import { useCallback, useId, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Chip, Icon } from "@/components/atoms";
import { dur, ease, useMotionMode } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { useOrgStore, type SectionSummary, type SetupSummary } from "@/store";
import { EarnPill } from "./EarnPill";
import { registerEarnPill } from "./earnPillRegistry";
import { SetupRow } from "./SetupRow";

/** What the section shows beside its title: the earn pill, the pending hold, "Recommended", or nothing. */
function useSectionBadge(section: SectionSummary, summary: SetupSummary): "earn" | "earned" | "held" | "recommended" | null {
  const billing = useOrgStore((s) => s.org?.billing);
  if (summary.pending && section.id === "first_review") return "held";
  if (section.reward <= 0) return "recommended";
  // Invoiced orgs never earn; neither does a section once the window closed unpaid.
  if (billing === "invoiced") return null;
  if (section.awarded) return "earned";
  // No window: an org without a trial grant never earns; an enterprise org still waiting
  // for its call shows the pill (its window opens on confirmation).
  if (!summary.earn.window) return summary.pending ? "earn" : null;
  if (summary.earn.window.state === "closed") return null;
  return "earn";
}

/**
 * One Get started v4 section (spec §5.2): title + earn pill + count, the sub line, then
 * its rows. The count doubles as the collapse toggle; a finished section starts folded.
 */
export function SetupSection({ section, summary }: { section: SectionSummary; summary: SetupSummary }) {
  const mode = useMotionMode();
  const [open, setOpen] = useState(!section.allDone);
  const badge = useSectionBadge(section, summary);
  const titleId = useId();
  const rowsId = useId();
  const pillRef = useCallback(
    (el: HTMLSpanElement | null) => {
      registerEarnPill(section.id, el);
    },
    [section.id],
  );

  const reveal = mode === "full" ? { duration: dur.standard, ease: ease.standard } : { duration: 0 };

  return (
    <section className="card gs-sec" aria-labelledby={titleId}>
      {/* The whole header toggles the section (mouse). The count button stays the
          keyboard / screen-reader control, so the header itself isn't a second tab stop. */}
      <div
        className="gs-sec-hd"
        onClick={(e) => {
          if ((e.target as HTMLElement).closest(".gs-sec-ct")) return; // the button handles its own click
          setOpen((o) => !o);
        }}
      >
        <div className="gs-sec-main">
          <div className="gs-sec-t">
            <h2 id={titleId}>{section.title}</h2>
            {(badge === "earn" || badge === "earned") && <EarnPill state={badge} ref={pillRef} />}
            {badge === "held" && (
              <Chip tone="accent" className="gs-held">
                <span aria-hidden="true">
                  <Icon name="hourglass-high" size={14} />
                </span>
                Unlocks after your call
              </Chip>
            )}
            {badge === "recommended" && <Chip>Recommended</Chip>}
          </div>
          <p className="gs-sec-sub">{section.sub}</p>
        </div>
        <button
          type="button"
          className="gs-sec-ct"
          aria-expanded={open}
          aria-controls={rowsId}
          onClick={() => setOpen((o) => !o)}
        >
          <span className="mono">
            {section.doneCount} of {section.total}
          </span>
          <span className="ui-visually-hidden">{open ? ", hide steps" : ", show steps"}</span>
          <span aria-hidden="true" className={cn("gs-sec-chev", open && "is-open")}>
            <Icon name="chevron-down" size={16} />
          </span>
        </button>
      </div>
      <AnimatePresence initial={false}>
        {open && (
          <motion.ul
            id={rowsId}
            className="gs-rows"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1, transition: reveal }}
            exit={{ height: 0, opacity: 0, transition: reveal }}
          >
            {section.steps.map((s) => (
              <SetupRow key={s.id} step={s} primary={s.id === section.primaryId} summary={summary} />
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </section>
  );
}
