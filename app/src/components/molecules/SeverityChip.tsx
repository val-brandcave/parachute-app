import { Chip, Icon, type IconName, type ChipTone } from "@/components/atoms";
import type { Severity } from "@/types";

const MAP: Record<
  Severity,
  { label: string; tone: ChipTone; icon: IconName }
> = {
  crit: { label: "Critical", tone: "crit", icon: "crit" },
  fail: { label: "Fail", tone: "fail", icon: "fail" },
  flag: { label: "Flagged", tone: "flag", icon: "flag" },
  pass: { label: "Pass", tone: "pass", icon: "check-circle" },
  na: { label: "N/A", tone: "na", icon: "na" },
};

export function SeverityChip({ severity }: { severity: Severity }) {
  const m = MAP[severity];
  return (
    <Chip tone={m.tone}>
      <Icon name={m.icon} size={13} />
      {m.label}
    </Chip>
  );
}
