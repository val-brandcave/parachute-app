"use client";

import { useState } from "react";
import { Tabs, AvatarUpload } from "@/components/molecules";
import { MembersPanel, BrandingPanel, BillingPanel } from "@/components/organisms";
import { Card, Input, Label, Divider, Icon } from "@/components/atoms";
import { useIdentityStore, useOrgStore } from "@/store";
import { CURRENT_ORG } from "@/lib/current-user";
import { formatShortDate } from "@/lib/utils";

type TabKey = "identity" | "branding" | "members" | "billing";

/** Human-readable file size for the bank-policy row. */
function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${Math.round(n / 1024)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

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

export default function OrganizationPage() {
  const [tab, setTab] = useState<TabKey>("identity");
  const { orgAvatar, setOrgAvatar } = useIdentityStore();

  // Org bank policy (F-123) — the single upload/replace surface; the run confirm
  // gate only references it. An org-wide document applied to every run.
  const { bankPolicy, setBankPolicy, removeBankPolicy } = useOrgStore();
  const onPolicyPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f)
      setBankPolicy({
        name: f.name,
        sizeLabel: formatBytes(f.size),
        updatedAt: formatShortDate(Date.now()),
      });
    e.target.value = ""; // allow re-picking the same file
  };

  return (
    <>
      <div className="pagehead">
        <Tabs
          value={tab}
          onChange={setTab}
          tabs={[
            { value: "identity", label: "Identity" },
            { value: "branding", label: "Branding" },
            { value: "members", label: "Members" },
            { value: "billing", label: "Billing" },
          ]}
        />
        <div style={{ flex: 1 }} />
      </div>

      {tab === "identity" && (
        <div className="pagebody" style={{ maxWidth: 760, margin: "0 auto" }}>
          <Section title="Organization logo" desc="Shown in the sidebar and on exported workbooks.">
            <AvatarUpload
              value={orgAvatar}
              onChange={setOrgAvatar}
              initials={CURRENT_ORG.initials}
              hint="PNG or SVG, square, up to 1 MB."
            />
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

          <Section
            title="Bank policy"
            desc="A short policy document whose rules are applied on the final pass (e.g. “satisfies 26 of 30 rules”). Uploaded once here — every run references it automatically."
          >
            <div className="field">
              {bankPolicy ? (
                <div className="run-cf-file-row">
                  <span className="run-cf-ic run-cf-ic--file" aria-hidden="true">
                    <Icon name="pdf" size={18} />
                  </span>
                  <span className="run-cf-file-row-info">
                    <span className="run-cf-file-row-name">{bankPolicy.name}</span>
                    <span className="run-cf-file-row-size">
                      {bankPolicy.sizeLabel} · updated {bankPolicy.updatedAt}
                    </span>
                  </span>
                  <span className="run-cf-file-row-act">
                    <label className="run-cf-file-act">
                      Replace
                      <input type="file" accept=".pdf,.docx" hidden onChange={onPolicyPick} />
                    </label>
                    <button
                      type="button"
                      className="run-cf-file-act run-cf-file-act--remove"
                      onClick={removeBankPolicy}
                    >
                      Remove
                    </button>
                  </span>
                </div>
              ) : (
                <label className="run-cf-upload">
                  <input type="file" accept=".pdf,.docx" hidden onChange={onPolicyPick} />
                  <Icon name="upload" size={20} />
                  <span className="run-cf-upload-label">Upload policy document</span>
                  <span className="run-cf-upload-hint">PDF or DOCX — applied to every run</span>
                </label>
              )}
            </div>
          </Section>
        </div>
      )}

      {tab === "branding" && (
        <div className="pagebody">
          <BrandingPanel />
        </div>
      )}

      {tab === "members" && (
        <div className="pagebody">
          <MembersPanel />
        </div>
      )}

      {tab === "billing" && (
        <div className="pagebody" style={{ maxWidth: 860, margin: "0 auto" }}>
          <BillingPanel />
        </div>
      )}
    </>
  );
}
