"use client";

import { useMemo } from "react";
import { Icon } from "@/components/atoms";
import { SeverityChip } from "@/components/molecules";
import {
  RECOMMENDATION_META,
  RISK_META,
  type Recommendation,
  type RiskRating,
  valueSummary,
  formatMoney,
  formatLongDate,
  dispTag,
  dispositionLine,
  findingsSections,
  aiBasisLine,
  actionItems,
  workbookHeader,
  WORKBOOK_FOOTER,
} from "@/lib/workbook";
import {
  AdjustmentTable,
  PsfBarChart,
  CapRateScale,
  SensitivityHeat,
  SwotGrid,
} from "./WorkbookExhibits";
import type { WorkbookSignature, WorkbookFiling } from "@/store/workspace.store";
import type { Finding, FindingState, Review, WorkbookExhibits } from "@/types";

const BODY_DISPS = ["accepted", "override", "commented", "pending"];

/**
 * The compiled, branded, auditor-facing workbook document (§4.4) — the reviewer's
 * deliverable. Everything DERIVES from the live workspace store: findings grouped
 * into approach sections with their disposition + AI-basis footnote, conditions,
 * a batched return letter, analytical exhibits (tables/charts), sensitivity, SWOT,
 * imported appraisal narrative, and the conclusion's action items. A DRAFT ribbon
 * + watermark sit over the page until signed; the certification block then carries
 * the name / timestamp / SHA-256 seal.
 */
