"use client";

import { useId, useState } from "react";
import { Dialog } from "@realwired/ui";
import { Button, Icon, Input, Label, Textarea } from "@/components/atoms";
import { cn } from "@/lib/utils";
import { CUSTOM_CREDITS } from "@/lib/pricing";
import "./request-credits.css";

const NOTE_MAX = 200;
const clamp = (n: number) => Math.min(CUSTOM_CREDITS.max, Math.max(CUSTOM_CREDITS.min, n));
const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

/** What the reviewer has and what a full review costs; the dialog derives its picks from these. */
export interface RequestCreditsDialogProps {
  open: boolean;
  onClose: () => void;
  /** "Dana", or the whole fallback phrase ("your admin"). */
  adminFirst: string;
  /** The organization's spendable balance now. */
  balance: number;
  /** Credits one full review (every type) costs, from `costFor`. */
  fullCost: number;
  /** Resolves true when the request was made (the dialog then closes). */
  onSend: (o: { credits: number; note: string }) => Promise<boolean>;
  /** Where focus goes on close; the opener when it is still on the page. */
  returnFocus?: () => HTMLElement | null;
}

/**
 * Reviewer asks the admin for credits (spec §5.9): how many, an optional note, Send request.
 * Credits only, never dollars. The amount defaults to the shortfall for the next full review,
 * else one full review, bounded by the checkout custom range (`CUSTOM_CREDITS`).
 * DS `Dialog size="sm"`: Radix portal, Esc and outside click close, focus returns to the opener.
 */
export function RequestCreditsDialog({
  open,
  onClose,
  adminFirst,
  balance,
  fullCost,
  onSend,
  returnFocus,
}: RequestCreditsDialogProps) {
  const shortfall = Math.max(0, fullCost - balance);
  const fallback = String(clamp(shortfall > 0 ? shortfall : fullCost));
  const picks = [
    ...(shortfall > 0 && shortfall !== fullCost ? [{ label: "Next review", credits: shortfall }] : []),
    { label: "1 review", credits: fullCost },
    { label: "3 reviews", credits: fullCost * 3 },
  ]
    .map((q) => ({ ...q, credits: clamp(q.credits) }))
    .filter((q, i, all) => all.findIndex((o) => o.credits === q.credits) === i);

  const [text, setText] = useState(fallback);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Each opening starts fresh: the default amount, no note, no error.
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setText(fallback);
      setNote("");
      setError(null);
    }
  }
  const formId = useId();
  const amountId = useId();
  const helpId = useId();
  const noteId = useId();

  const typed = Number.parseInt(text, 10);
  const valid = Number.isFinite(typed) && typed >= CUSTOM_CREDITS.min && typed <= CUSTOM_CREDITS.max;
  const credits = valid ? typed : null;

  const set = (n: number) => {
    setText(String(clamp(n)));
    setError(null);
  };
  const stepBy = (d: number) => set((Number.isFinite(typed) ? typed : CUSTOM_CREDITS.min - d) + d);

  const send = async () => {
    if (busy) return;
    if (credits === null) {
      setError(`Enter ${CUSTOM_CREDITS.min} to ${CUSTOM_CREDITS.max} credits.`);
      return;
    }
    setBusy(true);
    const ok = await onSend({ credits, note });
    setBusy(false);
    if (ok) onClose();
  };

  // Plain words: what the org could run once these land, counting what is already there.
  const reviews = credits !== null && fullCost > 0 ? Math.floor((balance + credits) / fullCost) : null;
  const equivalent =
    reviews === null
      ? null
      : reviews === 0
        ? "Not enough for a full review yet."
        : balance > 0
          ? `With the ${plural(balance, "credit", "credits")} you have, that covers ${plural(reviews, "full review", "full reviews")}.`
          : `Enough for ${plural(reviews, "full review", "full reviews")}.`;

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) onClose();
      }}
      size="sm"
      title={`Ask ${adminFirst} for credits`}
      className="rqm-dlg"
      returnFocus={returnFocus}
      initialFocus={() => document.getElementById(amountId)}
      footerStart={
        <Button variant="ghost" onClick={onClose}>
          Cancel
        </Button>
      }
      footer={
        <Button type="submit" form={formId} iconLeft="send" busy={busy}>
          Send request
        </Button>
      }
    >
      <form
        id={formId}
        className="rqm"
        onSubmit={(e) => {
          e.preventDefault();
          void send();
        }}
      >
        <div className="rqm-field">
          <Label htmlFor={amountId}>How many credits</Label>
          <div className="rqm-amount">
            {/* DS-candidate: NumberStepper — same − [n] + entry as checkout's custom amount. */}
            <div className="rqm-stepper">
              <button type="button" className="rqm-step-btn" aria-label="One credit fewer" onClick={() => stepBy(-1)}>
                <Icon name="minus" size={16} />
              </button>
              <Input
                id={amountId}
                inputMode="numeric"
                className="rqm-step-input mono"
                value={text}
                aria-invalid={error ? true : undefined}
                aria-describedby={helpId}
                onChange={(e) => {
                  setText(e.target.value.replace(/[^\d]/g, "").slice(0, 3));
                  setError(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === "ArrowUp" || e.key === "ArrowDown") {
                    e.preventDefault();
                    stepBy(e.key === "ArrowUp" ? 1 : -1);
                  }
                }}
              />
              <button type="button" className="rqm-step-btn" aria-label="One credit more" onClick={() => stepBy(1)}>
                <Icon name="add" size={16} />
              </button>
            </div>
            <div className="qf-opts" role="group" aria-label="Quick amounts">
              {picks.map((q) => (
                <button
                  key={q.label}
                  type="button"
                  className={cn("qf-opt", credits === q.credits && "on")}
                  aria-pressed={credits === q.credits}
                  onClick={() => set(q.credits)}
                >
                  {q.label}
                </button>
              ))}
            </div>
          </div>
          <p id={helpId} className={error ? "rqm-help rqm-help--err" : "rqm-help"} role={error ? "alert" : undefined}>
            {error ?? equivalent ?? `${CUSTOM_CREDITS.min} to ${CUSTOM_CREDITS.max} credits.`}
          </p>
        </div>

        <div className="rqm-field">
          <Label htmlFor={noteId}>
            Note for {adminFirst} <span className="rqm-opt">(optional)</span>
          </Label>
          <Textarea
            id={noteId}
            rows={3}
            maxLength={NOTE_MAX}
            value={note}
            placeholder="For example: 3 reports due Friday"
            onChange={(e) => setNote(e.target.value)}
          />
        </div>

        <p className="rqm-quiet">We&rsquo;ll email {adminFirst} your request and your balance.</p>
      </form>
    </Dialog>
  );
}
