"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Avatar, Chip, Icon, YouConnectGlyph } from "@/components/atoms";
import { SegmentedControl } from "@/components/molecules";
import { cn, formatShortDate } from "@/lib/utils";
import { publishedVersion } from "@/lib/template-versions";
import { StepperModal, type Step } from "./StepperModal";
import {
  useOrderStore,
  useUsersStore,
  useReviewsStore,
  useTemplatesStore,
  ORDER_STEP,
  type OrderDraft,
} from "@/store";
import type { ReviewType, YcDelivery } from "@/types";

const DAY = 86400000;

// Property-type → review profile heuristic (drives which workbook layout a
// Technical review inherits). Most commercial appraisals fall through to
// Commercial; obvious residential markers map to Residential.
function profileForType(propertyType?: string): string {
  const t = (propertyType ?? "").toLowerCase();
  return /resid|1-4|1–4|sfr|condo|duplex|single.?family|townhom/.test(t)
    ? "Residential"
    : "Commercial";
}

const STEPS: Step[] = [
  { key: "source", label: "Source", icon: "connect" },
  { key: "configure", label: "Configure", icon: "settings" },
  { key: "summary", label: "Summary", icon: "check-circle" },
];

const PROP_TYPES = [
  "Office (Medical/Dental)",
  "Office (General)",
  "Retail (Anchored)",
  "Industrial (Warehouse)",
  "Self-storage",
  "Multifamily",
  "Hospitality",
  "Mixed-Use",
  "Special Purpose",
  "Going concern",
];

/** Demo "AI extraction" used when a standalone PDF is dropped (upload-first). */
const DEMO_EXTRACT = {
  property: {
    address: "1450 Corporate Center Dr, Lakeside 00000",
    propertyType: "Office (Medical/Dental)",
    lender: "Meridian Trust Bank, N.A.",
    loanNo: "4471-20",
    firm: "Cornerstone Valuation Group",
  },
  doc: { name: "Commercial Appraisal Report.pdf", pages: 74 },
};

const REVIEW_TYPE_META: Record<ReviewType, { title: string; output: string }> = {
  technical: {
    title: "Technical / Supplemental",
    output: "Findings → Reviewer Workbook",
  },
  administrative: {
    title: "Administrative",
    output: "Checklist → Signed attestation",
  },
};

/** Small accessible on/off toggle (no reusable switch atom exists yet). */
function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      className={cn("ord-switch", checked && "on")}
      onClick={onChange}
    >
      <span className="ord-switch-thumb" />
    </button>
  );
}

/** The global "Order a review" stepper, mounted once in the shell. */
export function OrderModal() {
  const router = useRouter();
  const { open, step, close, setStep, draft, loadDeliveries } = useOrderStore();
  const { users, fetchUsers } = useUsersStore();
  const addReview = useReviewsStore((s) => s.addReview);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      loadDeliveries();
      if (!users.length) fetchUsers();
    }
  }, [open, loadDeliveries, users.length, fetchUsers]);

  const assignee = users.find((u) => u.id === draft.assigneeId);
  const isSummary = step === ORDER_STEP.confirm;

  const canContinue =
    step === ORDER_STEP.source
      ? !!draft.property
      : step === ORDER_STEP.configure
        ? draft.reviewTypes.length >= 1
        : true;

  const submit = async () => {
    if (!draft.property) return;
    setSubmitting(true);
    const p = draft.property;
    const slaDueAt = draft.dueDate
      ? new Date(draft.dueDate).getTime()
      : (draft.slaDueAt ?? Date.now() + 7 * DAY);
    const review = await addReview({
      propertyAddress: p.address,
      propertyType: p.propertyType || "—",
      bank: p.lender,
      appraisalFirm: p.firm || "—",
      loanNo: p.loanNo,
      status: "running",
      reviewTypes: draft.reviewTypes,
      assigneeId: draft.assigneeId,
      source: draft.source ?? "manual",
      riskRating: null,
      openFindings: 0,
      flaggedCount: 0,
      worstSeverity: null,
      pipelineStage: 1,
      slaDueAt,
    });
    setSubmitting(false);
    close();
    router.push(`/reviews/${review.id}`);
  };

  return (
    <StepperModal
      open={open}
      onClose={close}
      title="Order a review"
      steps={STEPS}
      current={step}
      onNavigate={setStep}
      onBack={() => setStep(Math.max(0, step - 1))}
      onNext={() => setStep(Math.min(STEPS.length - 1, step + 1))}
      onSubmit={submit}
      submitLabel="Run"
      submitIcon="rocket"
      submitIconSide="left"
      nextDisabled={!canContinue}
      submitting={submitting}
    >
      {step === ORDER_STEP.source && <SourceStep />}
      {step === ORDER_STEP.configure && <ConfigureStep />}
      {isSummary && (
        <SummaryReview
          draft={draft}
          assigneeName={assignee?.name}
          onEdit={setStep}
        />
      )}
    </StepperModal>
  );
}

