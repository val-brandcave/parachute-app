"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Icon, IconButton, type IconName } from "@/components/atoms";
import { Tabs } from "@/components/molecules";
import { Logo } from "@/components/Logo";
import { useReview } from "@/store/useReview";
import {
  useRunStore,
  useSessionStore,
  useWorkspaceStore,
  useTemplatesStore,
  useUsersStore,
  useAdminStore,
  type RunDisplay,
  type RunReviewType,
} from "@/store";
import { CURRENT_USER } from "@/lib/current-user";
import {
  type RiskRating,
  type Recommendation,
  recommendation as deriveRecommendation,
  inheritedLayout,
  profileFor,
  sha256Hex,
  RECOMMENDATION_META,
  RISK_META,
} from "@/lib/workbook";
import { defaultWorkbookConfig } from "@/lib/workbook-config";
import { PIPELINE_STAGES } from "@/lib/utils";
import { RunConfirm } from "./RunConfirm";
import { RunWorkbook } from "./RunWorkbook";
import { RunExceptions } from "./RunExceptions";
import { RunSignModal } from "./RunSign";
import { RunAttestations } from "./RunAttestations";
import { RunAttestationPreview } from "./RunAttestationPreview";
import { RunAdminProgress } from "./RunAdminProgress";

/** User-facing labels for the run's review-type tabs (two-type shell). */
const TYPE_LABEL: Record<RunReviewType, string> = {
  technical: "Technical",
  administrative: "Administrative",
  evaluation: "Evaluation",
  vendor_short: "Vendor short-form",
  property_type_tech: "Property-type technical",
  environmental: "Environmental",
  residential: "Residential",
};

/** Confidence below this surfaces a finding as an "exception" worth a look. */
const LOW_CONFIDENCE = 0.85;

/** Shared workbook context, computed once and handed to the views. */
export interface RunContext {
  reviewId: string;
  recommendation: Recommendation;
  risk: RiskRating;
  reviewerName: string;
  pendingCount: number;
  lowConfidenceCount: number;
  ready: boolean;
}

/**
 * The run flow (S-E → S-A → S-B). A full-page takeover opened from the dashboard
 * intake widget (J3) or the YouConnect embedded handoff (J1). A left sidebar holds
 * the two destinations — Workbook (home) and Exceptions; Customize and Sign are
 * actions *on* the workbook (right-docked edit panel + an inline seal block at the
 * document foot), not separate screens. Chrome branches on session mode.
 */
