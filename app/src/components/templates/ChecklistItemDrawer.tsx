"use client";

import { useState } from "react";
import { BottomSheet } from "@/components/organisms";
import { Button, Icon, Label, Textarea } from "@/components/atoms";
import { SegmentedControl } from "@/components/molecules";
import type { ChecklistItemType, ChecklistTemplateItem } from "@/types";

const TYPES: { value: ChecklistItemType; label: string }[] = [
  { value: "binary", label: "Binary (yes / no)" },
  { value: "qualitative", label: "Qualitative" },
];

// Inner form owns the editable copy. It's keyed by item id and only mounts while
// the sheet is open, so each open starts from a fresh draft — no effects or
// render-time resets needed.
function ItemForm({
  item,
  onSave,
  onSplit,
  onCancel,
}: {
  item: ChecklistTemplateItem;
  onSave: (item: ChecklistTemplateItem) => void;
  onSplit: (item: ChecklistTemplateItem) => void;
  onCancel: () => void;
}) {
  const [draft, setDraft] = useState<ChecklistTemplateItem>(item);
  const flagged = draft.map === "warn";
  const canSave = draft.question.trim().length > 0;

  return (
    <>
      {flagged && draft.hint && (
        <div className="ck-drawer-hint">
          <Icon name="warn" size={16} />
          <span>{draft.hint}</span>
        </div>
      )}

      <div className="tpl-field">
        <Label htmlFor="ck-q">AI-normalized question</Label>
        <Textarea
          id="ck-q"
          rows={3}
          value={draft.question}
          placeholder="e.g. Is the report signed by a state-certified general appraiser?"
          onChange={(e) => setDraft({ ...draft, question: e.target.value })}
        />
        {draft.orig && (
          <div className="ck-drawer-src">Source text: “{draft.orig}”</div>
        )}
      </div>

      <div className="ck-drawer-grid">
        <div className="tpl-field">
          <Label>Answer type</Label>
          <SegmentedControl
            options={TYPES}
            value={draft.type}
            onChange={(v) => setDraft({ ...draft, type: v })}
          />
        </div>

        <label className="ck-cite">
          <input
            type="checkbox"
            checked={draft.requireCitation}
            onChange={(e) =>
              setDraft({ ...draft, requireCitation: e.target.checked })
            }
          />
          <span>Require a page citation in the AI answer</span>
        </label>
      </div>

      <div className="ck-drawer-actions">
        {flagged && (
          <Button
            variant="outline"
            size="sm"
            iconLeft="split"
            onClick={() => onSplit(draft)}
            className="ck-split-btn"
          >
            Split item
          </Button>
        )}
        <div style={{ flex: 1 }} />
        <Button variant="ghost" size="sm" onClick={onCancel}>
          Cancel
        </Button>
        <Button iconLeft="check" disabled={!canSave} onClick={() => onSave(draft)}>
          Save mapping
        </Button>
      </div>
    </>
  );
}

// Focused edit surface for a single checklist item — the canonical BottomSheet
// use (a task on top of the mapper).
export function ChecklistItemDrawer({
  open,
  item,
  isNew,
  onClose,
  onSave,
  onSplit,
}: {
  open: boolean;
  item: ChecklistTemplateItem | null;
  isNew: boolean;
  onClose: () => void;
  onSave: (item: ChecklistTemplateItem) => void;
  onSplit: (item: ChecklistTemplateItem) => void;
}) {
  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      size="half"
      eyebrow={item?.group}
      title={isNew ? "Add checklist item" : "Edit item mapping"}
    >
      {item && (
        <ItemForm
          key={item.id}
          item={item}
          onSave={onSave}
          onSplit={onSplit}
          onCancel={onClose}
        />
      )}
    </BottomSheet>
  );
}
