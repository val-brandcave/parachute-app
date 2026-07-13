"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Tabs } from "@/components/molecules";
import {
  Card,
  Label,
  Divider,
  Icon,
  IconButton,
  Switch,
  Input,
  Button,
  type IconName,
} from "@/components/atoms";
import { publishedVersion } from "@/lib/template-versions";
import { useTemplatesStore } from "@/store";
import type { WorkbookLayout } from "@/types";

type TabKey = "intake" | "deliverables";

function Section({
  title,
  desc,
  action,
  children,
}: {
  title: string;
  desc?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Card style={{ padding: "var(--d-card-pad)", marginBottom: 16 }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 16 }}
          >
            {title}
          </div>
          {desc && (
            <div style={{ color: "var(--md-on-surface-v)", fontSize: 13, marginTop: 3 }}>
              {desc}
            </div>
          )}
        </div>
        {action}
      </div>
      <Divider style={{ margin: "14px 0" }} />
      {children}
    </Card>
  );
}

/* -------------------------------------------------------------------------- */
/*  Bound default — a value owned by another config surface. Read-only here,    */
/*  with a CTA that routes to the owning page (single source of truth).         */
/* -------------------------------------------------------------------------- */
function BoundRow({
  label,
  value,
  meta,
  href,
}: {
  label: string;
  value?: string;
  meta?: string;
  href: string;
}) {
  return (
    <div className="rd-bound">
      <span className="rd-bound-main">
        <span className="rd-bound-label">{label}</span>
        {value ? (
          <span className="rd-bound-val">
            {value}
            {meta && <span className="rd-bound-meta">{meta}</span>}
          </span>
        ) : (
          <span className="rd-bound-val rd-bound-val--empty">Not set yet</span>
        )}
      </span>
      <Link href={href} className="rd-bound-act">
        <Button variant="outline" size="sm">
          Manage
        </Button>
      </Link>
    </div>
  );
}

/** Version/section summary for a workbook layout's published version. */
function layoutMeta(layout?: WorkbookLayout): string | undefined {
  if (!layout) return undefined;
  const pub = publishedVersion(layout.versions);
  if (!pub) return undefined;
  const count = pub.sections.length;
  return `v${pub.version}${count ? ` · ${count} sections` : ""}`;
}

