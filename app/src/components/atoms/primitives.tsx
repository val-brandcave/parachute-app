/* eslint-disable @next/next/no-img-element */
import { cn } from "@/lib/utils";

export function Avatar({
  initials,
  size = 34,
  tone = "accent",
  className,
  src,
}: {
  initials: string;
  size?: number;
  tone?: "accent" | "soft" | "navy" | "muted";
  className?: string;
  /** When set, shows this image (cover-cropped, round) instead of initials. */
  src?: string | null;
}) {
  if (src) {
    return (
      <img
        src={src}
        alt=""
        className={cn("ui-avatar", className)}
        style={{ width: size, height: size, objectFit: "cover" }}
      />
    );
  }
  return (
    <span
      className={cn("ui-avatar", `ui-avatar--${tone}`, className)}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.38) }}
    >
      {initials}
    </span>
  );
}

export function Divider({
  className,
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
  return <hr className={cn("ui-divider", className)} style={style} />;
}

export function Spinner({ className }: { className?: string }) {
  return <span className={cn("ui-spinner", className)} aria-label="Loading" />;
}

export function Kbd({ children }: { children: React.ReactNode }) {
  return <kbd className="ui-kbd">{children}</kbd>;
}

export function Card({
  className,
  children,
  ...rest
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("ui-card", className)} {...rest}>
      {children}
    </div>
  );
}