export function RunModal() {
  const router = useRouter();
  const {
    open,
    reviewId,
    spoke,
    docLabel,
    display,
    source,
    reviewTypes,
    signedTypes,
    signType,
    adminReady,
    setAdminReady,
    go,
    close,
    setDisplay,
    setReviewTypes,
    setChecklistId,
  } = useRunStore();
  const loadAdmin = useAdminStore((s) => s.loadAdmin);
  const markAttCompiled = useAdminStore((s) => s.markAttCompiled);
  const signAttestation = useAdminStore((s) => s.signAttestation);
  const attSignature = useAdminStore((s) => s.signature);
  const attChecklistName = useAdminStore((s) => s.checklistName);
  const attChecklistVersion = useAdminStore((s) => s.checklistVersion);
  const attStates = useAdminStore((s) => s.states);
  const attRows = useAdminStore((s) => s.rows);
  const mode = useSessionStore((s) => s.mode);
  const returnLabel = useSessionStore((s) => s.returnLabel);
  const resetSession = useSessionStore((s) => s.reset);
  const embedded = mode === "embedded";

  const {
    findings,
    states,
    isLoading,
    loadReview,
    signature,
    signWorkbook,
    workbook,
    ensureWorkbook,
    exhibits,
  } = useWorkspaceStore();
  const layouts = useTemplatesStore((s) => s.layouts);
  const fetchTemplates = useTemplatesStore((s) => s.fetchTemplates);
  const { users, fetchUsers, byId } = useUsersStore();
  const baseReview = useReview(reviewId ?? "");

  // Overlay the chosen property's identity on the demo review so the picked
  // property carries through the header + workbook (findings stay mock content).
  const review = useMemo(() => {
    if (!baseReview) return undefined;
    if (!display) return baseReview;
    return {
      ...baseReview,
      propertyAddress: display.address,
      propertyType: display.propertyType,
      bank: display.bank,
      loanNo: display.loanNo,
      appraisalFirm: display.firm,
    };
  }, [baseReview, display]);

  const [signing, setSigning] = useState(false);
  const [signOpen, setSignOpen] = useState(false);
  // Which review type's surface is showing. Only meaningful when both types were
  // ordered (Technical is always present + the built path; Administrative is the
  // stub). Kept local — the store just owns the ordered set + sign status.
  const [activeType, setActiveType] = useState<RunReviewType>("technical");
  // Admin sub-view (its own rail: Preview home + Attestations), parallel to the
  // Technical `spoke`. Local — the store owns the ordered set + sign status.
  const [adminSpoke, setAdminSpoke] = useState<"attestation" | "checklist">("attestation");
  // Admin processing kicks off the FIRST time the reviewer opens the Admin tab
  // (prototype: so they watch it run), not in the background. `adminStarted`
  // drives the tab's live indicator (pending → processing).
  const [adminStarted, setAdminStarted] = useState(false);

  const twoType = reviewTypes.length > 1;
  const adminOrdered = reviewTypes.includes("administrative");
  // A single-type run always shows Technical, regardless of any stale `activeType`
  // left over from a previous two-type run (RunModal is always mounted).
  const effectiveType: RunReviewType = twoType ? activeType : "technical";
  const allSigned = reviewTypes.every((t) => signedTypes.includes(t));

  // Load the review's findings/exhibits + supporting data when the flow opens.
  useEffect(() => {
    if (open && reviewId) loadReview(reviewId);
  }, [open, reviewId, loadReview]);
  useEffect(() => {
    if (open) fetchTemplates();
  }, [open, fetchTemplates]);
  useEffect(() => {
    if (open && !users.length) fetchUsers();
  }, [open, users.length, fetchUsers]);
  // Load the Administrative attestation data when that type is ordered.
  useEffect(() => {
    if (open && reviewId && adminOrdered) loadAdmin(reviewId);
  }, [open, reviewId, adminOrdered, loadAdmin]);

  // Administrative processing starts a ONE-SHOT timer the first time the reviewer
  // opens the Admin tab (prototype: so the process + state change are visible),
  // flipping `adminReady` + stamping the initial compile. Kept in a ref (no
  // effect-cleanup) so it isn't restarted on re-render; cleared on close.
  const adminTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!open || !adminOrdered || adminReady) return;
    if (activeType !== "administrative") return; // only once the Admin tab is entered
    if (adminTimerRef.current) return;
    setAdminStarted(true);
    adminTimerRef.current = setTimeout(() => {
      adminTimerRef.current = null;
      setAdminReady(true);
      markAttCompiled();
    }, 6200);
  }, [open, adminOrdered, adminReady, activeType, setAdminReady, markAttCompiled]);
  useEffect(() => {
    if (!open && adminTimerRef.current) {
      clearTimeout(adminTimerRef.current);
      adminTimerRef.current = null;
    }
  }, [open]);

  const layout = useMemo(
    () => (review ? inheritedLayout(layouts, profileFor(review.propertyType)) : undefined),
    [layouts, review],
  );

  // Seed the per-review workbook config from the inherited org layout once loaded.
  useEffect(() => {
    if (review && findings.length) {
      ensureWorkbook(defaultWorkbookConfig(layout, findings, exhibits));
    }
  }, [review, findings, exhibits, layout, ensureWorkbook]);

  const recommendation = deriveRecommendation(findings, states);
  const risk: RiskRating = review?.riskRating ?? "moderate";
  const reviewerName =
    (review && byId(review.assigneeId)?.signatureName) || CURRENT_USER.signatureName;
  const pendingCount = findings.filter(
    (f) => (states[f.id]?.disposition ?? "pending") === "pending",
  ).length;
  // Risky items that STILL need a closer look = low-confidence/severe findings the
  // reviewer hasn't dispositioned yet. Once they're all resolved this hits 0 and
  // the "needs a closer look" callout disappears.
  const lowConfidenceCount = findings.filter(
    (f) =>
      (states[f.id]?.disposition ?? "pending") === "pending" &&
      (f.confidence < LOW_CONFIDENCE || f.severity === "crit" || f.severity === "fail"),
  ).length;

  const ctx: RunContext = {
    reviewId: reviewId ?? "",
    recommendation,
    risk,
    reviewerName,
    pendingCount,
    lowConfidenceCount,
    ready: !!review && !!workbook && !isLoading,
  };

  const doSign = async () => {
    if (!review) return;
    setSigning(true);
    const content = JSON.stringify({
      review: review.id,
      recommendation,
      risk,
      findings: findings.map((f) => ({
        id: f.id,
        d: states[f.id]?.disposition,
        r: states[f.id]?.reason ?? states[f.id]?.comment ?? "",
        c: !!states[f.id]?.condition,
      })),
    });
    const sha = await sha256Hex(content);
    signWorkbook({
      name: CURRENT_USER.signatureName,
      designation: CURRENT_USER.designation,
      at: Date.now(),
      sha,
    });
    // The Technical workbook is the surface that signs here; record it at the
    // run level so the two-type gate can resolve.
    signType("technical");
    setSigning(false);
  };

  // Seal the Administrative attestation (SHA-256 over the attested answers) +
  // record it at the run level so the two-type gate can resolve.
  const doSignAttestation = async () => {
    setSigning(true);
    const content = JSON.stringify({
      review: review?.id,
      checklist: `${attChecklistName} v${attChecklistVersion}`,
      answers: attRows.map((r) => ({
        i: r.itemId,
        a: attStates[r.itemId]?.answer,
        c: attStates[r.itemId]?.confirmed,
        r: attStates[r.itemId]?.reason ?? "",
      })),
    });
    const sha = await sha256Hex(content);
    signAttestation({
      name: CURRENT_USER.signatureName,
      designation: CURRENT_USER.designation,
      at: Date.now(),
      sha,
    });
    signType("administrative");
    setSigning(false);
  };

  // Close → standalone returns to the queue (well, just closes); embedded → YouConnect.
  const onClose = () => {
    setSignOpen(false);
    close();
    if (embedded) {
      resetSession();
      router.push("/youconnect");
    }
  };

  // Confirm gate → commit the verified identity + review type(s) + the chosen
  // compliance checklist, then kick off the AI review (S-E progress, which
  // auto-advances to the workbook).
  const startReview = (
    d: RunDisplay,
    types: RunReviewType[],
    opts?: { checklistId?: string | null },
  ) => {
    setDisplay(d);
    setReviewTypes(types);
    setChecklistId(opts?.checklistId ?? null);
    setAdminStarted(false); // fresh run — Admin re-processes on next tab entry
    go("progress");
  };

  const pendingType = reviewTypes.find((t) => !signedTypes.includes(t));
  const pendingTypeLabel = pendingType ? TYPE_LABEL[pendingType] : null;

  // Attestations still pending → the Admin rail badge + Preview gate read from it.
  const attPending = attRows.filter((r) => !attStates[r.itemId]?.confirmed).length;

  // The leading status glyph folded into each review-type tab: a check once
  // signed, else a "living" breathing dot — a faster pulse + halo while that type
  // is processing, a calm slow pulse while pending.
  const typeLeading = (t: RunReviewType) => {
    if (signedTypes.includes(t))
      return <Icon name="check-circle" size={14} className="run-type-ic run-type-ic--done" />;
    const processing = t === "administrative" && adminOrdered && adminStarted && !adminReady;
    return <TypeDot processing={processing} />;
  };

  // Config for the shared sign modal — the active type decides which document is
  // being sealed (workbook vs attestation). Same modal, same type/draw seal.
  const reviewerLine = `${CURRENT_USER.signatureName} · ${CURRENT_USER.designation}`;
  const attAttested = attRows.filter((r) => attStates[r.itemId]?.confirmed).length;
  const attChanged = attRows.filter(
    (r) => attStates[r.itemId]?.confirmed && attStates[r.itemId]?.answer !== r.aiAnswer,
  ).length;
  const signIsAdmin = effectiveType === "administrative";
  const signConfig = signIsAdmin
    ? {
        sealed: !!attSignature,
        signature: attSignature,
        blocked: attPending > 0,
        blockedNote: `${attPending} item${attPending === 1 ? "" : "s"} still need attesting — open the Checklist to finish.`,
        title: "Sign attestation",
        statement: (
          <>
            Signing certifies each checklist answer as your independent professional judgment and
            applies a tamper-evident SHA-256 seal and timestamp — <b>DRAFT → SIGNED</b>.
          </>
        ),
        rows: [
          { label: "Items attested", value: `${attAttested} of ${attRows.length}` },
          { label: "Answers changed", value: `${attChanged} with reason` },
          { label: "Reviewer", value: reviewerLine },
        ],
        sealedTitle: "Attestation signed — SEALED",
        sealedNote: embedded ? (
          <>
            The signed attestation and audit trail have been{" "}
            <b>pushed back to {returnLabel ?? "YouConnect"}</b>.
          </>
        ) : (
          <>
            A tamper-evident SHA-256 seal and timestamp are applied. The attestation is now{" "}
            <b>SIGNED</b>.
          </>
        ),
        signCta: "Sign & seal attestation",
        onSign: doSignAttestation,
      }
    : {
        sealed: !!signature,
        signature,
        blocked: ctx.pendingCount > 0,
        blockedNote: `${ctx.pendingCount} finding${ctx.pendingCount === 1 ? "" : "s"} still need a decision — open Findings to resolve them before signing.`,
        title: "Sign & finalize",
        statement: (
          <>
            Signing certifies this review under USPAP Standard 3 and applies a tamper-evident
            SHA-256 seal and timestamp — <b>DRAFT → FINAL</b>, with the full audit trail.
          </>
        ),
        rows: [
          { label: "Recommendation", value: RECOMMENDATION_META[ctx.recommendation].label },
          {
            label: "Risk rating",
            value: RISK_META[ctx.risk].label,
            valueColor: RISK_META[ctx.risk].color,
          },
          { label: "Reviewer", value: reviewerLine },
        ],
        sealedTitle: "Workbook signed — FINAL",
        sealedNote: embedded ? (
          <>
            The signed workbook and audit trail have been{" "}
            <b>pushed back to {returnLabel ?? "YouConnect"}</b> and attached to the originating
            record.
          </>
        ) : (
          <>
            A tamper-evident SHA-256 seal and timestamp are applied. The workbook is now{" "}
            <b>FINAL</b>.
          </>
        ),
        signCta: "Sign & seal workbook",
        onSign: doSign,
      };

  // Post-sign "finish": gated until EVERY selected review type is signed. If one
  // is still open, don't leave — close the seal and switch to that type so the
  // reviewer completes it. Once all are signed, embedded returns to YouConnect,
  // standalone lands in the queue.
  const finishReturn = () => {
    setSignOpen(false);
    if (!allSigned) {
      if (pendingType) setActiveType(pendingType);
      go("workbook");
      return;
    }
    close();
    if (embedded) {
      resetSession();
      router.push("/youconnect");
    } else {
      router.push("/reviews");
    }
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && spoke !== "progress") onClose();
    };
    if (open) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, spoke]);

  const title = review?.propertyAddress ?? "New review";
  const sub = review
    ? [review.propertyType, review.bank, review.loanNo && `Loan #${review.loanNo}`]
        .filter(Boolean)
        .join(" · ")
    : docLabel ?? "";

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="run"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          transition={{ duration: 0.22, ease: "easeOut" }}
          role="dialog"
          aria-modal="true"
          aria-label="Review run"
        >
          {/* Slim top bar — Parachute mark + property identity + close, persistent. */}
          <header className="run-head">
            <span className="run-head-mark" aria-hidden="true">
              <Logo full={false} themeAware height={24} />
            </span>
            <div className="run-head-id">
              <div className="run-head-title">{title}</div>
              {sub && <div className="run-head-sub">{sub}</div>}
            </div>
            <IconButton name="close" onClick={onClose} aria-label="Close" />
          </header>

          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={spoke === "confirm" ? "confirm" : spoke === "progress" ? "progress" : "review"}
              className="run-stage"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.24, ease: "easeOut" }}
            >
              {spoke === "confirm" && review && (
                <RunConfirm
                  review={review}
                  docLabel={docLabel}
                  source={source}
                  onStart={startReview}
                  onCancel={onClose}
                />
              )}

              {spoke === "progress" && (
                <RunProgress docLabel={docLabel} onDone={() => go("workbook")} />
              )}

              {(spoke === "workbook" || spoke === "exceptions") && (
                <>
                  {twoType && (
                    <div className="run-types">
                      <Tabs
                        tabs={reviewTypes.map((t) => ({
                          value: t,
                          label: TYPE_LABEL[t],
                          leading: typeLeading(t),
                        }))}
                        value={activeType}
                        onChange={(t) => setActiveType(t)}
                      />
                    </div>
                  )}

                  <div className="run-main">
                    {effectiveType === "technical" ? (
                      <>
                        <RunNav
                          items={[
                            { key: "workbook", label: "Workbook", icon: "book" },
                            {
                              key: "exceptions",
                              label: "Findings",
                              icon: "quote",
                              badge:
                                !signature && ctx.pendingCount > 0 ? ctx.pendingCount : null,
                            },
                          ]}
                          active={spoke}
                          onGo={(k) => go(k)}
                          disabled={!ctx.ready}
                        />

                        <div className="run-body">
                          {spoke === "workbook" && review && (
                            <RunWorkbook
                              review={review}
                              ctx={ctx}
                              embedded={embedded}
                              returnLabel={returnLabel}
                              reviewType="technical"
                              canFinish={allSigned}
                              pendingTypeLabel={pendingTypeLabel}
                              onSign={() => setSignOpen(true)}
                              onReviewFindings={() => go("exceptions")}
                              onReturn={finishReturn}
                            />
                          )}
                          {spoke === "exceptions" && review && (
                            <RunExceptions
                              review={review}
                              reviewType="technical"
                              onBack={() => go("workbook")}
                            />
                          )}
                        </div>
                      </>
                    ) : (
                      <AnimatePresence mode="wait" initial={false}>
                        {!adminReady ? (
                          <motion.div
                            key="admin-proc"
                            className="run-body"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                          >
                            <RunAdminProgress />
                          </motion.div>
                        ) : (
                          <motion.div
                            key="admin-ready"
                            className="run-admin-ready"
                            variants={{ hidden: {}, show: { transition: { staggerChildren: 0.08 } } }}
                            initial="hidden"
                            animate="show"
                          >
                            <motion.div
                              className="run-admin-railwrap"
                              variants={{
                                hidden: { x: -24, opacity: 0 },
                                show: {
                                  x: 0,
                                  opacity: 1,
                                  transition: { type: "spring", stiffness: 420, damping: 38 },
                                },
                              }}
                            >
                              <RunNav
                                items={[
                                  { key: "attestation", label: "Attestation", icon: "book" },
                                  {
                                    key: "checklist",
                                    label: "Checklist",
                                    icon: "checklist",
                                    badge:
                                      !signedTypes.includes("administrative") && attPending > 0
                                        ? attPending
                                        : null,
                                  },
                                ]}
                                active={adminSpoke}
                                onGo={(k) => setAdminSpoke(k)}
                              />
                            </motion.div>
                            <motion.div
                              className="run-body"
                              variants={{
                                hidden: { y: 16, opacity: 0 },
                                show: {
                                  y: 0,
                                  opacity: 1,
                                  transition: { duration: 0.34, ease: "easeOut" },
                                },
                              }}
                            >
                              {adminSpoke === "attestation" && review && (
                                <RunAttestationPreview
                                  review={review}
                                  embedded={embedded}
                                  returnLabel={returnLabel}
                                  canFinish={allSigned}
                                  pendingTypeLabel={pendingTypeLabel}
                                  onReviewChecklist={() => setAdminSpoke("checklist")}
                                  onSign={() => setSignOpen(true)}
                                  onReturn={finishReturn}
                                />
                              )}
                              {adminSpoke === "checklist" && review && (
                                <RunAttestations
                                  review={review}
                                  reviewType="administrative"
                                  onBack={() => setAdminSpoke("attestation")}
                                />
                              )}
                            </motion.div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    )}
                  </div>
                </>
              )}
            </motion.div>
          </AnimatePresence>

          <RunSignModal
            open={signOpen}
            embedded={embedded}
            returnLabel={returnLabel}
            signing={signing}
            onClose={() => setSignOpen(false)}
            onReturn={finishReturn}
            {...signConfig}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ------------------------------- Sidebar nav ------------------------------ */

/** Left sidebar — the active track's destinations (Technical: Workbook · Findings;
 *  Administrative: Preview · Attestations). Generic over the sub-view key so both
 *  tracks share one rail; badges/disabled are computed by the caller. Customize &
 *  Sign live on the document itself, so they're not nav items. */
function RunNav<T extends string>({
  items,
  active,
  onGo,
  disabled = false,
}: {
  items: { key: T; label: string; icon: IconName; badge?: number | null }[];
  active: T;
  onGo: (k: T) => void;
  disabled?: boolean;
}) {
  return (
    <nav className="run-nav" aria-label="Run sections">
      <div className="run-nav-items">
        {items.map((item) => {
          const on = item.key === active;
          return (
            <button
              key={item.key}
              className={`run-nav-item${on ? " active" : ""}`}
              onClick={() => !disabled && onGo(item.key)}
              disabled={disabled}
              aria-current={on ? "page" : undefined}
            >
              {on && (
                <motion.span
                  layoutId="run-nav-pill"
                  className="run-nav-pill"
                  transition={{ type: "spring", stiffness: 520, damping: 42 }}
                />
              )}
              <Icon name={item.icon} size={18} />
              <span className="run-nav-label">{item.label}</span>
              {item.badge != null && <span className="run-nav-badge">{item.badge}</span>}
            </button>
          );
        })}
      </div>
    </nav>
  );
}

/** The tab's living status glyph (F-118) — a breathing dot with an expanding
 *  halo while its review type is processing, a calm slow pulse while pending.
 *  Framer keyframe loops; replaces the old static spinner icon. */
function TypeDot({ processing }: { processing: boolean }) {
  return (
    <span className={`run-type-dot${processing ? " is-proc" : ""}`} aria-hidden="true">
      {processing && (
        <motion.span
          className="run-type-halo"
          initial={{ scale: 0.5, opacity: 0.55 }}
          animate={{ scale: [0.5, 1.7], opacity: [0.55, 0] }}
          transition={{ duration: 1.2, repeat: Infinity, ease: "easeOut" }}
        />
      )}
      <motion.span
        className="run-type-core"
        animate={
          processing
            ? { scale: [1, 0.55, 1], opacity: [1, 0.65, 1] }
            : { scale: [1, 0.78, 1], opacity: [0.75, 0.45, 0.75] }
        }
        transition={{ duration: processing ? 1.0 : 2.2, repeat: Infinity, ease: "easeInOut" }}
      />
    </span>
  );
}

/* ----------------------------- S-E · Progress ----------------------------- */

/** Friendly, present-tense phrasing for each canonical pipeline stage
 *  (Checklist · Validation · Consistency · Analytics · Policy — `PIPELINE_STAGES`).
 *  Kept as a map keyed off that source so the order/count stay in lockstep. */
const STAGE_COPY: Record<string, string> = {
  Checklist: "Running the compliance checklist",
  Validation: "Validating the appraisal data",
  Consistency: "Checking internal consistency",
  Analytics: "Analyzing valuation & market",
  Policy: "Applying lender policy",
};
const RUN_STAGES = PIPELINE_STAGES.map((s) => STAGE_COPY[s] ?? s);

/** Per-stage dwell (ms). Relaxed pacing — the active stage's bar fills over this
 *  window before the next takes over; total ≈ 5 × this + a beat, then onDone. */
const STAGE_MS = 1500;

/** Staggered reveal for the hero column on mount. */
const RUN_WRAP_V = {
  hidden: {},
  show: { transition: { staggerChildren: 0.09, delayChildren: 0.04 } },
};
const RUN_ITEM_V = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.42, ease: "easeOut" } },
} as const;

