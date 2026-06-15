import { PageHeader } from "@/components/templates/PageHeader";
import { Chip, Icon, Card } from "@/components/atoms";

export function Stub({
  title,
  sprint,
  note,
}: {
  title: string;
  /** @deprecated kept for call-site compatibility; no longer rendered */
  crumb?: string;
  sprint: string;
  note: string;
}) {
  return (
    <>
      <PageHeader title={title} actions={<Chip tone="info">{sprint}</Chip>} />
      <div className="pagebody">
        <Card
          style={{
            padding: "48px 40px",
            textAlign: "center",
            color: "var(--md-on-surface-v)",
          }}
        >
          <Icon
            name="construction"
            size={40}
            style={{ color: "var(--md-accent-d)", margin: "0 auto" }}
          />
          <p style={{ marginTop: 12, maxWidth: 520, marginInline: "auto" }}>{note}</p>
        </Card>
      </div>
    </>
  );
}
