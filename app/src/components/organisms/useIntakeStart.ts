"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useStartGate } from "@/components/organisms/home/useStartGate";
import { DEMO_RUN_REVIEW_ID, useOrderStore, useRunStore, type RunDisplay } from "@/store";

/**
 * One way to start a review from a file drop or a YouConnect delivery (spec §5.5 Start
 * sites 6, 7, 10). Gates on approval (`useStartGate().explain`: locked → the approval
 * dialog, no run) and otherwise shows a short "reading the PDF" beat, then opens Review
 * setup (the confirm gate) in the RunModal takeover. Shared by the Launchpad `IntakeWidget`
 * and the Reviews level-1 upload zone (PC-37).
 */
export function useIntakeStart(): {
  start: (file: File | null, source: "upload" | "yc", deliveryId?: string) => void;
  parsing: boolean;
} {
  const openRun = useRunStore((s) => s.openRun);
  const deliveries = useOrderStore((s) => s.deliveries);
  const { locked, explain } = useStartGate();
  const [parsing, setParsing] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const start = useCallback(
    (file: File | null, source: "upload" | "yc", deliveryId?: string) => {
      if (parsing) return;
      if (locked) {
        explain();
        return;
      }
      const delivery = source === "yc" ? deliveries.find((d) => d.id === deliveryId) : undefined;
      const docLabel = delivery?.propertyAddress ?? file?.name ?? "Appraisal.pdf";
      const display: RunDisplay | null = delivery
        ? {
            address: delivery.propertyAddress,
            propertyType: delivery.propertyType,
            bank: delivery.bank,
            loanNo: delivery.loanNo,
            firm: delivery.appraisalFirm,
          }
        : null;
      setParsing(true);
      // Cosmetic "reading the PDF" beat, then hand off to the run flow's confirm gate.
      // The chosen property's identity (display) carries through; findings stay mock content.
      timer.current = setTimeout(() => {
        setParsing(false);
        openRun(DEMO_RUN_REVIEW_ID, {
          startAt: "confirm",
          docLabel,
          display,
          source: source === "yc" ? "yc" : "drop",
        });
      }, 700);
    },
    [parsing, locked, explain, deliveries, openRun],
  );

  return { start, parsing };
}
