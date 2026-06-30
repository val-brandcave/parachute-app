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
  const { open, reviewId, spoke, docLabel, display, go, close } = useRunStore();
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

          {spoke === "progress" ? (
            <RunProgress docLabel={docLabel} onDone={() => go("workbook")} />
          ) : (
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
                {spoke === "exceptions" && (
                  <RunExceptions reviewId={ctx.reviewId} onBack={() => go("workbook")} />
                )}
              </div>
            </div>
          )}

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

      <div className="run-nav-status">
        {signed ? (
          <span className="run-nav-status-line run-nav-status-line--ok">
            <Icon name="check-circle" size={15} /> Signed &amp; sealed
          </span>
        ) : ctx.pendingCount > 0 ? (
          <span className="run-nav-status-line run-nav-status-line--wait">
            <Icon name="clock" size={15} /> {ctx.pendingCount} to review
          </span>
        ) : (
          <span className="run-nav-status-line run-nav-status-line--ok">
            <Icon name="check-circle" size={15} /> Ready to sign
          </span>
        )}
      </div>
    </nav>
  );
}

/* ----------------------------- S-E · Progress ----------------------------- */

const PIPE_STAGES = ["Classify", "Reviewing", "Compile"] as const;

/** Live progress: review is the long stretch, compile a quick final tick.
 *  Auto-advances to the workbook (the 90%-user "land on the workbook" goal). */
function RunProgress({
  docLabel,
  onDone,
}: {
  docLabel: string | null;
  onDone: () => void;
}) {
  const [stage, setStage] = useState(0);

  useEffect(() => {
    const t1 = setTimeout(() => setStage(1), 700);
    const t2 = setTimeout(() => setStage(2), 2400);
    const t3 = setTimeout(() => setStage(3), 3000);
    const done = setTimeout(onDone, 3300);
    return () => [t1, t2, t3, done].forEach(clearTimeout);
  }, [onDone]);

  return (
    <div className="run-progress">
      <div className="run-progress-inner">
        <span className="run-progress-spinner" aria-hidden="true" />
        <h2 className="run-progress-title">Reviewing your appraisal…</h2>
        {docLabel && <p className="run-progress-doc">{docLabel}</p>}

        <div className="run-pipe" role="status" aria-live="polite">
          {PIPE_STAGES.map((label, i) => {
            const state = stage > i ? "done" : stage === i ? "active" : "idle";
            return (
              <div key={label} className={`run-pipe-seg run-pipe-seg--${state}`}>
                {state === "done" ? <Icon name="check" size={14} /> : null}
                {label}
                {state === "active" ? "…" : ""}
              </div>
            );
          })}
        </div>

        <p className="run-progress-note">
          Review is the long stretch (~10–20 min); compile is a quick final tick.
        </p>
        <div className="run-progress-leave">
          <Icon name="bell" size={15} /> We&rsquo;ll notify you when it&rsquo;s ready —
          you can leave.
        </div>
      </div>
    </div>
  );
}
