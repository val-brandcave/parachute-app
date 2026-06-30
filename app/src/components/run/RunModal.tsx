"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Icon, IconButton } from "@/components/atoms";
import { Logo } from "@/components/Logo";
import { useReview } from "@/store/useReview";
import {
  useRunStore,
  useSessionStore,
  useWorkspaceStore,
  useTemplatesStore,
  useUsersStore,
  type RunSpoke,
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
} from "@/lib/workbook";
import { defaultWorkbookConfig } from "@/lib/workbook-config";
import { PIPELINE_STAGES } from "@/lib/utils";
import { RunConfirm } from "./RunConfirm";
import { RunWorkbook } from "./RunWorkbook";
import { RunExceptions } from "./RunExceptions";
import { RunSignModal } from "./RunSign";

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
  const { open, reviewId, spoke, docLabel, display, source, go, close, setDisplay, setReviewTypes } =
    useRunStore();
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
  const lowConfidenceCount = findings.filter(
    (f) => f.confidence < LOW_CONFIDENCE || f.severity === "crit" || f.severity === "fail",
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
    setSigning(false);
  };

  // Close → standalone returns to the queue (well, just closes); embedded → YouConnect.
  const onClose = () => {
    setSignOpen(false);
    close();
    if (embedded) {
      resetSession();
      router.push("/start");
    }
  };

  // Confirm gate → commit the verified identity + review type, then kick off the
  // AI review (S-E progress, which auto-advances to the workbook).
  const startReview = (d: RunDisplay, types: RunReviewType[]) => {
    setDisplay(d);
    setReviewTypes(types);
    go("progress");
  };

  // Post-sign "finish": embedded returns to YouConnect, standalone lands in the queue.
  const finishReturn = () => {
    setSignOpen(false);
    close();
    if (embedded) {
      resetSession();
      router.push("/start");
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
                <div className="run-main">
                  <RunNav spoke={spoke} ctx={ctx} signed={!!signature} onGo={go} />

                  <div className="run-body">
                    {spoke === "workbook" && review && (
                      <RunWorkbook
                        review={review}
                        ctx={ctx}
                        embedded={embedded}
                        returnLabel={returnLabel}
                        onSign={() => setSignOpen(true)}
                        onReviewFindings={() => go("exceptions")}
                        onReturn={finishReturn}
                      />
                    )}
                    {spoke === "exceptions" && review && (
                      <RunExceptions review={review} onBack={() => go("workbook")} />
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          <RunSignModal
            open={signOpen}
            ctx={ctx}
            embedded={embedded}
            returnLabel={returnLabel}
            signing={signing}
            onSign={doSign}
            onClose={() => setSignOpen(false)}
            onReturn={finishReturn}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ------------------------------- Sidebar nav ------------------------------ */

const NAV_ITEMS: { key: RunSpoke; label: string; icon: "book" | "quote" }[] = [
  { key: "workbook", label: "Workbook", icon: "book" },
  { key: "exceptions", label: "Exceptions", icon: "quote" },
];

/** Left sidebar — the two run destinations + a live status read-out. Customize &
 *  Sign live on the workbook itself, so they're not nav items. */
function RunNav({
  spoke,
  ctx,
  signed,
  onGo,
}: {
  spoke: RunSpoke;
  ctx: RunContext;
  signed: boolean;
  onGo: (s: RunSpoke) => void;
}) {
  const disabled = !ctx.ready;
  return (
    <nav className="run-nav" aria-label="Run sections">
      <div className="run-nav-items">
        {NAV_ITEMS.map((item) => {
          const active = item.key === spoke;
          const badge =
            item.key === "exceptions" && !signed && ctx.pendingCount > 0
              ? ctx.pendingCount
              : null;
          return (
            <button
              key={item.key}
              className={`run-nav-item${active ? " active" : ""}`}
              onClick={() => !disabled && onGo(item.key)}
              disabled={disabled}
              aria-current={active ? "page" : undefined}
            >
              {active && (
                <motion.span
                  layoutId="run-nav-pill"
                  className="run-nav-pill"
                  transition={{ type: "spring", stiffness: 520, damping: 42 }}
                />
              )}
              <Icon name={item.icon} size={18} />
              <span className="run-nav-label">{item.label}</span>
              {badge !== null && <span className="run-nav-badge">{badge}</span>}
            </button>
          );
        })}
      </div>
    </nav>
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
          <motion.span
            className="run-scan-line"
            animate={{ y: [-18, 18, -18] }}
            transition={{ duration: 2.1, ease: "easeInOut", repeat: Infinity }}
          />
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
