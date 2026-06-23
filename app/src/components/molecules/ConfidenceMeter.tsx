import { formatPct } from "@/lib/utils";

/**
 * AI confidence meter — a labelled mini bar showing how sure Parachute is about
 * a finding or attestation answer. Self-describing (a visible "Confidence"
 * caption, not just a tooltip); the bar fills to the score and turns amber below
 * 85% — the same "worth a closer look" threshold the workspace flags as needs-
 * attention.
 */
export function ConfidenceMeter({ value }: { value: number }) {
  const pct = Math.round(value * 100);
  const low = value < 0.85;
  return (
    <span
      className={`ui-conf${low ? " ui-conf--low" : ""}`}
      title={`AI confidence ${formatPct(value)} — how sure Parachute is about this${
        low ? "; low, worth a closer look" : ""
      }`}
    >
      <span className="ui-conf-label">Confidence</span>
      <span className="ui-conf-track">
        <span className="ui-conf-fill" style={{ width: `${pct}%` }} />
      </span>
      <span className="ui-conf-val">{formatPct(value)}</span>
    </span>
  );
}