/**
 * Live progress (S-E): a scanning-document hero over a card of pipeline stages
 * that fill one after another — each its own progress bar, with a check on
 * completion and a pulsing dot on the active one. Review is the long stretch in
 * production; here it's compressed and auto-advances to the workbook (the
 * 90%-user "land on the workbook" goal). Framer Motion throughout.
 */
function RunProgress({
  docLabel,
  onDone,
}: {
  docLabel: string | null;
  onDone: () => void;
}) {
  const [stage, setStage] = useState(0);

  useEffect(() => {
    const timers = RUN_STAGES.map((_, i) =>
      setTimeout(() => setStage(i + 1), STAGE_MS * (i + 1)),
    );
    const done = setTimeout(onDone, STAGE_MS * RUN_STAGES.length + 700);
    return () => {
      timers.forEach(clearTimeout);
      clearTimeout(done);
    };
  }, [onDone]);

  return (
    <div className="run-progress">
      <motion.div
        className="run-progress-inner"
        variants={RUN_WRAP_V}
        initial="hidden"
        animate="show"
      >
        {/* Scanning-document hero */}
        <motion.div className="run-scan" variants={RUN_ITEM_V} aria-hidden="true">
          <span className="run-scan-glow" />
          <Icon name="scan" size={30} />
          <span className="run-scan-line" />
        </motion.div>

        <motion.h2 className="run-progress-title" variants={RUN_ITEM_V}>
          Reviewing your appraisal…
        </motion.h2>
        {docLabel && (
          <motion.p className="run-progress-doc" variants={RUN_ITEM_V}>
            {docLabel}
          </motion.p>
        )}

        {/* Stage card — each row fills in turn */}
        <motion.div
          className="run-stages"
          variants={RUN_ITEM_V}
          role="status"
          aria-live="polite"
        >
          {RUN_STAGES.map((label, i) => {
            const done = i < stage;
            const active = i === stage;
            const state = done ? "done" : active ? "active" : "idle";
            return (
              <div key={label} className={`run-st run-st--${state}`}>
                <div className="run-st-row">
                  <span className="run-st-label">{label}</span>
                  <span className="run-st-ind">
                    <AnimatePresence initial={false}>
                      {done ? (
                        <motion.span
                          key="done"
                          className="run-st-check"
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0, opacity: 0 }}
                          transition={{ type: "spring", stiffness: 520, damping: 24 }}
                        >
                          <Icon name="check-circle" size={18} />
                        </motion.span>
                      ) : active ? (
                        <motion.span
                          key="active"
                          className="run-st-dot"
                          initial={{ scale: 0.4, opacity: 0 }}
                          animate={{
                            scale: [1, 0.6, 1],
                            opacity: [1, 0.5, 1],
                          }}
                          exit={{ scale: 0, opacity: 0 }}
                          transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
                        />
                      ) : (
                        <motion.span
                          key="idle"
                          className="run-st-ring"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                        />
                      )}
                    </AnimatePresence>
                  </span>
                </div>
                <span className="run-st-bar">
                  <motion.span
                    className="run-st-bar-fill"
                    initial={{ width: "0%" }}
                    animate={{ width: done || active ? "100%" : "0%" }}
                    transition={{
                      duration: active ? STAGE_MS / 1000 : done ? 0.3 : 0.2,
                      ease: active ? "easeInOut" : "easeOut",
                    }}
                  />
                </span>
              </div>
            );
          })}
        </motion.div>

        <motion.div className="run-progress-leave" variants={RUN_ITEM_V}>
          <Icon name="bell" size={15} /> We&rsquo;ll notify you when it&rsquo;s ready —
          you can leave.
        </motion.div>
      </motion.div>
    </div>
  );
}
