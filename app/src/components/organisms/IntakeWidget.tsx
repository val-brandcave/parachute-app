"use client";

import { useEffect, useRef, useState } from "react";
import { Icon, Chip } from "@/components/atoms";
import { SegmentedControl } from "@/components/molecules";
import { cn, formatShortDate } from "@/lib/utils";
import { useRunStore, useOrderStore, DEMO_RUN_REVIEW_ID, type RunDisplay } from "@/store";
import type { YcDelivery } from "@/types";

type IntakeMode = "drop" | "yc";

/**
 * The primary intake (J3) — one widget, two modes behind a segmented toggle:
 * drop an appraisal PDF, or pick one from the YouConnect pipeline. Either path
 * opens the run flow (S-E → S-A). The 90%-user entry point: get from "I have a
 * document" to "here's the workbook" in one move. Defaults to Drop (the common path).
 *
 * `variant`:
 *  - "hero"  — the Launchpad landing page: larger, accent-forward, the app's
 *              front door (F-119 — its own route, primary CTA, not buried).
 *  - "card"  — the compact embed used elsewhere.
 */
export function IntakeWidget({ variant = "card" }: { variant?: "card" | "hero" }) {
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

  const hero = variant === "hero";

  return (
    <section className={cn("intake", hero && "intake--hero")} aria-label="Start a review">
      <div className="intake-head">
        <span className="intake-title">Start a review</span>
        <SegmentedControl<IntakeMode>
          value={mode}
          onChange={setMode}
          options={[
            { value: "drop", label: "Drop a file" },
            { value: "yc", label: "From YouConnect" },
          ]}
        />
      </div>

      <div className="intake-body">
        {mode === "drop" ? (
          <div
            className={cn("intake-drop", dragging && "drag", parsing && "busy")}
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
            <input ref={fileRef} type="file" accept="application/pdf" hidden onChange={onPick} />
            {parsing ? (
              <>
                <span className="ui-spinner" />
                <div className="intake-drop-title">Reading the appraisal…</div>
                <p>Extracting property, lender and loan details.</p>
              </>
            ) : (
              <>
                <span className="intake-drop-ic">
                  <Icon name="upload" size={hero ? 32 : 26} />
                </span>
                <div className="intake-drop-title">Drop an appraisal to start</div>
                <p>
                  Drag &amp; drop the PDF, or <span className="intake-link">browse</span> — you go
                  straight to the workbook.
                </p>
              </>
            )}
          </div>
        ) : (
          <>
            <div className="intake-yc-bar">
              <p className="intake-yc-sub">
                {totalNew} delivered from YouConnect, ready to run.
              </p>
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
            </div>
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
          </>
        )}
      </div>
    </section>
  );
}

function deliveredLabel(d: YcDelivery) {
  return `delivered ${formatShortDate(d.deliveredAt)}`;
}