/* ============================ Step 1 — Source ============================ */

function SourceStep() {
  const { draft, deliveries, chooseSource, selectDelivery } = useOrderStore();
  const source = draft.source ?? "yc";

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <SegmentedControl
          value={source}
          onChange={(v) => chooseSource(v)}
          options={[
            { value: "yc", label: "From YouConnect" },
            { value: "manual", label: "Standalone upload" },
          ]}
        />
      </div>

      {source === "yc" ? (
        <YcInbox
          deliveries={deliveries}
          selectedId={draft.ycDeliveryId}
          onSelect={selectDelivery}
        />
      ) : (
        <UploadPane />
      )}
    </div>
  );
}

function YcInbox({
  deliveries,
  selectedId,
  onSelect,
}: {
  deliveries: YcDelivery[];
  selectedId: string | null;
  onSelect: (d: YcDelivery) => void;
}) {
  const [q, setQ] = useState("");
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    ref.current?.focus();
  }, []);

  const query = q.trim().toLowerCase();
  const rows = query
    ? deliveries.filter(
        (d) =>
          d.propertyAddress.toLowerCase().includes(query) ||
          d.loanNo.toLowerCase().includes(query) ||
          d.bank.toLowerCase().includes(query),
      )
    : deliveries;

  return (
    <div className="ord-inbox">
      <div className="ord-search">
        <Icon name="search" size={18} />
        <input
          ref={ref}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Filter inbox — or search all of YouConnect by address / loan #…"
        />
      </div>

      <div className="ord-list">
        {rows.map((d) => (
          <button
            key={d.id}
            className={cn("ord-deliv", selectedId === d.id && "sel")}
            onClick={() => onSelect(d)}
            aria-pressed={selectedId === d.id}
          >
            <span className="ord-deliv-ic">
              <Icon name="org" size={18} />
            </span>
            <span className="ord-deliv-main">
              <span className="ord-deliv-title">{d.propertyAddress}</span>
              <span className="ord-deliv-sub">
                Loan #{d.loanNo} · {d.propertyType} · delivered{" "}
                {formatShortDate(d.deliveredAt)} · {d.bank}
              </span>
            </span>
            {d.status === "new" ? (
              <Chip tone="info">New</Chip>
            ) : (
              <Chip tone="neutral">In queue</Chip>
            )}
          </button>
        ))}
        {rows.length === 0 && (
          <div className="ord-empty">
            {deliveries.length === 0
              ? "Loading deliveries…"
              : `No deliveries match “${q}”.`}
          </div>
        )}
      </div>

      <div className="ord-foot-note">
        <Icon name="connect" size={14} />
        <span>
          Appraisals delivered in YouConnect appear here automatically. Orders
          launched <strong>from</strong> YouConnect arrive pre-selected.
        </span>
      </div>
    </div>
  );
}

