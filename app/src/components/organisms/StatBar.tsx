import { Icon, InfoTip, type IconName } from "@/components/atoms";
import { cn } from "@/lib/utils";

export type Stat = {
  label: string;
  value: React.ReactNode;
  icon: IconName;
  tip?: React.ReactNode;
  trend?: { text: string; dir?: "up" | "down" };
  /** Turns this segment red to flag urgency (e.g. Overdue > 0). Otherwise monochrome. */
  alert?: boolean;
  /** Marks a point-in-time ("now") tile that is NOT scoped by the period picker. */
  live?: boolean;
};

/** Unified, informational stat bar (not interactive). */
export function StatBar({ stats }: { stats: Stat[] }) {
  return (
    <div className="statbar">
      {stats.map((s) => (
        <div key={s.label} className={cn("statseg", s.alert && "alert")}>
          <div className="statseg-main">
            <div className="k">
              {s.label}
              {s.tip && <InfoTip content={s.tip} />}
            </div>
            <div className="v">
              {s.value}
              {s.live && (
                <span className="statseg-live">
                  <i />
                  Live
                </span>
              )}
            </div>
            {s.trend && (
              <div className={cn("trend", s.trend.dir)}>{s.trend.text}</div>
            )}
          </div>
          <div className="statseg-badge">
            <Icon name={s.icon} size={22} />
          </div>
        </div>
      ))}
    </div>
  );
}
