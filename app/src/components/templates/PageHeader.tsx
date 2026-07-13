export function PageHeader({
  eyebrow,
  title,
  badges,
  sub,
  actions,
}: {
  eyebrow?: string;
  title: string;
  /** Chips/labels shown inline to the right of the title (version, status, …). */
  badges?: React.ReactNode;
  sub?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="pagehead">
      <div style={{ minWidth: 0 }}>
        {eyebrow && <div className="eyebrow">{eyebrow}</div>}
        <div className="pagehead-titlerow">
          <h1>{title}</h1>
          {badges}
        </div>
        {sub && <div className="sub">{sub}</div>}
      </div>
      {actions && <div style={{ display: "flex", gap: 8 }}>{actions}</div>}
    </div>
  );
}
