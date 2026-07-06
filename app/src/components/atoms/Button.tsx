import { cn } from "@/lib/utils";
import { Icon, type IconName } from "./Icon";

// `tonal` = an outline button that inherits its host's tone via the `--btn-tone`
// CSS var (falls back to neutral ink). Built for in-banner actions so one variant
// works across every banner colour (warn, petrol regenerate, etc.).
type Variant = "primary" | "accent" | "outline" | "ghost" | "danger" | "tonal";
type Size = "sm" | "md" | "lg";

export function Button({
  variant = "primary",
  size = "md",
  iconLeft,
  iconRight,
  block,
  className,
  children,
  ...rest
}: {
  variant?: Variant;
  size?: Size;
  iconLeft?: IconName;
  iconRight?: IconName;
  block?: boolean;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const iconSize = size === "sm" ? 15 : 17;
  return (
    <button
      className={cn(
        "ui-btn",
        `ui-btn--${variant}`,
        size !== "md" && `ui-btn--${size}`,
        block && "ui-btn--block",
        className,
      )}
      {...rest}
    >
      {iconLeft && <Icon name={iconLeft} size={iconSize} />}
      {children}
      {iconRight && <Icon name={iconRight} size={iconSize} />}
    </button>
  );
}
