"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Icon, IconButton, type IconName } from "@/components/atoms";
import { Tabs, StatusPill } from "@/components/molecules";
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
import { RunTriage } from "./RunTriage";
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

/** What "Start review" does at the confirm gate. Provided by the mount so the
 *  routed intake review (advance in place) and the transient overlay (create a
 *  review + route to it) can diverge without RunExperience knowing which it is. */
export type RunStartHandler = (
  display: RunDisplay,
  types: RunReviewType[],
  opts?: { checklistId?: string | null; layoutId?: string | null },
) => void;

/**
 * The review wizard — the S-E → S-A → S-B flow plus the auto-rejected triage gate.
 * Mount-agnostic: it reads its run state from `useRunStore` and takes the two
 * mount-specific behaviours as props (`onExit`, `onStart`). It renders the CONTENTS
 * of the `.run` takeover (head bar + spoke stages + sign modal); the container
 * (`.run`) is supplied by the mount — the global overlay (`RunModal`) for the
 * transient drop/YC-confirm gate and the embedded YC session, and the
 * `/reviews/[id]` page for existing reviews.
 */
export function RunExperience({
  reviewId,
  onExit,
  onStart,
  onTriageReject,
}: {
  reviewId: string;
  /** Close / after-all-signed destination (overlay: close ± return to YouConnect;
   *  route: back to the queue). */
  onExit: () => void;
  /** Commit the confirm gate + begin the run. */
  onStart: RunStartHandler;
  /** Confirm the auto-reject and leave the triage gate (route: back to the queue). */
  onTriageReject?: () => void;
}) {
  const {
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
    layoutId,
    readOnly,
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
  const baseReview = useReview(reviewId);

  // Overlay the confirmed/real identity on the loaded review so the picked
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
  // Which review type's surface is showing. Only meaningful when MULTIPLE types
  // were ordered (any single type — Technical OR Administrative — renders alone,
  // no tabs). Kept local — the store just owns the ordered set + sign status.
  const [activeType, setActiveType] = useState<RunReviewType>("technical");
  // Admin sub-view (its own rail: Preview home + Attestations), parallel to the
  // Technical `spoke`. Local — the store owns the ordered set + sign status.
  const [adminSpoke, setAdminSpoke] = useState<"attestation" | "checklist">("attestation");
  // Cite deep-link targets (2c): a p.X on either document routes to that
  // track's Source view focused on the cited span; the view consumes it.
  const [exFocusId, setExFocusId] = useState<string | null>(null);
  const [attFocusId, setAttFocusId] = useState<string | null>(null);

  const twoType = reviewTypes.length > 1;
  const adminOrdered = reviewTypes.includes("administrative");
  // A single-type run shows THAT type's surface with no tab bar (an admin-only
  // order lands straight on the attestation); `activeType` only steers the tabs
  // of a multi-type run, so stale values from a previous run can't leak in.
  const effectiveType: RunReviewType = twoType ? activeType : (reviewTypes[0] ?? "technical");
  // Admin processing is DERIVED (no state to reset): a two-type run is processing
  // its Administrative side from the moment it lands in the review view until
  // readiness flips. Drives the Admin tab's live spinner whether the reviewer is
  // watching it (in-tab animation) or it's pre-processing in the background.
  const adminProcessing =
    adminOrdered &&
    twoType &&
    !adminReady &&
    (spoke === "workbook" || spoke === "exceptions");
  const allSigned = reviewTypes.every((t) => signedTypes.includes(t));

  // Load the review's findings/exhibits + supporting data when the flow opens.
  useEffect(() => {
    if (reviewId) loadReview(reviewId);
  }, [reviewId, loadReview]);
  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);
  useEffect(() => {
    if (!users.length) fetchUsers();
  }, [users.length, fetchUsers]);
  // Load the Administrative attestation data when that type is ordered.
  useEffect(() => {
    if (reviewId && adminOrdered) loadAdmin(reviewId);
  }, [reviewId, adminOrdered, loadAdmin]);

  // Administrative processing starts AUTOMATICALLY on arrival in the review
  // view (Jul 2 — it must not wait for the Admin tab click; the tab's spinner
  // narrates the background run). Two-type runs: a ONE-SHOT 6.2s timer flips
  // `adminReady` + stamps the initial compile — kept in a ref (no
  // effect-cleanup) so it isn't restarted on re-render; cleared on unmount.
  // ADMIN-ONLY runs: the initial pipeline progress IS the processing beat —
  // arrive on the attestation compiled and ready, no second loader.
  const adminTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!adminOrdered || adminReady) return;
    if (spoke !== "workbook" && spoke !== "exceptions") return; // pipeline still playing
    if (!twoType) {
      setAdminReady(true);
      markAttCompiled();
      return;
    }
    if (effectiveType === "administrative") {
      if (adminTimerRef.current) {
        clearTimeout(adminTimerRef.current);
        adminTimerRef.current = null;
      }
      return;
    }
    if (adminTimerRef.current) return;
    adminTimerRef.current = setTimeout(() => {
      adminTimerRef.current = null;
      setAdminReady(true);
      markAttCompiled();
    }, 6200);
  }, [adminOrdered, adminReady, twoType, spoke, effectiveType, setAdminReady, markAttCompiled]);
  const handleAdminDone = useCallback(() => {
    setAdminReady(true);
    markAttCompiled();
  }, [setAdminReady, markAttCompiled]);
  useEffect(
    () => () => {
      if (adminTimerRef.current) {
        clearTimeout(adminTimerRef.current);
        adminTimerRef.current = null;
      }
    },
    [],
  );

  // The layout that seeds the workbook: a per-review override (chosen at the
  // confirm gate) wins over the profile-inherited org default.
  const layout = useMemo(() => {
    if (!review) return undefined;
    const override = layoutId ? layouts.find((l) => l.id === layoutId) : undefined;
    return override ?? inheritedLayout(layouts, profileFor(review.propertyType));
  }, [layouts, review, layoutId]);

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
  const lowConfidenceCount = findings.filter(
    (f) =>
      (states[f.id]?.disposition ?? "pending") === "pending" &&
      (f.confidence < LOW_CONFIDENCE || f.severity === "crit" || f.severity === "fail"),
  ).length;

  // A completed review opens already-signed (read-only). Stamp a synthetic FINAL
  // seal on both tracks so the workbook + attestation render their sealed state
  // (Download, no CTA) without a live signing pass. Prototype: the sha is derived
  // from the review id; the timestamp is the order date (no impure Date.now()).
  useEffect(() => {
    if (!readOnly || !review) return;
    let cancelled = false;
    const at = review.orderedAt ?? review.slaDueAt;
    (async () => {
      if (!signature && workbook) {
        const sha = await sha256Hex(`final:tech:${review.id}`);
        if (!cancelled)
          signWorkbook({ name: reviewerName, designation: CURRENT_USER.designation, at, sha });
      }
      if (adminOrdered && !attSignature) {
        const sha = await sha256Hex(`final:admin:${review.id}`);
        if (!cancelled)
          signAttestation({ name: reviewerName, designation: CURRENT_USER.designation, at, sha });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [
    readOnly,
    review,
    workbook,
    signature,
    attSignature,
    adminOrdered,
    reviewerName,
    signWorkbook,
    signAttestation,
  ]);

  const ctx: RunContext = {
    reviewId,
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
    signType("technical");
    setSigning(false);
  };

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

  const onClose = () => {
    setSignOpen(false);
    onExit();
  };

  const pendingType = reviewTypes.find((t) => !signedTypes.includes(t));
  const pendingTypeLabel = pendingType ? TYPE_LABEL[pendingType] : null;
  const nextPendingType = reviewTypes.find(
    (t) => t !== effectiveType && !signedTypes.includes(t),
  );
  const signNextType = nextPendingType
    ? {
        label: TYPE_LABEL[nextPendingType],
        processing: nextPendingType === "administrative" && adminProcessing,
      }
    : null;

  const attPending = attRows.filter((r) => !attStates[r.itemId]?.confirmed).length;

  const typeStatus = (t: RunReviewType) => {
    if (signedTypes.includes(t))
      return (
        <StatusPill bare icon="check-circle" indicatorTone="pass">
          Signed
        </StatusPill>
      );
    if (t === "administrative" && adminProcessing)
      return (
        <StatusPill bare spinner indicatorTone="info">
          Processing
        </StatusPill>
      );
    return (
      <StatusPill bare dot indicatorTone="accent">
        Ready to review
      </StatusPill>
    );
  };

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
        blockedNote: `${attPending} item${attPending === 1 ? "" : "s"} still need attesting — answer them right on the attestation before signing.`,
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
        blockedNote: `${ctx.pendingCount} finding${ctx.pendingCount === 1 ? "" : "s"} still need a decision — decide them right in the workbook before signing.`,
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
  // reviewer completes it. Once all are signed, hand off to the mount's onExit.
  const finishReturn = () => {
    setSignOpen(false);
    if (!allSigned) {
      if (pendingType) setActiveType(pendingType);
      go("workbook");
      return;
    }
    onExit();
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement;
      if (el?.tagName === "INPUT" || el?.tagName === "TEXTAREA" || el?.isContentEditable)
        return;
      if (document.querySelector(".ui-menu-pop")) return;
      if (e.key === "Escape" && spoke !== "progress") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spoke]);

  const title = review?.propertyAddress ?? "New review";
  const sub = review
    ? [review.propertyType, review.bank, review.loanNo && `Loan #${review.loanNo}`]
        .filter(Boolean)
        .join(" · ")
    : docLabel ?? "";

  return (
    <>
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
          key={
            spoke === "triage"
              ? "triage"
              : spoke === "confirm"
                ? "confirm"
                : spoke === "progress"
                  ? "progress"
                  : "review"
          }
          className="run-stage"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.24, ease: "easeOut" }}
        >
          {spoke === "triage" && review && (
            <RunTriage
              review={review}
              onReject={onTriageReject ?? onExit}
              onOverride={() => go("confirm")}
            />
          )}

          {spoke === "confirm" && review && (
            <RunConfirm
              review={review}
              docLabel={docLabel}
              source={source}
              onStart={onStart}
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
                      trailing: typeStatus(t),
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
                        { key: "exceptions", label: "Source", icon: "pdf" },
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
                          onOpenCite={(id) => {
                            setExFocusId(id);
                            go("exceptions");
                          }}
                          onReturn={finishReturn}
                        />
                      )}
                      {spoke === "exceptions" && review && (
                        <RunExceptions
                          review={review}
                          reviewType="technical"
                          focusFindingId={exFocusId}
                          onFocusConsumed={() => setExFocusId(null)}
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
                        <RunAdminProgress onDone={handleAdminDone} />
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
                              { key: "checklist", label: "Source", icon: "pdf" },
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
                              onOpenSource={(id) => {
                                setAttFocusId(id);
                                setAdminSpoke("checklist");
                              }}
                              onSign={() => setSignOpen(true)}
                              onReturn={finishReturn}
                            />
                          )}
                          {adminSpoke === "checklist" && review && (
                            <RunAttestations
                              review={review}
                              reviewType="administrative"
                              focusItemId={attFocusId}
                              onFocusConsumed={() => setAttFocusId(null)}
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
        nextType={signNextType}
        onGoToNext={finishReturn}
        {...signConfig}
      />
    </>
  );
}

/* ------------------------------- Sidebar nav ------------------------------ */

/** Left sidebar — the active track's destinations. Generic over the sub-view key
 *  so both tracks share one rail; badges/disabled are computed by the caller. */
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

/* ----------------------------- S-E · Progress ----------------------------- */

const STAGE_COPY: Record<string, string> = {
  Checklist: "Running the compliance checklist",
  Validation: "Validating the appraisal data",
  Consistency: "Checking internal consistency",
  Analytics: "Analyzing valuation & market",
  Policy: "Applying lender policy",
};
const RUN_STAGES = PIPELINE_STAGES.map((s) => STAGE_COPY[s] ?? s);

const STAGE_MS = 1500;

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
 * that fill one after another, then auto-advances to the workbook.
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
