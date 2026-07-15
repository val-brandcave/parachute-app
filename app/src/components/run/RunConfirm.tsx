"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Button, Icon, YouConnectGlyph } from "@/components/atoms";
import { useTemplatesStore } from "@/store";
import { inheritedLayout, profileFor } from "@/lib/workbook";
import { InheritedTemplateField } from "./InheritedTemplateField";
import type { Review } from "@/types";
import type { RunDisplay, RunReviewType, RunSource } from "@/store";

/** Property types offered in the type select (mirrors the Order flow). */
const PROP_TYPES = [
  "Office (Medical/Dental)",
  "Office (General)",
  "Retail (Anchored)",
  "Industrial (Warehouse)",
  "Self-storage",
  "Multifamily",
  "Hospitality",
  "Mixed-Use",
  "Special Purpose",
  "Going concern",
];

/** Mock source-document length for the parsed-file chip. */
const MOCK_PAGES = 74;

/**
 * Which field-group a review type contributes to the confirm form. The form
 * renders the UNION of groups across the selected *live* types (deduping the
 * shared `identity` group). A future non-property type ships with
 * `propertyBased: false` and no `identity` group — the forcing function for the
 * property-vs-entity decision (still open).
 */
type FieldGroup = "identity" | "technical" | "administrative";

interface ReviewTypeSpec {
  id: RunReviewType;
  label: string;
  /** One-line "what it does / what it produces" — mirrors the Order flow's
   *  output-first framing (Cody, Jul 7: "each of these could use a description").
   *  Generic language ("the report's", not "the appraisal's") so it reads true
   *  for non-property types too. */
  description: string;
  status: "live" | "soon";
  propertyBased: boolean;
  defaultOn?: boolean; // selected by default
  fieldGroups: FieldGroup[];
}

/**
 * Generic review-type registry. Add a type by adding a spec (the picker, union
 * form, and store id-space all follow). Each carries a one-line description
 * (rendered under the label). The "coming soon" placeholder cards were removed
 * Jul 14 (Ed) — the pattern for how a new type populates is clear, so the
 * roadmap teasers only added noise to the run gate.
 */
const REVIEW_TYPES: ReviewTypeSpec[] = [
  {
    id: "technical",
    label: "Technical",
    description: "Checks the report's methodology, comps, and value conclusion. Output: a reviewer workbook.",
    status: "live",
    propertyBased: true,
    defaultOn: true,
    fieldGroups: ["identity", "technical"],
  },
  {
    id: "administrative",
    label: "Administrative",
    description: "Verifies the report against policy and regulatory requirements. Output: a signed attestation.",
    status: "live",
    propertyBased: true,
    // Pre-checked with Technical — Ed (Jun 30): "80% of us order both."
    defaultOn: true,
    fieldGroups: ["identity", "administrative"],
  },
];

const WRAP_V = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06, delayChildren: 0.04 } },
} as const;
const ITEM_V = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.34, ease: "easeOut" } },
} as const;

/**
 * Pre-review confirm gate — a source-aware "fast confirm" of the values the AI
 * extracted, before the review runs. Full-page (no side nav, like Progress); a
 * single centered card.
 *
 * Type-first (D2): the **review type drives the inputs**, not the other way
 * round. You pick what to review (name-only pills — Technical + Administrative
 * both pre-checked per Ed's "80% order both", each freely untickable, a couple
 * "coming soon"); Start gates on ≥1 selected (an inline note explains when
 * zero). The form below is the union of the selected types' field groups —
 * shared Property identity once, plus a per-type setup section that fades in.
 * Lean scope: identity + type + checklist only; assignee/due/priority stay in
 * the heavier Order flow.
 */