export function WorkbookPreview({
  review,
  findings,
  states,
  exhibits,
  recommendation,
  risk,
  accent,
  headingFont,
  reviewerName,
  reviewedAt,
  signature,
  filing,
}: {
  review: Review;
  findings: Finding[];
  states: Record<string, FindingState>;
  exhibits: WorkbookExhibits | null;
  recommendation: Recommendation;
  risk: RiskRating;
  accent: string;
  headingFont: string;
  reviewerName: string;
  reviewedAt: number;
  signature: WorkbookSignature | null;
  filing: WorkbookFiling | null;
}) {
  const value = useMemo(() => valueSummary(review), [review]);
  const rec = RECOMMENDATION_META[recommendation];
  const riskMeta = RISK_META[risk];

  const disp = (id: string) => states[id]?.disposition ?? "pending";
  const conditions = findings.filter((f) => states[f.id]?.condition);
  const returned = findings.filter((f) => disp(f.id) === "rejected");
  const actions = actionItems(findings, states);
  const bodySections = useMemo(
    () => findingsSections(findings, (f) => BODY_DISPS.includes(disp(f.id))),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [findings, states],
  );

  // Assemble the ordered list of visible sections, then number them (numeric for
  // the body, letters for appendices) so the doc reads like a real workbook.
  const sections: { title: string; appendix?: boolean; node: React.ReactNode }[] = [];

  sections.push({
    title: "Property & Value Summary",
    node: (
      <>
        <div className="wb-facts">
          <Fact label="Concluded Market Value" value={formatMoney(value.concludedValue)} big />
          <Fact label="Effective Date" value={formatLongDate(value.effectiveDate)} />
          <Fact label="Loan Amount" value={formatMoney(value.loanAmount)} />
          <Fact label="Loan-to-Value" value={`${Math.round(value.ltv * 100)}%`} />
          <Fact label="Property Rights" value={value.rights} />
          <Fact label="Property Type" value={review.propertyType} />
        </div>
        <div className="wb-approaches">
          <span className="wb-mini-label">Approaches developed</span>
          <div className="wb-tags">
            {value.approaches.map((a) => (
              <span key={a} className="wb-tag">
                {a}
              </span>
            ))}
          </div>
        </div>
      </>
    ),
  });

  bodySections.forEach((sec) => {
    sections.push({
      title: sec.title,
      node: (
        <>
          {sec.findings.map((f) =>
            disp(f.id) === "pending" ? (
              <OpenPlaceholder key={f.id} f={f} />
            ) : (
              <FindingEntry key={f.id} f={f} state={states[f.id]} />
            ),
          )}
        </>
      ),
    });
  });

  if (exhibits) {
    sections.push({
      title: "Analytical Exhibits",
      node: (
        <>
          <div className="wb-exh-h">Sales comparison adjustment grid</div>
          <AdjustmentTable rows={exhibits.adjustmentGrid} />
          <p className="wb-exh-note" style={{ marginBottom: 14 }}>
            Abbreviated grid — the full grid appears in the appraisal (p.47).
          </p>
          <PsfBarChart psf={exhibits.psf} />
          <CapRateScale cap={exhibits.capRate} />
        </>
      ),
    });
    sections.push({
      title: "Sensitivity Analysis",
      node: <SensitivityHeat sens={exhibits.sensitivity} />,
    });
  }

  if (conditions.length) {
    sections.push({
      title: "Conditions of Approval",
      node: (
        <>
          <p className="wb-prose">
            Approval is recommended subject to the following condition
            {conditions.length === 1 ? "" : "s"} being satisfied prior to funding:
          </p>
          <ol className="wb-conditions">
            {conditions.map((f, i) => (
              <li key={f.id}>
                <span className="wb-cond-id">C{i + 1}</span>
                <div>
                  <div className="wb-cond-text">
                    {states[f.id]?.reason || states[f.id]?.comment || f.question}
                  </div>
                  <div className="wb-cond-src">
                    {f.category} · p.{f.page}
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </>
      ),
    });
  }

  if (returned.length) {
    sections.push({
      title: "Returned to Appraiser",
      node: (
        <>
          <p className="wb-prose">
            The following {returned.length === 1 ? "item is" : `${returned.length} items are`}{" "}
            returned to {review.appraisalFirm} for revision and resubmission:
          </p>
          <ol className="wb-returns">
            {returned.map((f, i) => (
              <li key={f.id}>
                <div className="wb-ret-top">
                  <span className="wb-ret-n">Item {i + 1}</span>
                  <SeverityChip severity={f.severity} />
                  <span className="wb-ret-page">p.{f.page}</span>
                </div>
                <div className="wb-ret-q">{f.question}</div>
                <div className="wb-ret-reason">{dispositionLine(states[f.id])}</div>
              </li>
            ))}
          </ol>
        </>
      ),
    });
  }

  sections.push({
    title: "Conclusion & Action Items",
    node: (
      <>
        <p className="wb-prose">
          Based on the technical review of the appraisal of <b>{review.propertyAddress}</b>{" "}
          prepared by {review.appraisalFirm}, the reviewer&rsquo;s recommendation is{" "}
          <b>{rec.label.toLowerCase()}</b>. {riskMeta.wording}
        </p>
        {actions.length > 0 ? (
          <ol className="wb-actions-list">
            {actions.map((a) => (
              <li key={a.id}>
                <span className="wb-act-id">{a.id}</span>
                <span className="wb-act-text">{a.text}</span>
                <span className="wb-act-due">{a.deadline}</span>
              </li>
            ))}
          </ol>
        ) : (
          <p className="wb-prose wb-muted">
            No outstanding action items — all findings were reconciled without conditions.
          </p>
        )}
      </>
    ),
  });

  if (exhibits) {
    sections.push({
      title: "SWOT Analysis",
      appendix: true,
      node: <SwotGrid swot={exhibits.swot} />,
    });
    if (exhibits.imported.length) {
      sections.push({
        title: "Imported Appraisal Sections",
        appendix: true,
        node: (
          <>
            {exhibits.imported.map((s) => (
              <div key={s.id} className="wb-import">
                <h4 className="wb-import-h">{s.title}</h4>
                <p className="wb-prose">{s.body}</p>
              </div>
            ))}
          </>
        ),
      });
    }
  }

  sections.push({
    title: "Reviewer Certification",
    node: (
      <>
        <p className="wb-prose wb-cert-stmt">
          I certify that I have reviewed the referenced appraisal in accordance with USPAP
          Standard 3 and the policies of {review.bank}, and that the analysis, opinions, and
          conclusions expressed in this review are my own professional judgment.
        </p>
        {signature ? (
          <div className="wb-sig">
            <div className="wb-sig-mark" style={{ fontFamily: headingFont }}>
              {signature.name}
            </div>
            <div className="wb-sig-name">
              {signature.name}
              <span>{signature.designation}</span>
            </div>
            <div className="wb-sig-meta">
              <span>
                <Icon name="check-circle" size={13} /> Signed {formatLongDate(signature.at)}
              </span>
              <span className="wb-sig-sha" title={signature.sha}>
                <Icon name="sso" size={13} /> SHA-256 {signature.sha.slice(0, 16)}…
              </span>
            </div>
          </div>
        ) : (
          <div className="wb-sig wb-sig--empty">
            <div className="wb-sig-line" />
            <div className="wb-sig-pending">
              <Icon name="clock" size={14} /> Awaiting reviewer signature
            </div>
          </div>
        )}
      </>
    ),
  });

  // Number: body sections 1..N, appendices A, B, …
  let num = 0;
  let appx = 0;

  const draft = !signature;

  return (
    <article
      className={`wb-doc${draft ? " is-draft" : ""}`}
      style={{ "--wb-accent": accent, "--wb-head": headingFont } as React.CSSProperties}
    >
      {draft && <div className="wb-ribbon">Draft</div>}
      {filing && (
        <div className={`wb-filebar wb-filebar--${filing}`}>
          <Icon name={filing === "filed" ? "check-circle" : "undo"} size={16} />
          {filing === "filed"
            ? "Filed — workbook delivered to the lender and locked."
            : `Returned to ${review.appraisalFirm} with the revision letter.`}
        </div>
      )}

      {/* running header strip (the org/document header) */}
      <div className="wb-runhead">
        <span className="wb-runhead-org">
          <Icon name="org" size={14} />
          {workbookHeader(review.bank)}
        </span>
        <span className="wb-runhead-doc">Technical Review Workbook</span>
      </div>

      <header className="wb-band">
        <div className="wb-band-eyebrow">Technical Review Workbook</div>
        <div className="wb-band-title" style={{ fontFamily: headingFont }}>
          {review.propertyAddress}
        </div>
        <div className="wb-band-sub">
          {review.propertyType} · Appraisal by {review.appraisalFirm} · Prepared for {review.bank}
        </div>

        <div className="wb-band-bars">
          <div className={`wb-rec-pill wb-rec-pill--${rec.tone}`}>
            <Icon
              name={rec.tone === "pass" ? "check-circle" : rec.tone === "flag" ? "checklist" : "clock"}
              size={17}
            />
            Reviewer recommendation: {rec.label}
            {conditions.length > 0 && rec.tone !== "info" && (
              <span className="wb-rec-count">
                {conditions.length} condition{conditions.length === 1 ? "" : "s"}
              </span>
            )}
          </div>
          <div className="wb-risk-pill" style={{ background: riskMeta.bg, color: riskMeta.color }}>
            <Icon name="info" size={15} />
            <b>Risk: {riskMeta.label.replace(" Risk", "")}</b>
            <span className="wb-risk-word">{riskMeta.wording}</span>
          </div>
        </div>

        <div className="wb-band-meta">
          <Meta label="Loan #" value={review.loanNo} />
          <Meta label="Effective Date" value={formatLongDate(value.effectiveDate)} />
          <Meta label="Reviewer" value={reviewerName} />
          <Meta label="Reviewed" value={formatLongDate(reviewedAt)} />
        </div>
      </header>

      {sections.map((s) => {
        const label = s.appendix
          ? `Appendix ${String.fromCharCode(65 + appx++)}`
          : String(++num);
        return (
          <Section key={s.title} id={s.title} label={label} title={s.title}>
            {s.node}
          </Section>
        );
      })}

      <footer className="wb-foot">{WORKBOOK_FOOTER}</footer>
    </article>
  );
}

/* ---- section + small presentational helpers ---- */

function Section({
  id,
  label,
  title,
  children,
}: {
  id: string;
  label: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="wb-sec" id={`wb-sec-${id.replace(/\s+/g, "-").toLowerCase()}`}>
      <h3 className="wb-sec-h" style={{ fontFamily: "var(--wb-head)" }}>
        <span className="wb-sec-n">{label}</span>
        {title}
      </h3>
      {children}
    </section>
  );
}

function Fact({ label, value, big }: { label: string; value: string; big?: boolean }) {
  return (
    <div className={`wb-fact${big ? " wb-fact--big" : ""}`}>
      <span className="wb-fact-l">{label}</span>
      <span className="wb-fact-v">{value}</span>
    </div>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="wb-meta-item">
      <span className="wb-meta-l">{label}</span>
      <span className="wb-meta-v">{value}</span>
    </div>
  );
}

function FindingEntry({ f, state }: { f: Finding; state: FindingState }) {
  const tag = dispTag(state.disposition);
  return (
    <div className="wb-find">
      <div className="wb-find-top">
        <span className="wb-find-q">{f.question}</span>
        <span className={`wb-tag-disp wb-tag-disp--${tag.tone}`}>
          <Icon
            name={tag.tone === "pass" ? "check-circle" : tag.tone === "fail" ? "x-circle" : "edit"}
            size={12}
          />
          {tag.label}
        </span>
      </div>
      <p className="wb-find-resp">{dispositionLine(state)}</p>
      <div className="wb-find-ai">{aiBasisLine(f)}</div>
    </div>
  );
}

function OpenPlaceholder({ f }: { f: Finding }) {
  return (
    <div className="wb-open">
      <Icon name="clock" size={15} />
      <div>
        <div className="wb-open-q">{f.question}</div>
        <div className="wb-open-meta">
          Open — awaiting reviewer disposition · {f.category} · p.{f.page}
        </div>
      </div>
    </div>
  );
}
