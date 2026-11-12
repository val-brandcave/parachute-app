"use client";

import { useEffect, useState } from "react";
import { Popover } from "@realwired/ui";
import { CreditChip, Icon, type CreditChipTone, type IconName } from "@/components/atoms";
import { useCurrentOrg, useCurrentUser } from "@/lib/current-user";
import { useWalletView } from "@/store";
import { CreditsPopover } from "./CreditsPopover";
import "./credits-chrome.css";

// DS-candidate: Popover close-on-scroll — Radix Popover does not close on scroll (AGENTS popover rule).
/**
 * Header credits pill (spec §5.3, PC-5/PC-30). Sits between SearchTrigger and the bell and opens the
 * credits popover. One unit only: the label is credits, never reviews or dollars (PC-6).
 *
 * DS Popover gives portal, flip, Esc and focus return; Radix does not close on scroll, so a
 * capture-phase scroll + resize close is added here (AGENTS floating-layer rule). The popover panel
 * is lifted to the 200 popover tier in credits-chrome.css.
 */
export function CreditsPill() {
  const { org } = useCurrentOrg();
  const me = useCurrentUser();
  const view = useWalletView();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const close = (e: Event) => {
      // Scrolling inside the panel itself must not dismiss it.
      if (e.target instanceof Element && e.target.closest(".credits-pop")) return;
      setOpen(false);
    };
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    return () => {
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
    };
  }, [open]);

  const billing = org?.billing;
  if (!billing) return null;

  let tone: CreditChipTone;
  let icon: IconName = "wallet";
  let label: string;
  const n = view.balance;
  if (billing === "invoiced") {
    tone = "invoiced";
    icon = "file-invoice";
    label = `${view.usedThisMonth} credit${view.usedThisMonth === 1 ? "" : "s"} used`;
  } else if (view.held) {
    tone = "held";
    icon = "hourglass-high";
    label = "Credits after your call";
  } else {
    tone = view.lowTone === "zero" ? "zero" : view.lowTone === "low" ? "low" : "credit";
    if (tone === "zero") icon = "wallet-off";
    label = `${n} credit${n === 1 ? "" : "s"}`;
  }

  return (
    <Popover
      open={open}
      onOpenChange={setOpen}
      side="bottom"
      align="end"
      width={340}
      className="credits-pop"
      trigger={
        <button
          type="button"
          className="credits-pill"
          aria-haspopup="dialog"
          aria-expanded={open}
          aria-label={`${label}, open credits`}
        >
          <CreditChip tone={tone}>
            <Icon name={icon} size={14} />
            <span className="credits-pill-l">{label}</span>
          </CreditChip>
        </button>
      }
    >
      {open && <CreditsPopover view={view} role={me.role} billing={billing} onClose={() => setOpen(false)} />}
    </Popover>
  );
}