export function RunConfirm({
  review,
  docLabel,
  source,
  onStart,
  onCancel,
}: {
  review: Review;
  docLabel: string | null;
  source: RunSource | null;
  onStart: (
    display: RunDisplay,
    types: RunReviewType[],
    opts?: { checklistId?: string | null; layoutId?: string | null },
  ) => void;
  onCancel: () => void;
}) {
  const yc = source === "yc";

  const checklists = useTemplatesStore((s) => s.checklists);
  const layouts = useTemplatesStore((s) => s.layouts);

  const [address, setAddress] = useState(review.propertyAddress ?? "");
  const [propertyType, setPropertyType] = useState(review.propertyType ?? PROP_TYPES[0]);
  const [bank, setBank] = useState(review.bank ?? "");
  const [loanNo, setLoanNo] = useState(review.loanNo ?? "");
  const [firm, setFirm] = useState(review.appraisalFirm ?? "");

  // Selected *live* types — both pre-checked (the 80% case); every type can be
  // unticked, and Start gates on at least one remaining.
  const [selected, setSelected] = useState<RunReviewType[]>(
    REVIEW_TYPES.filter((s) => s.status === "live" && s.defaultOn).map((s) => s.id),
  );

  // Per-review template overrides. Both default to the org-inherited template
  // (null) and can be overridden *for this review only* via the shared
  // InheritedTemplateField control — same "audited per-order override" rule as
  // the Order flow. Bank policy is NOT here: it's org policy owned by Settings →
  // Compliance (F-123), applied to every run, never a per-review pick.
  const defaultChecklist = checklists.find((c) => c.isDefault) ?? checklists[0];
  const [checklistId, setChecklistId] = useState<string | null>(null);
  const [layoutId, setLayoutId] = useState<string | null>(null);
  const effectiveChecklistId = checklistId ?? defaultChecklist?.id ?? null;

  // The per-type setup (workbook layout · compliance checklist) is tucked behind
  // an Advanced disclosure, collapsed by default (Jul 14, Ed): the defaults are
  // already correct, so it stays out of sight unless the reviewer goes looking.
  const [advancedOpen, setAdvancedOpen] = useState(false);

  const isSel = (id: RunReviewType) => selected.includes(id);
  const toggle = (spec: ReviewTypeSpec) => {
    if (spec.status !== "live") return;
    setSelected((prev) =>
      prev.includes(spec.id) ? prev.filter((x) => x !== spec.id) : [...prev, spec.id],
    );
  };

  // The form's field groups = union across the selected types.
  const selectedSpecs = REVIEW_TYPES.filter((s) => selected.includes(s.id));
  const showIdentity = selectedSpecs.some((s) => s.fieldGroups.includes("identity"));
  const showTechnical = isSel("technical");
  const showAdmin = isSel("administrative");

  // Technical config = the org workbook layout inherited from this property's
  // profile (authored in Templates). It's the *default*; the reviewer can
  // override it for this review from the layouts library — same model as the
  // Order flow.
  const profile = profileFor(propertyType);
  const defaultLayout = inheritedLayout(layouts, profile);

  // Start gates on ≥1 review type; identity only matters if a selected type asks for it.
  const canStart = selected.length > 0 && (!showIdentity || address.trim().length > 0);

  const start = () => {
    if (!canStart) return;
    onStart(
      {
        address: address.trim(),
        propertyType,
        bank: bank.trim(),
        loanNo: loanNo.trim(),
        firm: firm.trim(),
      },
      selected,
      {
        checklistId: showAdmin ? effectiveChecklistId : null,
        layoutId: showTechnical ? layoutId : null,
      },
    );
  };

  return (
    <div className="run-cf-wrap">
      <div className="run-cf scroll">
        <motion.div className="run-cf-inner" variants={WRAP_V} initial="hidden" animate="show">
        <motion.div className="run-cf-head" variants={ITEM_V}>
          <h2 className="run-cf-title">Review setup</h2>
          <p className="run-cf-sub">
            {yc
              ? "Pulled from YouConnect — choose what to review, confirm the details, and run."
              : "Choose what to review, check the auto-filled details, then run."}
          </p>
        </motion.div>

        {/* Card — the source file. */}
        <motion.div className="run-cf-card run-cf-card--file" variants={ITEM_V}>
          <span className="run-cf-file">
            <span className="run-cf-ic run-cf-ic--file" aria-hidden="true">
              <Icon name="pdf" size={18} />
            </span>
            <span className="run-cf-file-name">{docLabel ?? "Appraisal.pdf"}</span>
            <span className="run-cf-file-meta">· {MOCK_PAGES} pages</span>
          </span>
          {yc ? (
            <span className="run-cf-tag run-cf-tag--yc">
              <YouConnectGlyph size={14} /> From YouConnect
            </span>
          ) : (
            <span className="run-cf-tag run-cf-tag--parsed">
              <Icon name="check-circle" size={15} /> parsed
            </span>
          )}
        </motion.div>

        {/* Card — review type (drives the inputs below). */}
        <motion.div className="run-cf-card" variants={ITEM_V}>
          <span className="run-cf-card-head">Review type</span>
          <p className="run-cf-card-sub">Select one or more — each adds its own setup below.</p>
          <div className="run-cf-opts">
            {REVIEW_TYPES.map((spec) => {
              const soon = spec.status === "soon";
              const on = !soon && isSel(spec.id);
              const cls = `run-cf-opt${on ? " is-on" : ""}${soon ? " is-soon" : ""}`;
              const body = (
                <>
                  <span className="run-cf-opt-box" aria-hidden="true">
                    {on && <Icon name="check" size={14} />}
                  </span>
                  <span className="run-cf-opt-body">
                    <span className="run-cf-opt-label">
                      {spec.label}
                      {soon && <span className="run-cf-opt-soon">(coming soon)</span>}
                    </span>
                    <span className="run-cf-opt-desc">{spec.description}</span>
                  </span>
                </>
              );
              return soon ? (
                <div key={spec.id} className={cls} aria-disabled="true">
                  {body}
                </div>
              ) : (
                <button
                  key={spec.id}
                  type="button"
                  className={cls}
                  role="checkbox"
                  aria-checked={on}
                  onClick={() => toggle(spec)}
                >
                  {body}
                </button>
              );
            })}
          </div>
          {selected.length === 0 && (
            <p className="run-cf-opt-note" role="status">
              Select at least one review type to start.
            </p>
          )}
        </motion.div>

        {/* Card — property details (shared identity group). */}
        {showIdentity && (
          <motion.div className="run-cf-card" variants={ITEM_V}>
            <span className="run-cf-card-head">Property details</span>
            <div className="run-cf-form">
              <label className="field run-cf-wide">
                <span>Property address</span>
                <input value={address} onChange={(e) => setAddress(e.target.value)} />
              </label>
              <label className="field">
                <span>Property type</span>
                <select value={propertyType} onChange={(e) => setPropertyType(e.target.value)}>
                  {PROP_TYPES.map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span>Client / Lender</span>
                <input value={bank} onChange={(e) => setBank(e.target.value)} />
              </label>
              <label className="field">
                <span>Loan number</span>
                <input value={loanNo} onChange={(e) => setLoanNo(e.target.value)} />
              </label>
              <label className="field">
                <span>Appraiser firm</span>
                <input value={firm} onChange={(e) => setFirm(e.target.value)} />
              </label>
            </div>
          </motion.div>
        )}

          {/* Advanced setup (Jul 14→15) — the per-type template overrides
              (workbook layout · compliance checklist) sit behind a lightweight
              disclosure: a tertiary text toggle, NOT a card. Defaults are already
              correct; only a reviewer who wants to change them for THIS review
              opens it, revealing the two setup cards beneath. */}
          {(showTechnical || showAdmin) && (
            <motion.div className="run-cf-advwrap" variants={ITEM_V}>
              <button
                type="button"
                className="run-cf-advbtn"
                onClick={() => setAdvancedOpen((o) => !o)}
                aria-expanded={advancedOpen}
              >
                <Icon
                  name="chevron-down"
                  size={16}
                  className={`run-cf-advbtn-chev${advancedOpen ? " on" : ""}`}
                />
                {advancedOpen ? "Hide advanced setup" : "Advanced setup"}
              </button>
              <AnimatePresence initial={false}>
                {advancedOpen && (
                  <motion.div
                    key="adv-body"
                    className="run-cf-advsecs"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.24, ease: "easeOut" }}
                    style={{ overflow: "hidden" }}
                  >
                    {showTechnical && (
                      <div className="run-cf-card">
                        <span className="run-cf-card-head">Technical review setup</span>
                        <InheritedTemplateField
                          icon="book"
                          label="Workbook layout"
                          defaultId={defaultLayout?.id ?? null}
                          defaultMeta={`Org default · from the ${profile} profile`}
                          options={layouts.map((l) => ({ id: l.id, name: l.name }))}
                          value={layoutId}
                          onChange={setLayoutId}
                        />
                      </div>
                    )}
                    {showAdmin && (
                      <div className="run-cf-card">
                        <span className="run-cf-card-head">Administrative review setup</span>
                        {/* Compliance checklist is a TEMPLATE (org default, overridable
                            per review). Bank policy is intentionally absent: it's org
                            policy owned by Configure → Compliance (F-123), applied to
                            every run, so it has no per-review knob here. */}
                        <InheritedTemplateField
                          icon="checklist"
                          label="Compliance checklist"
                          defaultId={defaultChecklist?.id ?? null}
                          defaultMeta="Org default · authored in Templates"
                          options={checklists.map((c) => ({ id: c.id, name: c.name }))}
                          value={checklistId}
                          onChange={setChecklistId}
                        />
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </motion.div>
      </div>

      {/* Sticky footer (Jul 14) — pinned so the reviewer can Start without
          scrolling past every card; sits outside the scroll area. */}
      <div className="run-cf-footbar">
        <div className="run-cf-footbar-inner">
          <Button variant="ghost" size="sm" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            iconLeft="parachute"
            disabled={!canStart}
            onClick={start}
          >
            Start review
          </Button>
        </div>
      </div>
    </div>
  );
}
