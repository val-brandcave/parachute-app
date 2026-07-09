"use client";

import { useState } from "react";
import { Modal, Button, Icon } from "@/components/atoms";
import { SegmentedControl } from "@/components/molecules";
import { SEV_META } from "@/lib/utils";
import type { Severity } from "@/types";

export interface NewFinding {
  category: string;
  question: string;
  analysis: string;
  page: number;
  severity: Severity;
  /** Quoted source span, when created evidence-first from a Source selection. */
  evidence?: string;
}

const CATEGORIES = [
  "Reviewer Note",
  "Sales Comparison",
  "Income Approach",
  "Scope of Work",
  "Compliance",
  "Value Conclusion",
];

const SEV_OPTIONS: { value: Severity; label: string }[] = [
  { value: "crit", label: SEV_META.crit.label },
  { value: "fail", label: SEV_META.fail.label },
  { value: "flag", label: SEV_META.flag.label },
  { value: "pass", label: SEV_META.pass.label },
];

const EMPTY: NewFinding = {
  category: "Reviewer Note",
  question: "",
  analysis: "",
  page: 1,
  severity: "flag",
};

/**
 * Add a reviewer-authored finding to the review. A single-step modal-form
 * (centered `Modal` + structured inputs → Save) — the reusable quick-add
 * pattern for short structured creates across the app. Saving attributes the
 * finding to the reviewer and drops it into the workspace.
 */
export function AddFindingModal({
  open,
  onClose,
  onSave,
  categories,
  prefill,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (f: NewFinding) => void;
  /** Override the category options (e.g. the target findings chapter's
   *  categories, so the new finding lands where the reviewer clicked). */
  categories?: string[];
  /** Seed the composer — evidence-first creation from a Source span carries the
   *  quote + page. Applied when the modal opens; absent = a blank output-first add. */
  prefill?: Partial<NewFinding>;
}) {
  const [draft, setDraft] = useState<NewFinding>(EMPTY);
  // Seed the draft the moment the modal opens — blank for an output-first add, or
  // prefilled from a Source selection. Uses the "adjust state on prop change"
  // render-time pattern (not an effect) so reopening always re-seeds cleanly.
  const [wasOpen, setWasOpen] = useState(false);
  if (open && !wasOpen) {
    setWasOpen(true);
    setDraft({ ...EMPTY, ...prefill });
  } else if (!open && wasOpen) {
    setWasOpen(false);
  }
  const cats = categories?.length ? categories : CATEGORIES;
  // Keep the draft's category valid for the offered list (it may be scoped to
  // a specific chapter when opened from the workbook canvas).
  const category = cats.includes(draft.category) ? draft.category : cats[0];

  const canSave = draft.question.trim().length > 0;

  // Closing always clears the draft, so the next open starts clean (no
  // setState-in-effect). Covers Cancel, Esc, backdrop, and post-save.
  const close = () => {
    setDraft(EMPTY);
    onClose();
  };

  const submit = () => {
    if (!canSave) return;
    onSave({
      ...draft,
      category,
      question: draft.question.trim(),
      analysis: draft.analysis.trim(),
    });
    close();
  };

  const set = <K extends keyof NewFinding>(key: K, value: NewFinding[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

  return (
    <Modal
      open={open}
      onClose={close}
      title={draft.evidence ? "Create finding from source" : "Add a finding"}
      size="sm"
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {draft.evidence && (
          <div className="af-evidence">
            <span className="af-evidence-h">
              <Icon name="quote" size={12} /> From the source · p.{draft.page}
            </span>
            <blockquote className="af-evidence-q">{draft.evidence}</blockquote>
          </div>
        )}
        <div className="field">
          <label htmlFor="af-question">Finding</label>
          <input
            id="af-question"
            autoFocus
            value={draft.question}
            onChange={(e) => set("question", e.target.value)}
            placeholder="e.g. Comparable 3 lacks a condition adjustment"
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) submit();
            }}
          />
        </div>

        <div style={{ display: "flex", gap: 12 }}>
          <div className="field" style={{ flex: 1 }}>
            <label htmlFor="af-category">Category</label>
            <select
              id="af-category"
              value={category}
              onChange={(e) => set("category", e.target.value)}
            >
              {cats.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div className="field" style={{ width: 110 }}>
            <label htmlFor="af-page">Page</label>
            <input
              id="af-page"
              type="number"
              min={1}
              value={draft.page}
              onChange={(e) => set("page", Math.max(1, Number(e.target.value) || 1))}
            />
          </div>
        </div>

        <div className="field">
          <label>Severity</label>
          <SegmentedControl
            options={SEV_OPTIONS}
            value={draft.severity}
            onChange={(v) => set("severity", v)}
          />
        </div>

        <div className="field">
          <label htmlFor="af-analysis">Your analysis</label>
          <textarea
            id="af-analysis"
            value={draft.analysis}
            onChange={(e) => set("analysis", e.target.value)}
            placeholder="Why this matters and what the appraiser should address. Attributed to you in the workbook."
          />
        </div>

        <div
          style={{
            display: "flex",
            gap: 8,
            justifyContent: "flex-end",
            marginTop: 6,
          }}
        >
          <Button variant="ghost" onClick={close}>
            Cancel
          </Button>
          <Button variant="primary" iconLeft="add" disabled={!canSave} onClick={submit}>
            Add finding
          </Button>
        </div>
      </div>
    </Modal>
  );
}
