"use client";

import { useState } from "react";
import { Button, Textarea } from "@/components/atoms";
import { fillTemplate } from "@/lib/utils";
import { ResponseTemplatePicker } from "./ResponseTemplatePicker";
import type { Finding, ResponseTemplate } from "@/types";

export type ComposerMode = "override" | "rejected" | "commented";

const COPY: Record<ComposerMode, { title: string; placeholder: string; cta: string }> = {
  rejected: {
    title: "Reason for rejecting",
    placeholder: "Why the appraiser must revise this — batched into the return letter…",
    cta: "Reject & request revision",
  },
  override: {
    title: "Your edit",
    placeholder: "Your corrected wording — the finding stands, phrased in your words…",
    cta: "Save edit",
  },
  commented: {
    title: "Comment",
    placeholder: "A note recorded against this finding in the workbook…",
    cta: "Save comment",
  },
};

/**
 * The disposition composer. Reject and Disagree-&-edit require a reason; Comment
 * is free-form. A response-template dropdown (org library + the reviewer's own
 * voice) seeds the textarea with merge-filled boilerplate, which the reviewer
 * then edits — wiring the `ResponseTemplate`s the spec calls for.
 */
export function ResponseComposer({
  mode,
  finding,
  property,
  responses,
  initialText,
  onSave,
  onCancel,
  showAppliedHint = true,
}: {
  mode: ComposerMode;
  finding: Finding;
  property: string;
  responses: ResponseTemplate[];
  initialText: string;
  onSave: (text: string, templateId?: string) => void;
  onCancel: () => void;
  /** Show the "Template applied — edit freely" hint. Off where a decision zone
   *  already surfaces the template used (the run-flow accordion). */
  showAppliedHint?: boolean;
}) {
  const [text, setText] = useState(initialText);
  const [templateId, setTemplateId] = useState<string | undefined>(undefined);
  const copy = COPY[mode];
  const reasonRequired = mode !== "commented";
  const canSave = reasonRequired ? text.trim().length > 0 : true;

  const applyTemplate = (t: ResponseTemplate) => {
    setText(fillTemplate(t.body, { property, page: finding.page, topic: finding.category }));
    setTemplateId(t.id);
  };

  return (
    <div className={`fm-composer fm-composer--${mode}`}>
      <div className="fm-composer-head">
        <span className="fm-composer-title">{copy.title}</span>
        <ResponseTemplatePicker responses={responses} onPick={applyTemplate} />
      </div>
      <Textarea
        autoFocus
        value={text}
        placeholder={copy.placeholder}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && (e.metaKey || e.ctrlKey) && canSave)
            onSave(text.trim(), templateId);
        }}
      />
      <div className="fm-composer-foot">
        {templateId && showAppliedHint && (
          <span className="fm-composer-applied">Template applied — edit freely</span>
        )}
        <div className="fm-composer-actions">
          <Button variant="ghost" size="sm" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            variant={mode === "rejected" ? "danger" : "primary"}
            size="sm"
            disabled={!canSave}
            onClick={() => onSave(text.trim(), templateId)}
          >
            {copy.cta}
          </Button>
        </div>
      </div>
    </div>
  );
}
