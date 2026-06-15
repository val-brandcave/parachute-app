import { formatPct } from "@/lib/utils";

export function ConfidenceMeter({ value }: { value: number }) {
  return (
    <span className="ui-conf" title={`AI confidence ${formatPct(value)}`}>
      <span className="track">
        <span className="fill" style={{ width: `${Math.round(value * 100)}%` }} />
      </span>
      <span className="mono">{formatPct(value)}</span>
    </span>
  );
}
