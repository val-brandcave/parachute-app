import { Icon, InfoTip, type IconName } from "@/components/atoms";
import { cn } from "@/lib/utils";

export type StatTone = "accent" | "flag" | "fail" | "pass" | "info";

export type Stat = {
  label: string;
  value: React.ReactNode;
  icon: IconName;
  tip?: React.ReactNode;
  tone?: StatTone;
  trend?: { text: string; dir?: "up" | "down" };
};

/** Unified, informational stat bar (not interactive). */
export function StatBar({ stats }: { stats: Stat[] }) {
  return (
    <div className="statbar">
      {stats.map((s) => (
        <div key={s.label} className="statseg">
          <div className="statseg-main">
            <div className="k">
              {s.label}
              {s.tip && <InfoTip content={s.tip} />}
            </div>
            <div className="v">{s.value}</div>
            {s.trend && (
              <div className={cn("trend", s.trend.dir)}>{s.trend.text}</div>
            )}
          </div>
          <div className={cn("statseg-badge", `tone-${s.tone ?? "accent"}`)}>
            <Icon name={s.icon} size={22} />
          </div>
        </div>
      ))}
    </div>
  );
}
