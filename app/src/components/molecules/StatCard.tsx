import { cn } from "@/lib/utils";
import { Icon, type IconName } from "@/components/atoms";

export function StatCard({
  label,
  value,
  sub,
  icon,
  active,
  onClick,
}: {
  label: string;
  value: React.ReactNode;
  sub?: string;
  icon?: IconName;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <div
      className={cn("ui-stat", onClick && "ui-stat--click", active && "on")}
      onClick={onClick}
      role={onClick ? "button" : undefined}
    >
      <div className="k">
        {icon && <Icon name={icon} size={14} />}
        {label}
      </div>
      <div className="v">{value}</div>
      {sub && <div className="ks">{sub}</div>}
    </div>
  );
}
