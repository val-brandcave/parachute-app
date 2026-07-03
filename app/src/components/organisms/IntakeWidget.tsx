"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { IconCloudFilled } from "@tabler/icons-react";
import { Icon, Chip, ChuteEmblem } from "@/components/atoms";
import { SegmentedControl } from "@/components/molecules";
import { cn, formatShortDate } from "@/lib/utils";
import { useRunStore, useOrderStore, DEMO_RUN_REVIEW_ID, type RunDisplay } from "@/store";
import type { YcDelivery } from "@/types";

type IntakeMode = "drop" | "yc";

const HERO_WRAP = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07, delayChildren: 0.05 } },
} as const;
const HERO_ITEM = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.42, ease: "easeOut" } },
} as const;

/**
 * The primary intake (J3) — the Launchpad's hero (F-119 / F-126), scale-matched
 * to Cody's scientist reference (Jul 2): a compact centered column — layered
 * animated emblem → modest headline → copy → ONE fixed-footprint stage that
 * both modes (drop a PDF / pick from YouConnect) render into, so toggling never
 * moves the layout and the mode toggle never leaves the fold. Either path opens
 * the run flow (S-E → S-A). Defaults to Drop (the common path).
 *
 * Motion (F-133): the brand PARACHUTE (logomark-as-canopy) sways gently while
 * soft CLOUDS drift sideways (right → left) past it inside the seal — the canopy
 * glides across the sky. Replaces the old rocket + speed lines. Cross-fade
 * between modes; the upload glyph bobs and springs on drag-over.
 */

/** Emblem clouds — soft filled clouds at a few scales/heights, offbeat
 *  durations/delays so passes never sync. Each drifts right → left across the
 *  seal, fading in and out; clipped to the seal ring's circle, behind the
 *  parachute. */
