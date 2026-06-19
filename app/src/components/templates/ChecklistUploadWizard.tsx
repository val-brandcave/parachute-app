"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { StepperModal, type Step } from "@/components/organisms";
import { Icon, Input, Label, Spinner, Chip } from "@/components/atoms";
import { useTemplatesStore } from "@/store";
import { generateId, type ChecklistTemplateItem } from "@/types";

const STEPS: Step[] = [
  { key: "upload", label: "Upload", icon: "upload" },
  { key: "extract", label: "AI extract", icon: "ai" },
  { key: "review", label: "Review mapping", icon: "checklist" },
  { key: "publish", label: "Publish", icon: "publish" },
];

// Simulated AI extraction output. In production this comes from the document
// pipeline; here it stands in so the flow is demonstrable end-to-end.
function sampleExtract(): ChecklistTemplateItem[] {
  const mk = (
    group: string,
    question: string,
    type: ChecklistTemplateItem["type"],
    map: ChecklistTemplateItem["map"] = "ok",
    hint?: string,
  ): ChecklistTemplateItem => ({
    id: generateId(),
    group,
    orig: question,
    question,
    type,
    map,
    requireCitation: type === "binary",
    hint,
  });
  return [
    mk("Report & Compliance", "Is the report signed by a certified appraiser?", "binary"),
    mk("Report & Compliance", "Are the effective and report dates stated?", "binary"),
    mk("Report & Compliance", "Does the report conform with USPAP / FIRREA?", "binary"),
    mk("Valuation Approaches", "Is the income approach adequately supported?", "qualitative"),
    mk("Valuation Approaches", "Are at least three comparable sales included?", "binary"),
    mk(
      "Valuation Approaches",
      "Sales comp approach used and supported? Cap rate supported?",
      "qualitative",
      "warn",
      "Double-barrelled: two questions detected in one row — split before publishing.",
    ),
    mk("Bank Policy & Special Considerations", "Are environmental concerns addressed?", "qualitative"),
    mk("Bank Policy & Special Considerations", "Is a flood-zone determination included?", "binary"),
  ];
}

export function ChecklistUploadWizard({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const addChecklist = useTemplatesStore((s) => s.addChecklist);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [fileName, setFileName] = useState("");
  const [extract, setExtract] = useState<"idle" | "running" | "done">("idle");
  const [items, setItems] = useState<ChecklistTemplateItem[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const reset = () => {
    setStep(0);
    setName("");
    setFileName("");
    setExtract("idle");
    setItems([]);
    setSubmitting(false);
  };

  const close = () => {
    reset();
    onClose();
  };

  const onPickFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFileName(f.name);
    if (!name) setName(f.name.replace(/\.docx?$/i, "").replace(/[_-]+/g, " "));
  };

  const runExtract = () => {
    setExtract("running");
    // Simulated pipeline latency; setState in the timer callback is deferred
    // (not a synchronous effect write).
    setTimeout(() => {
      setItems(sampleExtract());
      setExtract("done");
    }, 1500);
  };

  const next = () => {
    if (step === 0) {
      setStep(1);
      if (extract === "idle") runExtract();
    } else {
      setStep((s) => Math.min(s + 1, STEPS.length - 1));
    }
  };

  const submit = async () => {
    setSubmitting(true);
    const created = await addChecklist({
      name: name.trim() || "Untitled checklist",
      sourceFile: fileName || "uploaded.docx",
      items,
    });
    close();
    router.push(`/templates/checklist/${created.id}`);
  };

  const warnCount = items.filter((i) => i.map === "warn").length;
  const nextDisabled =
    (step === 0 && !fileName) || (step === 1 && extract !== "done");

  return (
    <StepperModal
      open={open}
      onClose={close}
      eyebrow="New compliance checklist"
      title="Upload & map a checklist"
      steps={STEPS}
      current={step}
      onNavigate={(i) => setStep(i)}
      onBack={() => setStep((s) => Math.max(0, s - 1))}
      onNext={next}
      onSubmit={submit}
      submitLabel="Publish checklist"
      submitIcon="publish"
      nextDisabled={nextDisabled}
      submitting={submitting}
    >
      {step === 0 && (
        <div className="ckw-step">
          <button
            type="button"
            className={`ckw-drop${fileName ? " has-file" : ""}`}
            onClick={() => fileInputRef.current?.click()}
          >
            <Icon name={fileName ? "document" : "upload"} size={30} />
            <div className="ckw-drop-main">
              {fileName ? fileName : "Drop your bank's checklist .docx here"}
            </div>
            <div className="ckw-drop-sub">
              {fileName
                ? "Click to choose a different file"
                : "or click to browse — the AI extracts and maps each item"}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".doc,.docx"
              hidden
              onChange={onPickFile}
            />
          </button>

          <div className="tpl-field" style={{ marginTop: 22 }}>
            <Label htmlFor="ckw-name">Checklist name</Label>
            <Input
              id="ckw-name"
              value={name}
              placeholder="e.g. Demo Bank — Commercial Review Form"
              onChange={(e) => setName(e.target.value)}
            />
          </div>
        </div>
      )}

      {step === 1 && (
        <div className="ckw-step ckw-extract">
          {extract === "running" ? (
            <>
              <Spinner />
              <div className="ckw-extract-title">Extracting checklist items…</div>
              <div className="ckw-extract-sub">
                Reading {fileName}, normalizing questions and detecting answer types.
              </div>
            </>
          ) : (
            <>
              <div className="ckw-extract-badge">
                <Icon name="check-circle" size={34} />
              </div>
              <div className="ckw-extract-title">
                Extracted {items.length} items
              </div>
              <div className="ckw-extract-sub">
                {warnCount > 0
                  ? `${warnCount} item needs attention — you can fix mappings after publishing.`
                  : "All items mapped cleanly."}
              </div>
            </>
          )}
        </div>
      )}

      {step === 2 && (
        <div className="ckw-step">
          <div className="ckw-review-head">
            <span>{items.length} items extracted</span>
            {warnCount > 0 && <Chip tone="flag" dot>{warnCount} need attention</Chip>}
          </div>
          <div className="ckw-review-list">
            {items.map((it, i) => (
              <div key={it.id} className={`ckw-review-row${it.map === "warn" ? " warn" : ""}`}>
                <span className="ckw-review-num">{i + 1}</span>
                <span className="ckw-review-q">{it.question}</span>
                <Chip tone={it.map === "warn" ? "flag" : "pass"} dot>
                  {it.map === "warn" ? "Review" : "Mapped"}
                </Chip>
              </div>
            ))}
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="ckw-step ckw-publish">
          <Icon name="publish" size={30} />
          <div className="ckw-extract-title">Ready to publish</div>
          <div className="ckw-extract-sub">
            “{name || "Untitled checklist"}” will publish as v1 with {items.length}{" "}
            items. New Administrative orders will use it; in-flight reviews keep
            their current version.
          </div>
        </div>
      )}
    </StepperModal>
  );
}
