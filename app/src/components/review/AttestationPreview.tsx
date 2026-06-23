"use client";

import { useEffect, useMemo, useState } from "react";
import { Button, Icon, Modal } from "@/components/atoms";
import { ActionMenu } from "@/components/molecules";
import { ReviewActions } from "@/components/review/ReviewChrome";
import {
  useAdminStore,
  useUsersStore,
  attTally,
  type AttestationRow,
  type AttestationSignature,
} from "@/store";
import { useReview } from "@/store/useReview";
import { CURRENT_USER } from "@/lib/current-user";
import { formatLongDate, valueSummary, sha256Hex } from "@/lib/workbook";
import type { AttestationState, AttAnswer, Review } from "@/types";

const ANS_LABEL: Record<AttAnswer, string> = { YES: "Yes", NO: "No", NA: "N/A" };
const ANS_CLASS: Record<AttAnswer, string> = { YES: "yes", NO: "no", NA: "na" };

/**
 * Preview sub-view of the Administrative tab — the compiled, branded,
 * auditor-facing attestation document plus its DRAFT → Sign lifecycle. The
 * Administrative twin of the Workbook: read + sign + export only (the checklist
 * itself is authored org-level in Templates). A DRAFT ribbon sits over the page
 * until signed; signing is gated until every item is attested, then the
 * certification block carries the reviewer's name, timestamp and a real SHA-256
 * seal — the same shell the Workbook uses, so the two deliverables read as
 * siblings.
 */