const CLOUDS = [
  { top: "32%", size: 15, dur: 7.5, delay: 0, op: 0.5 },
  { top: "58%", size: 20, dur: 9, delay: 2.4, op: 0.4 },
  { top: "46%", size: 12, dur: 6.2, delay: 4.6, op: 0.55 },
] as const;
export function IntakeWidget() {
  const openRun = useRunStore((s) => s.openRun);
  const { deliveries, loadDeliveries } = useOrderStore();
  const [mode, setMode] = useState<IntakeMode>("drop");
  const [query, setQuery] = useState("");
  const [dragging, setDragging] = useState(false);
  const [parsing, setParsing] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    loadDeliveries();
  }, [loadDeliveries]);
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const start = (
    docLabel: string,
    display: RunDisplay | null = null,
    source: "drop" | "yc" = "drop",
  ) => {
    if (parsing) return;
    setParsing(true);
    // Cosmetic "reading the PDF" beat, then hand off to the run flow's confirm
    // gate. The chosen property's identity (display) carries through; findings
    // stay mock content.
    timer.current = setTimeout(() => {
      setParsing(false);
      openRun(DEMO_RUN_REVIEW_ID, { startAt: "confirm", docLabel, display, source });
    }, 700);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const name = e.dataTransfer.files?.[0]?.name ?? "Appraisal.pdf";
    start(name, null, "drop");
  };

  const onPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.files?.[0]?.name ?? "Appraisal.pdf";
    start(name, null, "drop");
  };

  const q = query.trim().toLowerCase();
  const newDeliveries = deliveries.filter((d) => {
    if (d.status !== "new") return false;
    if (!q) return true;
    return (
      d.propertyAddress.toLowerCase().includes(q) ||
      d.loanNo.toLowerCase().includes(q) ||
      d.appraisalFirm.toLowerCase().includes(q) ||
      d.propertyType.toLowerCase().includes(q)
    );
  });
  const totalNew = deliveries.filter((d) => d.status === "new").length;

  const drop = mode === "drop";

  return (
    <motion.section
      className="intake-hero"
      variants={HERO_WRAP}
      initial="hidden"
      animate="show"
      aria-label="Start a review"
    >
      <motion.div className="ih-head" variants={HERO_ITEM}>
        {/* Emblem — the brand parachute sways while clouds drift right → left
            behind it (clipped to the seal ring's circle), so the canopy glides
            across the sky. No presence dot: Parachute's AI is a pipeline. */}
        <span className="ih-emblem" aria-hidden="true">
          <span className="ih-emblem-core">
            <span className="ih-emblem-clip">
              {CLOUDS.map((c, i) => (
                <motion.span
                  key={i}
                  className="ih-cloud"
                  style={{ top: c.top }}
                  initial={{ left: "114%", opacity: 0 }}
                  animate={{ left: ["114%", "88%", "0%", "-20%"], opacity: [0, c.op, c.op, 0] }}
                  transition={{
                    duration: c.dur,
                    delay: c.delay,
                    repeat: Infinity,
                    ease: "linear",
                    times: [0, 0.16, 0.84, 1],
                  }}
                >
                  <IconCloudFilled size={c.size} />
                </motion.span>
              ))}
            </span>
            <motion.span
              className="ih-emblem-glyph"
              style={{ transformOrigin: "50% 16%" }}
              animate={{ rotate: [-4.5, 4.5, -4.5], y: [0, 2.5, 0] }}
              transition={{ duration: 4.8, repeat: Infinity, ease: "easeInOut" }}
            >
              <ChuteEmblem size={44} />
            </motion.span>
          </span>
        </span>

        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={mode}
            className="ih-head-copy"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
          >
            <h1 className="ih-title">
              {drop ? "Drop an appraisal to start" : "Pull one from YouConnect"}
            </h1>
            <p className="ih-sub">
              {drop
                ? "Parachute reads it, runs the review, and compiles your workbook."
                : `Search and pick one of the ${totalNew} new deliveries to start.`}
            </p>
          </motion.div>
        </AnimatePresence>
      </motion.div>

      <motion.div className="ih-stage" variants={HERO_ITEM}>
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={mode}
            className="ih-stage-mode"
            initial={{ opacity: 0, x: drop ? -12 : 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: drop ? 12 : -12 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            {drop ? (
              <div
                className={cn("intake-drop ih-drop", dragging && "drag", parsing && "busy")}
                onDragOver={(e) => {
                  e.preventDefault();
                  if (!parsing) setDragging(true);
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={onDrop}
                role="button"
                tabIndex={0}
                onClick={() => !parsing && fileRef.current?.click()}
                onKeyDown={(e) => {
                  if ((e.key === "Enter" || e.key === " ") && !parsing) fileRef.current?.click();
                }}
                aria-label="Drop an appraisal PDF or browse to upload"
              >
                <input
                  ref={fileRef}
                  type="file"
                  accept="application/pdf"
                  hidden
                  onChange={onPick}
                />
                {parsing ? (
                  <>
                    <span className="ui-spinner" />
                    <div className="intake-drop-title">Reading the appraisal…</div>
                    <p>Extracting property, lender and loan details.</p>
                  </>
                ) : (
                  <>
                    <motion.span
                      className="intake-drop-ic"
                      animate={dragging ? { y: -5, scale: 1.06 } : { y: [0, -3, 0] }}
                      transition={
                        dragging
                          ? { type: "spring", stiffness: 320, damping: 18 }
                          : { duration: 2.6, repeat: Infinity, ease: "easeInOut" }
                      }
                    >
                      <Icon name="upload" size={24} />
                    </motion.span>
                    <div className="intake-drop-title">Drop your file here</div>
                    <p>
                      PDF · or <span className="intake-link">click to browse</span>
                    </p>
                  </>
                )}
              </div>
            ) : (
              <div className="ih-yc">
                <label className="intake-search">
                  <Icon name="search" size={15} />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search address, loan #, firm…"
                    aria-label="Search YouConnect deliveries"
                  />
                  {query && (
                    <button
                      type="button"
                      className="intake-search-x"
                      onClick={() => setQuery("")}
                      aria-label="Clear search"
                    >
                      <Icon name="close" size={14} />
                    </button>
                  )}
                </label>
                <div className="intake-yc-list scroll">
                  {newDeliveries.length === 0 ? (
                    <div className="intake-yc-empty">
                      {totalNew === 0
                        ? "No new deliveries right now."
                        : `No deliveries match “${query.trim()}”.`}
                    </div>
                  ) : (
                    newDeliveries.map((d) => (
                      <button
                        key={d.id}
                        className="intake-yc-item"
                        onClick={() =>
                          start(
                            d.propertyAddress,
                            {
                              address: d.propertyAddress,
                              propertyType: d.propertyType,
                              bank: d.bank,
                              loanNo: d.loanNo,
                              firm: d.appraisalFirm,
                            },
                            "yc",
                          )
                        }
                        disabled={parsing}
                      >
                        <span className="intake-yc-item-main">
                          <span className="intake-yc-item-title">{d.propertyAddress}</span>
                          <span className="intake-yc-item-sub">
                            Loan #{d.loanNo} · {deliveredLabel(d)}
                          </span>
                        </span>
                        <Chip tone="info">New</Chip>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </motion.div>

      <motion.div className="ih-toggle" variants={HERO_ITEM}>
        <SegmentedControl<IntakeMode>
          value={mode}
          onChange={setMode}
          options={[
            { value: "drop", label: "Drop a file" },
            { value: "yc", label: "From YouConnect" },
          ]}
        />
      </motion.div>
    </motion.section>
  );
}

function deliveredLabel(d: YcDelivery) {
  return `delivered ${formatShortDate(d.deliveredAt)}`;
}
