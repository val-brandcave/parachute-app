import { cn } from "@/lib/utils";

export type ChipTone =
  | "neutral"
  | "pass"
  | "flag"
  | "fail"
  | "crit"
  | "info"
  | "accent"
  | "na";

export function Chip({
  tone = "neutral",
  dot,
  className,
  children,
}: {
  tone?: ChipTone;
  dot?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span className={cn("ui-chip", tone !== "neutral" && `ui-chip--${tone}`, className)}>
      {dot && <span className="ui-dot" style={{ background: "currentColor" }} />}
      {children}
    </span>
  );
}
