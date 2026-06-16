"use client";

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { useReview } from "@/store/useReview";
import { Icon } from "@/components/atoms";

export default function TriagePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const review = useReview(id);
  const [override, setOverride] = useState(false);
  const [reason, setReason] = useState("");

  return (
    <div className="page" style={{ maxWidth: 820 }}>
      <div className="page-head">
        <div>
          <div className="crumb">Intake triage · {review?.bank}</div>
          <h1>{review?.propertyAddress ?? "Review"}</h1>
        </div>
        <span className="chip chip-blocked">Auto-rejected · SLA paused</span>
      </div>

      <div className="card" style={{ padding: 22, marginBottom: 16 }}>
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: 0.6,
            color: "var(--md-error)",
            marginBottom: 8,
          }}
        >
          Failed intake criterion
        </div>
        <div style={{ fontWeight: 600, marginBottom: 6 }}>
          Appraisal certification is unsigned
        </div>
        <div className="f-evidence">
          The certification page (p.8) is present but no appraiser signature or license
          number was detected. Demo Bank&apos;s auto-reject policy returns unsigned reports to
          the appraiser before review.
        </div>
      </div>

      <div className="card" style={{ padding: 22 }}>
        <div style={{ fontWeight: 700, marginBottom: 12 }}>Your call</div>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <button
            className="btn btn-filled"
            onClick={() => router.push("/dashboard")}
          >
            <Icon name="undo" size={18} />
            Confirm &amp; return to appraiser
          </button>
          <button className="btn btn-outline" onClick={() => setOverride((o) => !o)}>
            <Icon name="unlock" size={18} />
            Override &amp; admit to review
          </button>
        </div>

        {override && (
          <div style={{ marginTop: 16 }}>
            <div className="field">
              <label>Reason for override (audited)</label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Document why this report should proceed despite the failed criterion…"
              />
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button
                className="btn btn-filled btn-sm"
                disabled={!reason.trim()}
                onClick={() => router.push(`/reviews/${id}/technical`)}
              >
                Admit &amp; start pipeline
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