export default function ReviewDefaultsPage() {
  const [tab, setTab] = useState<TabKey>("intake");

  // Deliverable bindings are owned by their libraries — this page only reads the
  // current defaults and links out. Single source of truth stays in each config.
  const { layouts, checklists, fetchTemplates } = useTemplatesStore();
  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const defaultChecklist = checklists.find((c) => c.isDefault) ?? checklists[0];

  // The Technical deliverable carries one default workbook layout per review
  // profile — derived from the profiles that exist in the layout library, so a
  // new profile there surfaces here automatically.
  const profiles = useMemo(
    () => Array.from(new Set(layouts.map((l) => l.profile))),
    [layouts],
  );
  const defaultLayoutFor = (profile: string) =>
    layouts.find((l) => l.profile === profile && l.isDefault) ??
    layouts.find((l) => l.profile === profile);

  // Quality gate — org-wide auto-reject rules. Local state for the prototype.
  const [rules, setRules] = useState<string[]>([
    "Unsigned reports",
    "Expired appraiser license",
    "Comparable recency > 18 months",
  ]);
  const [ruleDraft, setRuleDraft] = useState("");
  const [addingRule, setAddingRule] = useState(false);
  const addRule = () => {
    const r = ruleDraft.trim();
    if (r) setRules((rs) => [...rs, r]);
    setRuleDraft("");
    setAddingRule(false);
  };

  // Auto-accept toggle + confidence threshold (org-wide automation).
  const [autoAccept, setAutoAccept] = useState(true);
  const [confidence, setConfidence] = useState(0.85);

  return (
    <>
      <div className="pagehead">
        <Tabs
          value={tab}
          onChange={setTab}
          tabs={[
            { value: "intake", label: "Intake" },
            { value: "deliverables", label: "Deliverables" },
          ]}
        />
        <div style={{ flex: 1 }} />
      </div>

      {/* ---------------------------------------------------------------- */}
      {/*  INTAKE — org-wide policy applied as an appraisal arrives + how    */}
      {/*  the AI pre-fills before a human reviews.                          */}
      {/* ---------------------------------------------------------------- */}
      {tab === "intake" && (
        <div className="pagebody" style={{ maxWidth: 760, margin: "0 auto" }}>
          <Section
            title="Quality gate"
            desc="Criteria that auto-reject an appraisal at intake before it reaches a reviewer."
          >
            <div className="rd-gate">
              {rules.map((rule, i) => (
                <div className="rd-gate-row" key={`${rule}-${i}`}>
                  <span className="rd-gate-rule">{rule}</span>
                  <span className="rd-gate-action">Reject</span>
                  <IconButton
                    name="trash"
                    size={16}
                    aria-label={`Remove “${rule}”`}
                    onClick={() => setRules((rs) => rs.filter((_, j) => j !== i))}
                  />
                </div>
              ))}

              {addingRule ? (
                <div className="rd-gate-add">
                  <Input
                    autoFocus
                    value={ruleDraft}
                    placeholder="e.g. Missing subject photos"
                    onChange={(e) => setRuleDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") addRule();
                      if (e.key === "Escape") {
                        setRuleDraft("");
                        setAddingRule(false);
                      }
                    }}
                  />
                  <Button onClick={addRule} disabled={!ruleDraft.trim()}>
                    Add
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setRuleDraft("");
                      setAddingRule(false);
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              ) : (
                <button
                  type="button"
                  className="rd-gate-addbtn"
                  onClick={() => setAddingRule(true)}
                >
                  <Icon name="add" size={16} />
                  Add criterion
                </button>
              )}
            </div>
          </Section>

          <Section
            title="Turnaround (SLA)"
            desc="When the review clock starts counting for a new appraisal."
          >
            <div style={{ maxWidth: 340 }}>
              <Label>SLA timer starts</Label>
              <select
                className="qfilter"
                defaultValue="intake"
                style={{ width: "100%", height: 42 }}
              >
                <option value="intake">On intake</option>
                <option value="assigned">When assigned</option>
                <option value="accepted">When accepted</option>
              </select>
            </div>
          </Section>

          <Section
            title="Auto-accept"
            desc="Let the AI pre-accept high-confidence answers so a run stays close to one-click."
            action={
              <Switch
                checked={autoAccept}
                onChange={setAutoAccept}
                label="Enable auto-accept"
              />
            }
          >
            <div className={autoAccept ? undefined : "rd-disabled"}>
              <Label>Confidence threshold</Label>
              <div className="cfg-slider">
                <input
                  type="range"
                  min={0.5}
                  max={0.99}
                  step={0.01}
                  value={confidence}
                  disabled={!autoAccept}
                  aria-label="Auto-accept confidence threshold"
                  onChange={(e) => setConfidence(Number(e.target.value))}
                />
                <span className="cfg-slider-val">{confidence.toFixed(2)}</span>
              </div>
              <p className="cfg-hint">
                Answers at or above this confidence are pre-accepted; anything below
                is flagged for the reviewer. Higher = more caution, more to review.
              </p>
            </div>
          </Section>
        </div>
      )}

      {/* ---------------------------------------------------------------- */}
      {/*  DELIVERABLES — the two review types. Technical = the workbook     */}
      {/*  (one default layout per profile); Administrative = the bank's     */}
      {/*  compliance form. Both owned by their libraries.                  */}
      {/* ---------------------------------------------------------------- */}
      {tab === "deliverables" && (
        <div className="pagebody" style={{ maxWidth: 760, margin: "0 auto" }}>
          <Section
            title="Technical"
            desc="The workbook deliverable — one default layout per review profile."
            action={<span className="rd-type-tag">Review type</span>}
          >
            <div className="rd-bound-list">
              {profiles.map((profile) => {
                const layout = defaultLayoutFor(profile);
                return (
                  <BoundRow
                    key={profile}
                    label={profile}
                    value={layout?.name}
                    meta={layoutMeta(layout)}
                    href="/configure/workbook-layouts"
                  />
                );
              })}
            </div>
          </Section>

          <Section
            title="Administrative"
            desc="The bank's compliance form, applied to every review."
            action={<span className="rd-type-tag">Review type</span>}
          >
            <div className="rd-bound-list">
              <BoundRow
                label="Default compliance checklist"
                value={defaultChecklist?.name}
                meta={defaultChecklist ? "Org default" : undefined}
                href="/configure/checklists"
              />
            </div>
          </Section>
        </div>
      )}
    </>
  );
}
