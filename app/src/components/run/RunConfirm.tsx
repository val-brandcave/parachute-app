"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Button, Icon, YouConnectGlyph } from "@/components/atoms";
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
 * extracted before the review runs. Full-page (no side nav, like Progress); a
 * single centered card. Nothing is required (fields are pre-filled), so the
 * happy path is one click to Start. Drop reads "review & correct"; a YouConnect
 * delivery reads "confirm & run". Technical is the built review type;
 * Administrative is an optional capture for later.
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
  onStart: (display: RunDisplay, types: RunReviewType[]) => void;
  onCancel: () => void;
}) {
  const yc = source === "yc";

  const [address, setAddress] = useState(review.propertyAddress ?? "");
  const [propertyType, setPropertyType] = useState(review.propertyType ?? PROP_TYPES[0]);
  const [bank, setBank] = useState(review.bank ?? "");
  const [loanNo, setLoanNo] = useState(review.loanNo ?? "");
  const [firm, setFirm] = useState(review.appraisalFirm ?? "");
  const [admin, setAdmin] = useState(false);

  const canStart = address.trim().length > 0;

  const start = () => {
    if (!canStart) return;
    const types: RunReviewType[] = admin ? ["technical", "administrative"] : ["technical"];
    onStart(
      {
        address: address.trim(),
        propertyType,
        bank: bank.trim(),
        loanNo: loanNo.trim(),
        firm: firm.trim(),
      },
      types,
    );
  };

  return (
    <div className="run-cf scroll">
      <motion.div className="run-cf-inner" variants={WRAP_V} initial="hidden" animate="show">
        <motion.div className="run-cf-head" variants={ITEM_V}>
          <h2 className="run-cf-title">
            {yc ? "Confirm the details" : "Confirm appraisal details"}
          </h2>
          <p className="run-cf-sub">
            {yc
              ? "Pulled from YouConnect — confirm and run the review."
              : "Review the auto-filled values, then start the review."}
          </p>
        </motion.div>

        <motion.div className="run-cf-card" variants={ITEM_V}>
          <div className="run-cf-filebar">
            <span className="run-cf-file">
              <Icon name="pdf" size={18} />
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
          </div>

          <p className="run-cf-note">
            {yc ? (
              <>
                <Icon name="connect" size={14} /> Delivered from YouConnect — verify the details
                below, then run.
              </>
            ) : (
              <>
                <Icon name="ai" size={14} /> Auto-filled from the appraisal — review and correct
                before continuing.
              </>
            )}
          </p>

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

          <div className="run-cf-types">
            <span className="run-cf-types-label">Review type</span>
            <div className="run-cf-types-opts">
              <span
                className="run-cf-type on run-cf-type--locked"
                role="checkbox"
                aria-checked="true"
                aria-disabled="true"
                title="Technical review is always included"
              >
                <Icon name="reviews" size={16} />
                <span className="run-cf-type-text">
                  Technical
                  <span className="run-cf-type-sub">Appraisal quality &amp; methodology</span>
                </span>
                <span className="run-cf-check" aria-hidden="true">
                  <Icon name="check" size={13} />
                </span>
              </span>
              <button
                type="button"
                className={`run-cf-type${admin ? " on" : ""}`}
                role="checkbox"
                aria-checked={admin}
                onClick={() => setAdmin((v) => !v)}
              >
                <Icon name="checklist" size={16} />
                <span className="run-cf-type-text">
                  Administrative
                  <span className="run-cf-type-sub">Compliance checklist &amp; attestations</span>
                </span>
                <span className="run-cf-check" aria-hidden="true">
                  <Icon name="check" size={13} />
                </span>
              </button>
            </div>
            {admin && (
              <p className="run-cf-types-hint">
                <Icon name="info" size={13} /> Technical runs now; the Administrative workspace is
                coming soon — your selection is saved on the review.
              </p>
            )}
          </div>

          <div className="run-cf-foot">
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
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
