import Link from "next/link";
import { Icon, InfoTip } from "@/components/atoms";
import { formatUsd } from "@/lib/pricing";
import { cn } from "@/lib/utils";
import type { ValueBand as ValueBandData } from "./insights.types";
import "./dashboard-v2-a.css";

const num = (n: number) => n.toLocaleString("en-US");
/** One decimal, trailing ".0" dropped: 2.5, 3, 0.8. */
const dec = (n: number) => (Math.round(n * 10) / 10).toLocaleString("en-US", { maximumFractionDigits: 1 });

function deltaText(d: number): string {
  const pct = Math.round(d * 100);
  return `${pct > 0 ? "+" : pct < 0 ? "−" : "±"}${Math.abs(pct)}% vs last period`;
}

// DS-candidate: ValueSegment — one hairline-divided metric in a unified panel
// (label + InfoTip, big tabular number, sub-line);
// StatBar's segment without the icon badge, for value/ROI read-outs.
function Segment({
  label,
  tip,
  value,
  sub,
  className,
}: {
  label: string;
  tip?: React.ReactNode;
  value: React.ReactNode;
  sub?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("dv2-vseg", className)}>
      <div className="dv2-vseg-k">
        {label}
        {tip && <InfoTip content={tip} />}
      </div>
      <div className="dv2-vseg-v">{value}</div>
      {sub && <div className="dv2-vseg-sub">{sub}</div>}
    </div>
  );
}

/**
 * Dashboard v2 · B. "What Parachute did" — period-scoped value read-out in one
 * panel: completed, hours saved (estimated), checks the engine corrected,
 * issues caught; plus an optional admin-only Spend segment.
 */
export function ValueBand({
  data,
  hoursPerType,
  spend = null,
  title = "What Parachute did",
  billingHref = "/configure/billing",
}: {
  data: ValueBandData;
  /** No longer rendered (eyebrow removed, Val 21 Nov); kept so callers needn't change. */
  periodLabel?: string;
  /** Hours saved per review type (from the value model / lib/pricing), shown in the method tip. */
  hoursPerType: { technical: number; administrative: number };
  /** Admin-only lens: pass null/undefined to hide the Spend segment. */
  spend?: { usd: number; credits: number } | null;
  title?: string;
  billingHref?: string;
}) {
  const d = data.completedDelta;

  return (
    <section className="dv2-card dv2-value" aria-label={title}>
      <header className="dv2-head">
        <h3 className="dv2-title">{title}</h3>
      </header>

      <div className={cn("dv2-vgrid", spend && "has-spend")}>
        <Segment
          label="Reviews completed"
          value={num(data.completed)}
          sub={
            d !== null && (
              <span className={cn("dv2-delta", d > 0 && "up")}>{deltaText(d)}</span>
            )
          }
        />

        <Segment
          label="Reviewer hours saved"
          tip={`Estimated: completed reviews × about ${dec(hoursPerType.technical)} h per Technical and ${dec(hoursPerType.administrative)} h per Administrative review. Placeholder until Realwired confirms.`}
          value={
            <>
              ≈ {num(Math.round(data.hoursSaved))} h
              <span className="dv2-est">Estimated</span>
            </>
          }
          sub={`≈ ${dec(data.hoursPerReview)} h per review`}
        />

        <Segment
          label="Checks the engine corrected"
          value={num(data.checksCorrected)}
          sub={`of ${num(data.checksRun)} calculations re-checked`}
        />

        <Segment
          label="Issues caught"
          value={num(data.issues)}
          sub={`${dec(data.issuesPerReport)} per report · ${num(data.issuesCriticalHigh)} critical or high`}
        />

        {spend && (
          <Segment
            className="dv2-vseg--spend"
            label="Spend"
            value={formatUsd(spend.usd)}
            sub={
              <>
                {num(spend.credits)} {spend.credits === 1 ? "credit" : "credits"}
                <span aria-hidden> · </span>
                <Link href={billingHref} className="dv2-link">
                  Billing <Icon name="chevron-right" size={13} />
                </Link>
              </>
            }
          />
        )}
      </div>
    </section>
  );
}
