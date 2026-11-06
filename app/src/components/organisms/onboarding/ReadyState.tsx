"use client";

import { Button, Chip, Icon } from "@/components/atoms";
import { StatusPill } from "@/components/molecules";
import { approxValue } from "@/lib/pricing";

/** B4: the workspace is open. Two first moves and a way to Home. */
export function ReadyState({
  orgName,
  balance,
  firstReportCost,
  onSample,
  onFirstReport,
  onAddCard,
  onHome,
}: {
  orgName: string;
  balance: number;
  firstReportCost: number;
  onSample: () => void;
  onFirstReport: () => void;
  onAddCard: () => void;
  onHome: () => void;
}) {
  return (
    <div>
      <div className="wel-state">
        <StatusPill tone="pass" icon="check">
          Organization ready
        </StatusPill>
      </div>
      <h1 className="wel-title">{orgName} is ready</h1>
      <p className="wel-sub" style={{ marginBottom: 16 }}>
        Your trial is open. Nothing here needs a card.
      </p>

      <div className="wel-chips">
        <Chip className="dashed">
          {balance} trial {balance === 1 ? "credit" : "credits"}
        </Chip>
        <span className="wel-dot">{approxValue(balance)} value</span>
        <span className="wel-dot">Free sample review included</span>
      </div>

      <button type="button" className="wel-go" onClick={onSample}>
        <div style={{ flex: 1 }}>
          <div className="wel-opt-head">
            Open the sample review
            <Chip tone="pass">Free</Chip>
          </div>
          <p className="wel-opt-desc">A finished review on a fictional office building. Free.</p>
        </div>
        <Icon name="chevron-right" size={18} />
      </button>
      <button type="button" className="wel-go" onClick={onFirstReport}>
        <div style={{ flex: 1 }}>
          <div className="wel-opt-head">
            Run your first report
            <Chip>
              {firstReportCost} credits · {approxValue(firstReportCost)}
            </Chip>
          </div>
          <p className="wel-opt-desc">
            Uses {firstReportCost} credits. Use a non-borrower file until your IT team signs off.
          </p>
        </div>
        <Icon name="chevron-right" size={18} />
      </button>

      <div className="wel-actions">
        <button type="button" className="wel-text-link" onClick={onAddCard}>
          Add a card now
        </button>
        <Button type="button" size="lg" iconRight="forward" onClick={onHome}>
          Go to Home
        </Button>
      </div>
    </div>
  );
}
