import { cn } from "@/lib/utils";
import "./home-cards.css";

/**
 * The one frame every first-run Home card shares: title row (h2 + optional quiet
 * right slot) → one inset panel carrying the card's own content → footer
 * (actions left, small tertiary meta right). Pass `raw` when the inset is its own
 * element (a link, a button); otherwise children are wrapped in the inset.
 */
export function HcCard({
  title,
  right,
  raw = false,
  insetClassName,
  actions,
  meta,
  className,
  children,
}: {
  title: string;
  /** A status chip or a quiet count. Never a button or link. */
  right?: React.ReactNode;
  raw?: boolean;
  insetClassName?: string;
  actions?: React.ReactNode;
  meta?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section className={cn("card hc-card", className)}>
      <div className="hc-head">
        <h2 className="hc-title">{title}</h2>
        {right != null && <div className="hc-right">{right}</div>}
      </div>
      {raw ? children : <div className={cn("hc-inset", insetClassName)}>{children}</div>}
      {(actions || meta) && (
        <div className="hc-foot">
          <div className="hc-actions">{actions}</div>
          {meta && <span className="hc-meta">{meta}</span>}
        </div>
      )}
    </section>
  );
}
