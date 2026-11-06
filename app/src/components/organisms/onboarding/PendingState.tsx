"use client";

import { Button, Icon } from "@/components/atoms";
import { StatusPill } from "@/components/molecules";
import type { Org } from "@/types";

type Status = "done" | "active" | "pending";

const TEAM_LABEL = { "1": "1 reviewer", "2-10": "2–10 reviewers", "11+": "11+ reviewers" } as const;
const VOLUME_LABEL = { lt50: "under 50 reports a month", "50-200": "50–200 reports a month", "200+": "200+ reports a month" } as const;
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function stamp(ms: number): string {
  const d = new Date(ms);
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${hh}:${mm}`;
}

function Stages({ rows }: { rows: { id: string; label: string; detail: string; status: Status }[] }) {
  return (
    <ol className="wel-stages" style={{ listStyle: "none", padding: 0 }}>
      {rows.map((r) => (
        <li key={r.id} className={`wel-stage-row ${r.status}`} aria-current={r.status === "active" ? "step" : undefined}>
          <span className="wel-stage-ic" aria-hidden="true">
            {r.status === "done" && <Icon name="check" size={14} />}
            {r.status === "active" && <Icon name="clock" size={13} />}
          </span>
          <div>
            <div className="wel-stage-lb">
              {r.label}
              <span className="sr-only"> ({r.status})</span>
            </div>
            <div className="wel-stage-detail">{r.detail}</div>
          </div>
        </li>
      ))}
    </ol>
  );
}

/** B3: waiting for staff approval. The sample review stays usable. */
export function PendingState({
  org,
  userName,
  email,
  trialCredits,
  onOpenSample,
  onAddCard,
  onTalk,
}: {
  org: Org;
  userName: string;
  email: string;
  trialCredits: number;
  onOpenSample: () => void;
  onAddCard: () => void;
  onTalk: () => void;
}) {
  const p = org.profile;
  const kind = p?.kind === "appraisal_firm" ? "appraisal firm" : "bank or lender";
  const rows = [
    { id: "account", label: "Account created", detail: `${userName} · ${stamp(org.createdAt)}`, status: "done" as Status },
    {
      id: "org",
      label: "Organization details",
      detail: p ? `${org.name} · ${kind} · ${TEAM_LABEL[p.teamBand]} · ${VOLUME_LABEL[p.volumeBand]}` : org.name,
      status: "done" as Status,
    },
    { id: "approval", label: "Approval", detail: "Realwired staff · within one business day", status: "active" as Status },
    { id: "credits", label: "Trial credits", detail: `${trialCredits} credits granted when the organization is approved`, status: "pending" as Status },
  ];

  return (
    <div>
      <div className="wel-state">
        <StatusPill tone="flag" icon="clock">
          Pending approval
        </StatusPill>
      </div>
      <h1 className="wel-title">We&apos;re setting up {org.name}</h1>
      <p className="wel-sub">
        A Realwired specialist reviews new organizations within one business day. We&apos;ll email {email}{" "}
        when it&apos;s ready.
      </p>
      <Stages rows={rows} />
      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
        <Button type="button" variant="outline" iconLeft="eye" onClick={onOpenSample}>
          Open the sample review
        </Button>
      </div>
      <div className="wel-actions" style={{ justifyContent: "flex-end", marginTop: 14 }}>
        <button type="button" className="wel-text-link" onClick={onAddCard}>
          Add a card now
        </button>
      </div>
      <p className="wel-note">
        Need it sooner?{" "}
        <button type="button" className="kc-link" onClick={onTalk}>
          Talk to us
        </button>
      </p>
    </div>
  );
}
