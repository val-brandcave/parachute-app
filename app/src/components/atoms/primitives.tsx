import { cn } from "@/lib/utils";

export function Avatar({
  initials,
  className,
}: {
  initials: string;
  className?: string;
}) {
  return <span className={cn("ui-avatar", className)}>{initials}</span>;
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
