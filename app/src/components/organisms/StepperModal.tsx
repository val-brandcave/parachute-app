"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Button, IconButton, Icon, type IconName } from "@/components/atoms";
import { cn } from "@/lib/utils";

export type Step = { key: string; label: string; desc?: string; icon?: IconName };

/**
 * Full-page takeover modal with a left stepper rail and a footer action bar.
 * Controlled: the parent owns `current` and renders the active step's content
 * as children. Use for multi-step flows like "Order a review".
 */
export function StepperModal({
  open,
  onClose,
  title,
  eyebrow,
  steps,
  current,
  onNavigate,
  onBack,
  onNext,
  onSubmit,
  nextLabel = "Continue",
  submitLabel = "Submit",
  nextDisabled = false,
  submitting = false,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  eyebrow?: string;
  steps: Step[];
  current: number;
  onNavigate?: (index: number) => void;
  onBack?: () => void;
  onNext?: () => void;
  onSubmit?: () => void;
  nextLabel?: string;
  submitLabel?: string;
  nextDisabled?: boolean;
  submitting?: boolean;
  children: React.ReactNode;
}) {
  const isLast = current === steps.length - 1;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    if (open) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="spm"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 12 }}
          transition={{ duration: 0.22, ease: "easeOut" }}
          role="dialog"
          aria-modal="true"
          aria-label={title}
        >
          <header className="spm-head">
            <div style={{ flex: 1 }}>
              {eyebrow && <div className="spm-eyebrow">{eyebrow}</div>}
              <div className="spm-title">{title}</div>
            </div>
            <IconButton name="close" onClick={onClose} aria-label="Close" />
          </header>

          <div className="spm-main">
            <nav className="spm-rail scroll" aria-label="Steps">
              {steps.map((s, i) => {
                const done = i < current;
                const active = i === current;
                const clickable = !!onNavigate && i <= current;
                return (
                  <button
                    key={s.key}
                    className={cn(
                      "spm-step",
                      active && "active",
                      done && "done",
                      clickable && "clickable",
                    )}
                    onClick={clickable ? () => onNavigate!(i) : undefined}
                    aria-current={active ? "step" : undefined}
                  >
                    {/* Active pill slides between steps (shared layout, like the nav) */}
                    {active && (
                      <motion.span
                        layoutId="spm-pill"
                        className="spm-step-pill"
                        transition={{ type: "spring", stiffness: 520, damping: 42 }}
                      />
                    )}
                    {s.icon && (
                      <span className="spm-step-ic">
                        <Icon name={s.icon} size={18} strokeWidth={active ? 2.2 : 1.9} />
                      </span>
                    )}
                    <span className="spm-step-label">{s.label}</span>
                    {/* Donut: hollow ring until the step is done, then petrol + check */}
                    <span className="spm-ind" aria-hidden="true">
                      {done && <Icon name="check" size={12} />}
                    </span>
                  </button>
                );
              })}
            </nav>

            <div className="spm-content scroll">
              <div className="spm-content-inner">{children}</div>
            </div>
          </div>

          <footer className="spm-foot">
            {/* Back is the left action; the top X handles dismiss (no Cancel). */}
            {current > 0 ? (
              <Button variant="outline" iconLeft="back" onClick={onBack}>
                Back
              </Button>
            ) : (
              <span />
            )}
            {isLast ? (
              <Button
                variant="primary"
                iconRight="check"
                onClick={onSubmit}
                disabled={submitting}
              >
                {submitting ? "Submitting…" : submitLabel}
              </Button>
            ) : (
              <Button
                variant="primary"
                iconRight="chevron-right"
                onClick={onNext}
                disabled={nextDisabled}
              >
                {nextLabel}
              </Button>
            )}
          </footer>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
