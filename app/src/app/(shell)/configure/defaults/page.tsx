"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/templates/PageHeader";
import { Card, Label, Chip, Divider } from "@/components/atoms";
import { useTemplatesStore } from "@/store";

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

const grid2: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: 14,
};

export default function ReviewDefaultsPage() {
  // The org-default admin checklist is owned by the checklist library — this
  // select reads/sets the same flag (single source of truth), mirroring the
  // checklist card's "Set as default".
  const { checklists, fetchTemplates, setDefaultChecklist } = useTemplatesStore();
  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);
  const defaultChecklist = checklists.find((c) => c.isDefault) ?? checklists[0];

  // Auto-accept confidence threshold (open Q — value not yet agreed with the
  // client). Local state for the prototype; wired to a store on hand-off.
  const [confidence, setConfidence] = useState(0.85);

  return (
    <>
      <PageHeader
        title="Review defaults"
        sub="The smart defaults applied to every new review so a run stays one-click."
      />

      <div className="pagebody" style={{ maxWidth: 760, margin: "0 auto" }}>
        <Section
          title="Quality gate"
          desc="Criteria that auto-reject an appraisal at intake before it reaches a reviewer."
        >
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Chip tone="accent">Unsigned reports</Chip>
            <Chip tone="accent">Expired appraiser license</Chip>
            <Chip tone="accent">Comparable recency &gt; 18 months</Chip>
            <Chip tone="neutral">+ Add criterion</Chip>
          </div>
        </Section>

        <Section title="Defaults applied to new reviews">
          <div style={grid2}>
            <div>
              <Label>SLA timer starts</Label>
              <select className="qfilter" defaultValue="intake" style={{ width: "100%", height: 42 }}>
                <option value="intake">On intake</option>
                <option value="assigned">When assigned</option>
                <option value="accepted">When accepted</option>
              </select>
            </div>
            <div>
              <Label>Default review profile</Label>
              <select className="qfilter" defaultValue="commercial" style={{ width: "100%", height: 42 }}>
                <option value="commercial">Commercial</option>
                <option value="residential">Residential</option>
                <option value="specialty">Specialty / data center</option>
              </select>
            </div>
            <div>
              <Label>Default administrative checklist</Label>
              <select
                className="qfilter"
                value={defaultChecklist?.id ?? ""}
                onChange={(e) => setDefaultChecklist(e.target.value)}
                style={{ width: "100%", height: 42 }}
              >
                {checklists.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </Section>

        <Section
          title="Auto-accept confidence threshold"
          desc="AI answers at or above this confidence are pre-accepted; anything below is flagged for the reviewer. Higher = more caution, more to review."
        >
          <div className="cfg-slider">
            <input
              type="range"
              min={0.5}
              max={0.99}
              step={0.01}
              value={confidence}
              aria-label="Auto-accept confidence threshold"
              onChange={(e) => setConfidence(Number(e.target.value))}
            />
            <span className="cfg-slider-val mono">{confidence.toFixed(2)}</span>
          </div>
          <p className="cfg-hint">
            <Chip tone="flag" dot>
              Open question
            </Chip>
            The default value is still being confirmed with Realwired.
          </p>
        </Section>
      </div>
    </>
  );
}
