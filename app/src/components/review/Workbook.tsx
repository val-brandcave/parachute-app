"use client";

import { useEffect, useMemo, useState } from "react";
import { Button, Icon, Modal } from "@/components/atoms";
import { useWorkspaceStore, useTemplatesStore, useUsersStore } from "@/store";
import { useReview } from "@/store/useReview";
import { CURRENT_USER } from "@/lib/current-user";
import { publishedVersion } from "@/lib/template-versions";
import {
  RECOMMENDATION_META,
  RISK_META,
  WB_THEMES,
  WB_FONTS,
  type RiskRating,
  recommendation as deriveRecommendation,
  inheritedLayout,
  profileFor,
  sha256Hex,
} from "@/lib/workbook";
import { WorkbookPreview } from "./WorkbookPreview";

/**
 * Workbook sub-view of the Technical tab — the clean compiled document plus its
 * DRAFT → Sign → Complete/Return lifecycle. Layout/section authoring lives in the
 * separate **Builder** sub-view (the "Customize layout" button jumps there); this
 * surface is read + sign + file only. Everything the doc shows derives from the
 * workspace store, themed from the inherited org WorkbookLayout.
 */
export function Workbook({
  reviewId,
  onCustomize,
}: {
  reviewId: string;
  onCustomize?: () => void;
}) {
  const {
    findings,
    states,
    exhibits,
    isLoading,
    loadReview,
    signature,
    filing,
    signWorkbook,
    fileWorkbook,
    returnWorkbook,
    reopenWorkbook,
  } = useWorkspaceStore();
  const layouts = useTemplatesStore((s) => s.layouts);
  const fetchTemplates = useTemplatesStore((s) => s.fetchTemplates);
  const { users, fetchUsers, byId } = useUsersStore();
  const review = useReview(reviewId);

  const [signOpen, setSignOpen] = useState(false);
  const [signing, setSigning] = useState(false);

  useEffect(() => {
    if (reviewId) loadReview(reviewId);
  }, [reviewId, loadReview]);
  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);
  useEffect(() => {
    if (!users.length) fetchUsers();
  }, [users.length, fetchUsers]);

  const layout = useMemo(
    () => (review ? inheritedLayout(layouts, profileFor(review.propertyType)) : undefined),
    [layouts, review],
  );
  const layoutTheme = layout ? publishedVersion(layout.versions)?.theme : undefined;
  const theme = layoutTheme && WB_THEMES[layoutTheme] ? layoutTheme : "Navy";
  const accent = WB_THEMES[theme].accent;
  const headingFont = WB_FONTS.display.stack;

  const risk: RiskRating = review?.riskRating ?? "moderate";
  const recommendation = deriveRecommendation(findings, states);
  const pendingCount = findings.filter(
    (f) => (states[f.id]?.disposition ?? "pending") === "pending",
  ).length;

  const reviewerName =
    (review && byId(review.assigneeId)?.signatureName) || CURRENT_USER.signatureName;

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
    setSignOpen(false);
  };

  if ((isLoading && !findings.length) || !review) {
    return <div className="fm-state text-secondary">Loading workbook…</div>;
  }
  if (review.status === "running" || review.status === "intake" || review.status === "autorejected") {
    return (
      <div className="fm-state">
        <div className="fm-state-card">
          <div className="fm-state-icon fm-state-icon--run">
            <Icon name="document" size={24} />
          </div>
          <h3>Workbook not ready yet</h3>
          <p>
            The compiled workbook assembles from dispositioned findings. It becomes available once
            the technical pipeline has finished and findings are in review.
          </p>
        </div>
      </div>
    );
  }

  const signed = !!signature;
  const canSign = pendingCount === 0;

  return (
    <div className="wb">
      <div className="wb-bar">
        <Button variant="outline" size="sm" iconLeft="filter" onClick={onCustomize}>
          Customize layout
        </Button>

        <div className="wb-bar-spacer" />

        {!signed ? (
          <>
            {!canSign && (
              <span className="wb-bar-hint">
                <Icon name="clock" size={14} />
                {pendingCount} finding{pendingCount === 1 ? "" : "s"} still need a decision in
                Findings
              </span>
            )}
            <Button
              variant="primary"
              size="sm"
              iconLeft="edit"
              disabled={!canSign}
              onClick={() => setSignOpen(true)}
            >
              Sign workbook
            </Button>
          </>
        ) : !filing ? (
          <>
            <span className="wb-bar-hint wb-bar-hint--ok">
              <Icon name="check-circle" size={14} />
              Signed — choose how to file
            </span>
            <Button variant="ghost" size="sm" iconLeft="undo" onClick={reopenWorkbook}>
              Reopen draft
            </Button>
            <Button variant="outline" size="sm" iconLeft="undo" onClick={returnWorkbook}>
              Return to appraiser
            </Button>
            <Button variant="primary" size="sm" iconLeft="check-circle" onClick={fileWorkbook}>
              Complete &amp; file
            </Button>
          </>
        ) : (
          <Button variant="ghost" size="sm" iconLeft="undo" onClick={reopenWorkbook}>
            Reopen draft
          </Button>
        )}
      </div>

      <div className="wb-stage scroll">
        <WorkbookPreview
          review={review}
          findings={findings}
          states={states}
          exhibits={exhibits}
          recommendation={recommendation}
          risk={risk}
          accent={accent}
          headingFont={headingFont}
          reviewerName={reviewerName}
          reviewedAt={review.orderedAt}
          signature={signature}
          filing={filing}
        />
      </div>

      <Modal open={signOpen} onClose={() => setSignOpen(false)} title="Sign & certify workbook" size="sm">
        <div className="wb-sign">
          <p className="wb-sign-stmt">
            You are certifying this review under USPAP Standard 3. A tamper-evident SHA-256 seal and
            timestamp are applied to the compiled workbook at signature.
          </p>
          <div className="wb-sign-rows">
            <div className="wb-sign-row">
              <span>Recommendation</span>
              <b>{RECOMMENDATION_META[recommendation].label}</b>
            </div>
            <div className="wb-sign-row">
              <span>Risk rating</span>
              <b style={{ color: RISK_META[risk].color }}>{RISK_META[risk].label}</b>
            </div>
            <div className="wb-sign-row">
              <span>Reviewer</span>
              <b>
                {CURRENT_USER.signatureName} · {CURRENT_USER.designation}
              </b>
            </div>
          </div>
          <div className="wb-sign-actions">
            <Button variant="ghost" size="sm" onClick={() => setSignOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              iconLeft="check-circle"
              disabled={signing}
              onClick={doSign}
            >
              {signing ? "Sealing…" : "Sign workbook"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
