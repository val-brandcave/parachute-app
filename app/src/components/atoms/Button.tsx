import { cn } from "@/lib/utils";
import { Icon, type IconName } from "./Icon";

type Variant = "primary" | "accent" | "outline" | "ghost" | "danger";
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
