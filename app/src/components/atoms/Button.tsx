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
  busy = false,
  className,
  children,
  ...rest
}: {
  variant?: Variant;
  size?: Size;
  iconLeft?: IconName;
  iconRight?: IconName;
  block?: boolean;
  /**
   * Working state: a 16 px spinner over the label, width held, `aria-busy`.
   * Clicks are swallowed while busy (the button stays focusable, never `disabled`).
   * DS-candidate: Button `loading` prop — @realwired/ui Button has no busy state.
   */
  busy?: boolean;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const iconSize = size === "sm" ? 15 : 17;
  const { onClick, ...buttonProps } = rest;
  return (
    <button type="button"
      className={cn(
        "ui-btn",
        `ui-btn--${variant}`,
        size !== "md" && `ui-btn--${size}`,
        block && "ui-btn--block",
        busy && "is-busy",
        className,
      )}
      aria-busy={busy || undefined}
      onClick={busy ? swallow : onClick}
      {...buttonProps}
    >
      {iconLeft && <Icon name={iconLeft} size={iconSize} />}
      {children}
      {iconRight && <Icon name={iconRight} size={iconSize} />}
      {busy && <span className="ui-btn-spin" aria-hidden="true" />}
    </button>
  );
}

/** While busy, a click does nothing (the button stays focusable and announced). */
function swallow(e: React.MouseEvent<HTMLButtonElement>) {
  e.preventDefault();
}
