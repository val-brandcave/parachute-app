"use client";

import { PageHeader } from "@/components/templates/PageHeader";
import { SegmentedControl } from "@/components/molecules";
import { Card, Input, Label, Chip, Divider } from "@/components/atoms";
import { usePrefsStore } from "@/store";

function Section({
  title,
  desc,
  children,
}: {
  title: string;
  desc?: string;
  children: React.ReactNode;
}) {
  return (
    <Card style={{ padding: "var(--d-card-pad)", marginBottom: 16 }}>
      <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 16 }}>
        {title}
      </div>
      {desc && (
        <div style={{ color: "var(--md-on-surface-v)", fontSize: 13, marginTop: 3 }}>
          {desc}
        </div>
      )}
      <Divider style={{ margin: "14px 0" }} />
      {children}
    </Card>
  );
}

export default function SettingsPage() {
  const { density, setDensity } = usePrefsStore();

  return (
    <>
      <PageHeader title="Settings" />
      <div className="pagebody" style={{ maxWidth: 820 }}>
      <Section
        title="Display density"
        desc="Adjust how much information is shown per screen. Changes spacing and type scale — never the layout."
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
          <SegmentedControl
            value={density}
            onChange={setDensity}
            options={[
              { value: "comfortable", label: "Comfortable" },
              { value: "compact", label: "Compact" },
            ]}
          />
          <span style={{ color: "var(--md-on-surface-v)", fontSize: 13 }}>
            Currently <b style={{ color: "var(--md-accent-d)" }}>{density}</b> — try it,
            the whole app reflows live.
          </span>
        </div>
      </Section>

      <Section title="Reviewer profile" desc="Shown on signed workbooks and attestations.">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <div>
            <Label>Name</Label>
            <Input defaultValue="Alex Morgan" />
          </div>
          <div>
            <Label>Designation</Label>
            <Input defaultValue="Chief Appraiser, MAI" />
          </div>
        </div>
      </Section>

      <Section
        title="Organization defaults"
        desc="Brand and quality-gate defaults applied to new reviews."
      >
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <Chip tone="accent">Auto-reject: unsigned reports</Chip>
          <Chip tone="accent">Comparable recency ≤ 18 months</Chip>
          <Chip tone="neutral">SLA starts on intake</Chip>
          <span style={{ fontSize: 12.5, color: "var(--md-on-surface-v)" }}>
            (editable in Sprint 3)
          </span>
        </div>
      </Section>
      </div>
    </>
  );
}