function UploadPane() {
  const { draft, parseUpload, setUploadField } = useOrderStore();
  const [parsing, setParsing] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const runParse = () => {
    if (parsing) return;
    setParsing(true);
    timer.current = setTimeout(() => {
      parseUpload(DEMO_EXTRACT.property, DEMO_EXTRACT.doc);
      setParsing(false);
    }, 750);
  };

  // Upload-first: the dropzone is the hero; on parse the AI-extracted property
  // fields appear (editable) inside a white card.
  if (!draft.uploadParsed) {
    return (
      <button
        type="button"
        className={cn("ord-drop", parsing && "busy")}
        onClick={runParse}
        disabled={parsing}
      >
        {parsing ? (
          <>
            <span className="ui-spinner" />
            <div className="ord-drop-title">Parsing appraisal…</div>
            <p>Extracting property, lender and loan details.</p>
          </>
        ) : (
          <>
            <Icon name="download" size={30} />
            <div className="ord-drop-title">Drag &amp; drop the appraisal PDF</div>
            <p>
              or <span className="ord-link">browse</span> — we’ll read the
              property details for you.
            </p>
          </>
        )}
      </button>
    );
  }

  const p = draft.property!;
  return (
    <div className="ord-card ord-pad">
      {draft.doc && (
        <div className="ord-filepill">
          <Icon name="pdf" size={18} />
          <span>
            <strong>{draft.doc.name}</strong> · {draft.doc.pages} pages
          </span>
          <span className="ord-parsed">
            <Icon name="check-circle" size={15} /> parsed
          </span>
        </div>
      )}

      <p className="ord-extract-note">
        <Icon name="ai" size={14} /> Auto-filled from the appraisal — review and
        correct before continuing.
      </p>

      <div className="ord-form">
        <label className="field" style={{ gridColumn: "1 / 3" }}>
          <span>Property address</span>
          <input
            value={p.address}
            onChange={(e) => setUploadField("address", e.target.value)}
          />
        </label>
        <label className="field">
          <span>Property type</span>
          <select
            value={p.propertyType}
            onChange={(e) => setUploadField("propertyType", e.target.value)}
          >
            {PROP_TYPES.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Client / Lender</span>
          <input
            value={p.lender}
            onChange={(e) => setUploadField("lender", e.target.value)}
          />
        </label>
        <label className="field">
          <span>Loan number</span>
          <input
            value={p.loanNo}
            onChange={(e) => setUploadField("loanNo", e.target.value)}
          />
        </label>
        <label className="field">
          <span>Appraiser firm</span>
          <input
            value={p.firm}
            onChange={(e) => setUploadField("firm", e.target.value)}
          />
        </label>
      </div>
    </div>
  );
}

/* ========================== Step 2 — Configure ========================== */

function ConfigureStep() {
  const {
    draft,
    toggleType,
    setChecklist,
    setAssignee,
    setDue,
    setPriority,
    toggleAutoReject,
  } = useOrderStore();
  const { users } = useUsersStore();
  const { checklists, layouts, fetchTemplates } = useTemplatesStore();
  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  // Org default for auto-reject is ON; turning it off = a per-order override.
  const overridden = !draft.autoReject;

  const hasTech = draft.reviewTypes.includes("technical");
  const hasAdmin = draft.reviewTypes.includes("administrative");

  // Admin checklist: default to the org default; an explicit pick is an override.
  const orgDefaultChecklist = checklists.find((c) => c.isDefault);
  const selectedChecklistId = draft.checklistId ?? orgDefaultChecklist?.id ?? "";
  const isDefaultChecklist =
    !draft.checklistId || draft.checklistId === orgDefaultChecklist?.id;

  // Workbook layout a Technical review inherits, from the property's profile.
  const profile = profileForType(draft.property?.propertyType);
  const inheritedLayout =
    layouts.find((l) => l.isDefault && l.profile === profile) ??
    layouts.find((l) => l.profile === profile) ??
    layouts.find((l) => l.isDefault);
  const inheritedLayoutPub = inheritedLayout
    ? publishedVersion(inheritedLayout.versions)
    : undefined;

  return (
    <div className="ord-card ord-config">
      <section className="ord-sec">
        <h3 className="ord-h">Review type</h3>
        <div className="ord-typegrid">
          {(["technical", "administrative"] as ReviewType[]).map((t) => {
            const on = draft.reviewTypes.includes(t);
            return (
              <button
                key={t}
                className={cn("ord-typecard", on && "sel")}
                onClick={() => toggleType(t)}
                aria-pressed={on}
              >
                <span className={cn("ord-check", on && "on")}>
                  {on && <Icon name="check" size={13} />}
                </span>
                <span>
                  <span className="ord-typecard-title">
                    {REVIEW_TYPE_META[t].title}
                  </span>
                  <span className="ord-typecard-sub">
                    {REVIEW_TYPE_META[t].output}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {(hasTech || hasAdmin) && (
        <section className="ord-sec">
          <h3 className="ord-h">Templates for this review</h3>
          <div className="ord-tpls">
            {hasTech && (
              <div className="ord-tpl-item">
                <span className="ord-tpl-ic">
                  <Icon name="book" size={16} />
                </span>
                <div className="ord-tpl-body">
                  <div className="ord-tpl-name">
                    {inheritedLayout?.name ?? "Org workbook layout"}
                    {inheritedLayoutPub && (
                      <span className="ord-tpl-ver">v{inheritedLayoutPub.version}</span>
                    )}
                  </div>
                  <div className="ord-tpl-meta">
                    Inherited from the {profile} org layout — editable per review in
                    the Builder
                  </div>
                </div>
                <Chip tone="neutral">Inherited</Chip>
              </div>
            )}

            {hasAdmin && (
              <div className="ord-tpl-item">
                <span className="ord-tpl-ic">
                  <Icon name="checklist" size={16} />
                </span>
                <label className="field ord-tpl-field">
                  <span>Administrative checklist</span>
                  <select
                    value={selectedChecklistId}
                    onChange={(e) => setChecklist(e.target.value)}
                  >
                    {checklists.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                        {c.isDefault ? " — org default" : ""}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            )}
          </div>

          {hasAdmin && (
            <p className={cn("ord-tpl-hint", !isDefaultChecklist && "is-override")}>
              {isDefaultChecklist ? (
                <>
                  <Icon name="ai" size={13} /> AI-recommended — your org default
                  checklist. Change it only if this property needs a different form.
                </>
              ) : (
                <>
                  <Icon name="info" size={13} /> Per-order override — the org default
                  is unchanged (audited, this order only).
                </>
              )}
            </p>
          )}
        </section>
      )}

      <section className="ord-sec">
        <h3 className="ord-h">Reviewer &amp; schedule</h3>
        <div className="ord-form">
          <label className="field" style={{ gridColumn: "1 / 3" }}>
            <span>Assigned reviewer</span>
            <select
              value={draft.assigneeId}
              onChange={(e) => setAssignee(e.target.value)}
            >
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}, {u.designation}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Due date</span>
            <input
              type="date"
              value={draft.dueDate}
              onChange={(e) => setDue(e.target.value)}
            />
          </label>
          <label className="field">
            <span>Priority</span>
            <select
              value={draft.priority}
              onChange={(e) => setPriority(e.target.value as "normal" | "high")}
            >
              <option value="normal">Normal</option>
              <option value="high">High</option>
            </select>
          </label>
        </div>
        {draft.inheritedAssignee && (
          <p className="ord-inherit">
            <YouConnectGlyph size={13} /> Inherited from YouConnect — changeable.
            SLA timer unaffected.
          </p>
        )}
      </section>

      <section className="ord-sec">
        <h3 className="ord-h">Organization defaults</h3>
        <div className="ord-switch-row">
          <span className="ord-switch-text">
            <strong>Auto-reject quality gate</strong>
            <span className="ord-sub">
              SLA from YouConnect delivery · managed in Settings
            </span>
          </span>
          <Toggle
            checked={draft.autoReject}
            onChange={toggleAutoReject}
            label="Auto-reject quality gate"
          />
        </div>
        {overridden && (
          <p className="ord-override-note">
            <Icon name="info" size={14} /> This override applies to this order
            only — it’s noted in the audit trail and doesn’t change your org
            default.
          </p>
        )}
      </section>
    </div>
  );
}

/* ===================== Step 3 — Summary (review + run) ===================== */

/** One reviewed section with a header and an Edit button that jumps to its step. */
function SumSection({
  title,
  onEdit,
  children,
}: {
  title: string;
  onEdit: () => void;
  children: React.ReactNode;
}) {
  return (
    <section className="ord-sec">
      <div className="ord-sec-head">
        <h3 className="ord-h">{title}</h3>
        <button type="button" className="ord-sum-edit" onClick={onEdit}>
          <Icon name="edit" size={14} /> Edit
        </button>
      </div>
      {children}
    </section>
  );
}

function SummaryReview({
  draft,
  assigneeName,
  onEdit,
}: {
  draft: OrderDraft;
  assigneeName?: string;
  onEdit: (step: number) => void;
}) {
  const p = draft.property;
  const dueAt = draft.dueDate ? new Date(draft.dueDate).getTime() : draft.slaDueAt;

  const { checklists, layouts } = useTemplatesStore();
  const orgDefaultChecklist = checklists.find((c) => c.isDefault);
  const selectedChecklist =
    checklists.find((c) => c.id === draft.checklistId) ?? orgDefaultChecklist;
  const checklistIsDefault =
    !draft.checklistId || draft.checklistId === orgDefaultChecklist?.id;
  const profile = profileForType(p?.propertyType);
  const inheritedLayout =
    layouts.find((l) => l.isDefault && l.profile === profile) ??
    layouts.find((l) => l.isDefault);

  return (
    <div className="ord-card ord-summary">
      <SumSection title="Appraisal" onEdit={() => onEdit(ORDER_STEP.source)}>
        {p ? (
          <>
            <div className="ord-sum-prop">
              <div className="ord-sum-addr">{p.address}</div>
              <div className="ord-sum-meta">
                {[p.propertyType, p.firm, `Loan #${p.loanNo}`]
                  .filter(Boolean)
                  .join(" · ")}
              </div>
            </div>

            {draft.doc && (
              <div className="ord-sum-doc">
                <Icon name="pdf" size={16} />
                <span className="ord-sum-doc-name">{draft.doc.name}</span>
                <span className="ord-sum-doc-pages">{draft.doc.pages}p</span>
              </div>
            )}
            {draft.source === "yc" && draft.doc?.viaApi && (
              <div className="ord-lock">
                <span>
                  <Icon name="sso" size={13} /> From YouConnect — read-only
                </span>
                <span className="ord-link">Report mismatch</span>
              </div>
            )}

            {draft.isSecondReview && (
              <div className="ord-warn">
                <Icon name="warn" size={16} />
                <span>
                  <strong>Already in your queue</strong> — continue only for an
                  intentional second review.
                </span>
              </div>
            )}
          </>
        ) : (
          <p className="ord-sum-muted">No appraisal selected.</p>
        )}
      </SumSection>

      <SumSection title="Configure" onEdit={() => onEdit(ORDER_STEP.configure)}>
        <div className="ord-sum-sec">Review type</div>
        {draft.reviewTypes.length ? (
          <div className="ord-sum-chips">
            {draft.reviewTypes.includes("technical") && (
              <Chip tone="accent">Technical</Chip>
            )}
            {draft.reviewTypes.includes("administrative") && (
              <Chip tone="accent">Administrative</Chip>
            )}
          </div>
        ) : (
          <p className="ord-sum-muted">Choose at least one</p>
        )}
        {draft.reviewTypes.includes("technical") && inheritedLayout && (
          <div className="ord-sum-row" style={{ marginTop: 8 }}>
            <Icon name="book" size={15} />
            <span>Workbook</span>
            <span className="ord-sum-val">{inheritedLayout.name}</span>
          </div>
        )}
        {draft.reviewTypes.includes("administrative") && selectedChecklist && (
          <div className="ord-sum-row">
            <Icon name="checklist" size={15} />
            <span>Checklist</span>
            <span className="ord-sum-val">
              {selectedChecklist.name}
              {!checklistIsDefault && " (override)"}
            </span>
          </div>
        )}

        <div className="ord-sum-sec">Reviewer &amp; schedule</div>
        <div className="ord-sum-reviewer">
          <Avatar
            initials={(assigneeName ?? "?")
              .split(" ")
              .map((s) => s[0])
              .slice(0, 2)
              .join("")}
            size={26}
            tone="soft"
          />
          <span>{assigneeName ?? "Unassigned"}</span>
        </div>
        <div className="ord-sum-row">
          <Icon name="clock" size={15} />
          <span>{draft.dueDate ? "Due" : "SLA due"}</span>
          <span className="ord-sum-val">
            {dueAt ? formatShortDate(dueAt) : "On YC SLA"}
          </span>
        </div>
        {draft.priority === "high" && (
          <div className="ord-sum-chips" style={{ marginTop: 8 }}>
            <Chip tone="flag">High priority</Chip>
          </div>
        )}

        <div className="ord-sum-sec">Options</div>
        <p className="ord-sum-muted">
          Auto-reject {draft.autoReject ? "on" : "off"}
          {!draft.autoReject && " · overridden (audited, this order only)"}
        </p>
      </SumSection>
    </div>
  );
}