export function AttestationPreview({ reviewId }: { reviewId: string }) {
  const { rows, states, isLoading, loadAdmin, signature, signAttestation, reopenAttestation } =
    useAdminStore();
  const checklistName = useAdminStore((s) => s.checklistName);
  const checklistVersion = useAdminStore((s) => s.checklistVersion);
  const review = useReview(reviewId);
  const { users, fetchUsers, byId } = useUsersStore();

  const [signOpen, setSignOpen] = useState(false);
  const [signing, setSigning] = useState(false);
  const [exported, setExported] = useState(false);

  useEffect(() => {
    if (reviewId) loadAdmin(reviewId);
  }, [reviewId, loadAdmin]);
  useEffect(() => {
    if (!users.length) fetchUsers();
  }, [users.length, fetchUsers]);

  const t = attTally(states);
  const changed = useMemo(
    () =>
      rows.filter((r) => states[r.itemId]?.confirmed && states[r.itemId]?.answer !== r.aiAnswer)
        .length,
    [rows, states],
  );
  const canSign = rows.length > 0 && t.pending === 0;

  const reviewerName =
    (review && byId(review.assigneeId)?.signatureName) || CURRENT_USER.signatureName;

  const doSign = async () => {
    if (!review) return;
    setSigning(true);
    const content = JSON.stringify({
      review: review.id,
      checklist: `${checklistName} v${checklistVersion}`,
      answers: rows.map((r) => ({
        i: r.itemId,
        a: states[r.itemId]?.answer,
        c: states[r.itemId]?.confirmed,
        r: states[r.itemId]?.reason ?? "",
      })),
    });
    const sha = await sha256Hex(content);
    signAttestation({
      name: CURRENT_USER.signatureName,
      designation: CURRENT_USER.designation,
      at: Date.now(),
      sha,
    });
    setSigning(false);
    setSignOpen(false);
  };

  if ((isLoading && !rows.length) || !review) {
    return <div className="fm-state text-secondary">Loading attestation…</div>;
  }
  if (
    review.status === "running" ||
    review.status === "intake" ||
    review.status === "autorejected"
  ) {
    return (
      <div className="fm-state">
        <div className="fm-state-card">
          <div className="fm-state-icon fm-state-icon--run">
            <Icon name="document" size={24} />
          </div>
          <h3>Attestation not ready yet</h3>
          <p>
            The signed attestation assembles from your confirmed answers. It becomes available once
            the checklist has been pre-filled and items are in review.
          </p>
        </div>
      </div>
    );
  }

  const signed = !!signature;

  return (
    <div className="wb">
      <ReviewActions>
        {!signed ? (
          <>
            {!canSign && (
              <span className="wb-bar-hint">
                <Icon name="clock" size={14} />
                {t.pending} item{t.pending === 1 ? "" : "s"} still need attesting
              </span>
            )}
            <Button
              variant="primary"
              size="sm"
              iconLeft="edit"
              disabled={!canSign}
              onClick={() => setSignOpen(true)}
            >
              Sign attestation
            </Button>
          </>
        ) : (
          <>
            <span className="wb-bar-hint wb-bar-hint--ok">
              <Icon name="check-circle" size={14} />
              Signed &amp; sealed
            </span>
            <Button
              variant="outline"
              size="sm"
              iconLeft={exported ? "check" : "download"}
              onClick={() => setExported(true)}
            >
              {exported ? "Exported (demo)" : "Export PDF"}
            </Button>
            <ActionMenu
              tooltip="More actions"
              items={[{ label: "Reopen draft", icon: "undo", onClick: reopenAttestation }]}
            />
          </>
        )}
      </ReviewActions>

      <div className="wb-stage scroll">
        <AttestationDoc
          review={review}
          rows={rows}
          states={states}
          checklistName={checklistName}
          checklistVersion={checklistVersion}
          reviewerName={reviewerName}
          changed={changed}
          signature={signature}
        />
      </div>

      <Modal
        open={signOpen}
        onClose={() => setSignOpen(false)}
        title="Sign &amp; certify attestation"
        size="sm"
      >
        <div className="wb-sign">
          <p className="wb-sign-stmt">
            You are attesting that each answer reflects your independent professional judgment. A
            tamper-evident SHA-256 seal and timestamp are applied to the attestation at signature.
          </p>
          <div className="wb-sign-rows">
            <div className="wb-sign-row">
              <span>Items attested</span>
              <b>
                {t.attested} of {rows.length}
              </b>
            </div>
            <div className="wb-sign-row">
              <span>Answers changed</span>
              <b>{changed} with documented reason</b>
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
              {signing ? "Sealing…" : "Sign attestation"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

/* ---- the compiled attestation document ---- */

function AttestationDoc({
  review,
  rows,
  states,
  checklistName,
  checklistVersion,
  reviewerName,
  changed,
  signature,
}: {
  review: Review;
  rows: AttestationRow[];
  states: Record<string, AttestationState>;
  checklistName: string | null;
  checklistVersion: number | null;
  reviewerName: string;
  changed: number;
  signature: AttestationSignature | null;
}) {
  const value = useMemo(() => valueSummary(review), [review]);
  const groups = useMemo(() => [...new Set(rows.map((r) => r.group))], [rows]);
  const attested = rows.filter((r) => states[r.itemId]?.confirmed).length;
  const pending = rows.length - attested;
  const draft = !signature;

  let n = 0;

  return (
    <article className={`wb-doc${draft ? " is-draft" : ""}`}>
      {draft && <div className="wb-ribbon">Draft</div>}

      <div className="wb-runhead">
        <span className="wb-runhead-org">
          <Icon name="org" size={14} />
          {review.bank}
        </span>
        <span className="wb-runhead-doc">Administrative Review Attestation</span>
      </div>

      <header className="wb-band">
        <div className="wb-band-eyebrow">Administrative Review Attestation</div>
        <div className="wb-band-title">{review.propertyAddress}</div>
        <div className="wb-band-sub">
          {review.propertyType} · {checklistName ?? "Compliance Checklist"}
          {checklistVersion ? ` v${checklistVersion}` : ""} · AI pre-filled, reviewer attested
        </div>

        <div className="wb-band-bars">
          <div className={`wb-rec-pill wb-rec-pill--${pending ? "info" : "pass"}`}>
            <Icon name={pending ? "clock" : "check-circle"} size={17} />
            {pending
              ? `${pending} item${pending === 1 ? "" : "s"} not yet attested — complete the checklist before signing`
              : `All ${rows.length} items attested`}
            {!pending && changed > 0 && (
              <span className="wb-rec-count">
                {changed} change{changed === 1 ? "" : "s"} with reason
              </span>
            )}
          </div>
        </div>

        <div className="wb-band-meta">
          <Meta label="Loan #" value={review.loanNo} />
          <Meta label="Effective Date" value={formatLongDate(value.effectiveDate)} />
          <Meta label="Reviewer" value={reviewerName} />
          <Meta label="Reviewed" value={formatLongDate(review.orderedAt)} />
        </div>
      </header>

      {groups.map((g) => (
        <section className="wb-sec" key={g}>
          <h3 className="wb-sec-h">
            <span className="wb-sec-n">{g}</span>
          </h3>
          <table className="attdoc-table">
            <thead>
              <tr>
                <th className="attdoc-n">#</th>
                <th>Checklist item</th>
                <th className="attdoc-ans-col">Answer</th>
                <th className="attdoc-cite">Cite</th>
              </tr>
            </thead>
            <tbody>
              {rows
                .filter((r) => r.group === g)
                .map((r) => {
                  const st = states[r.itemId];
                  n += 1;
                  const wasChanged = st?.confirmed && st.answer !== r.aiAnswer;
                  return (
                    <tr key={r.itemId}>
                      <td className="attdoc-n">{n}</td>
                      <td>
                        {r.question}
                        {wasChanged && (
                          <div className="attdoc-changed">
                            <b>Changed from {ANS_LABEL[r.aiAnswer]}</b> — {st?.reason}
                          </div>
                        )}
                      </td>
                      <td className="attdoc-ans-col">
                        {st?.confirmed ? (
                          <b className={`attdoc-ans attdoc-ans--${ANS_CLASS[st.answer]}`}>
                            {ANS_LABEL[st.answer]}
                          </b>
                        ) : (
                          <span className="attdoc-ph">NOT ATTESTED</span>
                        )}
                      </td>
                      <td className="attdoc-cite">{r.page > 0 ? `p.${r.page}` : "—"}</td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </section>
      ))}

      <section className="wb-sec">
        <h3 className="wb-sec-h">
          <span className="wb-sec-n">Reviewer Attestation</span>
        </h3>
        <p className="wb-prose wb-cert-stmt">
          I attest that I have reviewed each item above against the appraisal report, and that the
          answers — including any changes from the AI&rsquo;s suggested answers, each with a
          documented reason — reflect my independent professional judgment.
        </p>
        {signature ? (
          <div className="wb-sig">
            <div className="wb-sig-mark">{signature.name}</div>
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
      </section>
    </article>
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
