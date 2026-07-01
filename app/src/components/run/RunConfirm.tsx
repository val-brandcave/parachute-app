"use client";

import { useState, type ChangeEvent } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Button, Icon, YouConnectGlyph } from "@/components/atoms";
import { useTemplatesStore } from "@/store";
import { inheritedLayout, profileFor } from "@/lib/workbook";
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

/** Human-readable file size for the attached-document row. */
function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${Math.round(n / 1024)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

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
  status: "live" | "soon";
  propertyBased: boolean;
  locked?: boolean; // always-on, can't be toggled off (Technical, MVP)
  defaultOn?: boolean; // selected by default
  fieldGroups: FieldGroup[];
}

/**
 * Generic review-type registry. Only the two `live` specs are selectable today;
 * a short "coming soon" tail names the next types on Ed's roadmap. Names only —
 * no icons/descriptions in the picker. Add a type by adding a spec (the picker,
 * union form, and store id-space all follow).
 */
const REVIEW_TYPES: ReviewTypeSpec[] = [
  {
    id: "technical",
    label: "Technical",
    status: "live",
    propertyBased: true,
    locked: true,
    defaultOn: true,
    fieldGroups: ["identity", "technical"],
  },
  {
    id: "administrative",
    label: "Administrative",
    status: "live",
    propertyBased: true,
    fieldGroups: ["identity", "administrative"],
  },
  {
    id: "evaluation",
    label: "Evaluation",
    status: "soon",
    propertyBased: true,
    fieldGroups: ["identity"],
  },
  {
    id: "vendor_short",
    label: "Vendor short form",
    status: "soon",
    propertyBased: false,
    fieldGroups: [],
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
 * round. You pick what to review (name-only pills — Technical locked-on,
 * Administrative a toggle, a couple "coming soon"); the form below is the union
 * of the selected types' field groups — shared Property identity once, plus a
 * per-type setup section that fades in. Lean scope: identity + type + checklist
 * only; assignee/due/priority stay in the heavier Order flow.
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
    opts?: { checklistId?: string | null },
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

  // Selected *live* types (Technical locked-on by default).
  const [selected, setSelected] = useState<RunReviewType[]>(
    REVIEW_TYPES.filter((s) => s.status === "live" && (s.locked || s.defaultOn)).map((s) => s.id),
  );

  // Compliance checklist pick (Administrative). Null falls back to org-default.
  const defaultChecklist = checklists.find((c) => c.isDefault) ?? checklists[0];
  const [checklistId, setChecklistId] = useState<string | null>(null);
  const effectiveChecklistId = checklistId ?? defaultChecklist?.id ?? null;

  // Optional bank policy doc (the fine-tuning context banks supply). Cosmetic.
  const [policyDoc, setPolicyDoc] = useState<{ name: string; size: number } | null>(null);
  const onPolicyPick = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) setPolicyDoc({ name: f.name, size: f.size });
    e.target.value = ""; // allow re-picking the same file
  };

  const isSel = (id: RunReviewType) => selected.includes(id);
  const toggle = (spec: ReviewTypeSpec) => {
    if (spec.locked || spec.status !== "live") return;
    setSelected((prev) =>
      prev.includes(spec.id) ? prev.filter((x) => x !== spec.id) : [...prev, spec.id],
    );
  };

  // The form's field groups = union across the selected types.
  const selectedSpecs = REVIEW_TYPES.filter((s) => selected.includes(s.id));
  const showIdentity = selectedSpecs.some((s) => s.fieldGroups.includes("identity"));
  const showTechnical = isSel("technical");
  const showAdmin = isSel("administrative");

  // Technical config = the inherited org workbook layout for this property's profile
  // (read-only here; authored in Templates) — same model as the Order flow.
  const layout = inheritedLayout(layouts, profileFor(propertyType));

  const canStart = !showIdentity || address.trim().length > 0;

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
      { checklistId: showAdmin ? effectiveChecklistId : null },
    );
  };

  return (
    <div className="run-cf scroll">
      <motion.div className="run-cf-inner" variants={WRAP_V} initial="hidden" animate="show">
        <motion.div className="run-cf-head" variants={ITEM_V}>
          <h2 className="run-cf-title">{yc ? "Confirm & set up the review" : "Set up this review"}</h2>
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
          <span className="run-cf-card-head">What do you want to review?</span>
          <div className="run-cf-opts">
            {REVIEW_TYPES.map((spec) => {
              const soon = spec.status === "soon";
              const on = !soon && isSel(spec.id);
              const cls = `run-cf-opt${on ? " is-on" : ""}${
                spec.locked ? " is-locked" : ""
              }${soon ? " is-soon" : ""}`;
              const body = (
                <>
                  <span className="run-cf-opt-box" aria-hidden="true">
                    {on && <Icon name="check" size={14} />}
                  </span>
                  <span className="run-cf-opt-label">
                    {spec.label}
                    {soon && <span className="run-cf-opt-soon">(coming soon)</span>}
                  </span>
                  {spec.locked && <span className="run-cf-opt-tag">Always included</span>}
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
                  aria-disabled={spec.locked || undefined}
                  onClick={() => toggle(spec)}
                >
                  {body}
                </button>
              );
            })}
          </div>
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

        {/* Card — technical review setup. */}
        {showTechnical && (
          <motion.div className="run-cf-card" variants={ITEM_V}>
            <span className="run-cf-card-head">Technical review setup</span>
            <div className="field">
              <span>Workbook layout</span>
              <div className="run-cf-inh">
                <span className="run-cf-inh-ic">
                  <Icon name="book" size={18} />
                </span>
                <div className="run-cf-inh-body">
                  <span className="run-cf-inh-val">{layout?.name ?? "Org default"}</span>
                  <span className="run-cf-inh-meta">
                    From the {profileFor(propertyType)} profile · authored in Templates
                  </span>
                </div>
                <span className="run-cf-inh-badge">Inherited</span>
              </div>
            </div>
          </motion.div>
        )}

        {/* Card — administrative setup (fades in when selected). */}
        <AnimatePresence initial={false}>
          {showAdmin && (
            <motion.div
              key="admin-setup"
              className="run-cf-card"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.24, ease: "easeOut" }}
              style={{ overflow: "hidden" }}
            >
              <span className="run-cf-card-head">Administrative review setup</span>
              <label className="field">
                <span>Compliance checklist</span>
                <select
                  value={effectiveChecklistId ?? ""}
                  onChange={(e) => setChecklistId(e.target.value || null)}
                >
                  {checklists.length === 0 && <option value="">Org default</option>}
                  {checklists.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                      {c.isDefault ? " (default)" : ""}
                    </option>
                  ))}
                </select>
              </label>
              <div className="field">
                <span>Bank policy document (optional)</span>
                {policyDoc ? (
                  <div className="run-cf-file-row">
                    <span className="run-cf-ic run-cf-ic--file" aria-hidden="true">
                      <Icon name="pdf" size={18} />
                    </span>
                    <span className="run-cf-file-row-info">
                      <span className="run-cf-file-row-name">{policyDoc.name}</span>
                      <span className="run-cf-file-row-size">{formatBytes(policyDoc.size)}</span>
                    </span>
                    <span className="run-cf-file-row-act">
                      <label className="run-cf-file-act">
                        Replace
                        <input type="file" hidden onChange={onPolicyPick} />
                      </label>
                      <button
                        type="button"
                        className="run-cf-file-act run-cf-file-act--remove"
                        onClick={() => setPolicyDoc(null)}
                      >
                        Remove
                      </button>
                    </span>
                  </div>
                ) : (
                  <label className="run-cf-upload">
                    <input type="file" hidden onChange={onPolicyPick} />
                    <Icon name="upload" size={20} />
                    <span className="run-cf-upload-label">Upload document</span>
                    <span className="run-cf-upload-hint">PDF or DOCX</span>
                  </label>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div className="run-cf-foot" variants={ITEM_V}>
          <Button variant="ghost" size="sm" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            iconLeft="rocket"
            disabled={!canStart}
            onClick={start}
          >
            Start review
          </Button>
        </motion.div>
      </motion.div>
    </div>
  );
}
