"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Tabs, SegmentedControl, AvatarUpload } from "@/components/molecules";
import { Card, Input, Label, Chip, Divider, Button, Icon } from "@/components/atoms";
import { usePrefsStore } from "@/store";
import { CURRENT_USER, CURRENT_ORG } from "@/lib/current-user";

type TabKey = "org" | "defaults" | "compliance" | "profile" | "prefs";

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

export default function SettingsPage() {
  const router = useRouter();
  const [tab, setTab] = useState<TabKey>("org");
  const { density, setDensity, theme, setTheme } = usePrefsStore();

  return (
    <>
      <div className="pagehead">
        <Tabs
          value={tab}
          onChange={setTab}
          tabs={[
            { value: "org", label: "Organization" },
            { value: "defaults", label: "Review defaults" },
            { value: "compliance", label: "Compliance" },
            { value: "profile", label: "My profile" },
            { value: "prefs", label: "Preferences" },
          ]}
        />
        <div style={{ flex: 1 }} />
      </div>

      <div className="pagebody" style={{ maxWidth: 760, margin: "0 auto" }}>
        {tab === "org" && (
          <>
            <Section title="Organization logo" desc="Shown in the sidebar and on exported workbooks.">
              <AvatarUpload initials={CURRENT_ORG.initials} hint="PNG or SVG, square, up to 1 MB." />
            </Section>
            <Section title="Organization details">
              <div style={grid2}>
                <div>
                  <Label>Organization name</Label>
                  <Input defaultValue={CURRENT_ORG.name} />
                </div>
                <div>
                  <Label>Short name</Label>
                  <Input defaultValue="Meridian Trust" />
                </div>
              </div>
            </Section>
          </>
        )}

        {tab === "defaults" && (
          <>
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
                  <select className="qfilter" defaultValue="mt-commercial" style={{ width: "100%", height: 42 }}>
                    <option value="mt-commercial">Meridian Trust — Commercial Review</option>
                    <option value="mt-sba">Meridian Trust — SBA 7(a)/504</option>
                  </select>
                </div>
              </div>
            </Section>
          </>
        )}

        {tab === "compliance" && (
          <>
            <Section
              title="Compliance checklist"
              desc="The bank's yes/no/N-A checklist Parachute answers in an administrative review."
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  border: "1px solid var(--md-outline-v)",
                  borderRadius: 10,
                  padding: "12px 14px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <Icon name="checklist" size={18} />
                  <div>
                    <div style={{ fontWeight: 600 }}>Meridian Trust — Commercial Review</div>
                    <div style={{ fontSize: 12, color: "var(--md-on-surface-v)" }}>
                      22 items · v3 · updated last month
                    </div>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    router.push("/templates/checklist/checklist-demo-commercial")
                  }
                >
                  Manage
                </Button>
              </div>
            </Section>
            <Section
              title="Bank policy"
              desc="A short policy document whose rules are applied on the final pass (e.g. “satisfies 26 of 30 rules”)."
            >
              <Button variant="outline" iconLeft="download" size="sm">Upload policy (PDF/DOCX)</Button>
            </Section>
          </>
        )}

        {tab === "profile" && (
          <Section title="Reviewer profile" desc="Shown on signed workbooks and attestations.">
            <div style={grid2}>
              <div>
                <Label>Name</Label>
                <Input defaultValue={CURRENT_USER.name} />
              </div>
              <div>
                <Label>Designation</Label>
                <Input defaultValue={CURRENT_USER.designation} />
              </div>
              <div style={{ gridColumn: "1 / -1" }}>
                <Label>Signature name</Label>
                <Input defaultValue={CURRENT_USER.signatureName} />
              </div>
            </div>
          </Section>
        )}

        {tab === "prefs" && (
          <>
            <Section title="Theme" desc="Choose how Parachute looks. System follows your device.">
              <SegmentedControl
                value={theme}
                onChange={setTheme}
                options={[
                  { value: "light", label: "Light" },
                  { value: "dark", label: "Dark" },
                  { value: "system", label: "System" },
                ]}
              />
            </Section>
            <Section
              title="Display density"
              desc="How much information is shown per screen. Affects spacing and type scale, not layout."
            >
              <SegmentedControl
                value={density}
                onChange={setDensity}
                options={[
                  { value: "comfortable", label: "Comfortable" },
                  { value: "compact", label: "Compact" },
                ]}
              />
            </Section>
          </>
        )}
      </div>
    </>
  );
}
