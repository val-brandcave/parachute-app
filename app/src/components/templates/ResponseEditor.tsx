"use client";

import { useRef } from "react";
import { Button, Input, Label, Textarea } from "@/components/atoms";
import type { TemplateScope } from "@/types";
import { MergeFieldChips } from "./MergeFieldChips";
import { LivePreview } from "./LivePreview";

interface EditorDraft {
  id?: string;
  scope: TemplateScope;
  group: string;
  name: string;
  body: string;
}

// Detail pane: the editable surface (create == edit). Name + group + body, with
// click-to-insert merge chips and an inline live preview. Save is the single
// navy primary; Delete is a low-emphasis danger action.
export function ResponseEditor({
  draft,
  isNew,
  canSave,
  groupOptions,
  onChange,
  onSave,
  onDelete,
}: {
  draft: EditorDraft;
  isNew: boolean;
  canSave: boolean;
  groupOptions: string[];
  onChange: (patch: Partial<EditorDraft>) => void;
  onSave: () => void;
  onDelete: () => void;
}) {
  const taRef = useRef<HTMLTextAreaElement>(null);

  const insert = (token: string) => {
    const ta = taRef.current;
    if (!ta) {
      onChange({ body: draft.body + token });
      return;
    }
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const next = draft.body.slice(0, start) + token + draft.body.slice(end);
    onChange({ body: next });
    requestAnimationFrame(() => {
      ta.focus();
      const pos = start + token.length;
      ta.setSelectionRange(pos, pos);
    });
  };

  return (
    <div className="resp-editor">
      <div className="resp-editor-body scroll">
        <div className="tpl-field">
          <Label htmlFor="rt-name">Template name</Label>
          <Input
            id="rt-name"
            value={draft.name}
            placeholder="e.g. Concur — adequately supported"
            onChange={(e) => onChange({ name: e.target.value })}
          />
        </div>

        <div className="tpl-field">
          <Label htmlFor="rt-group">Group</Label>
          <Input
            id="rt-group"
            list="rt-groups"
            value={draft.group}
            placeholder="e.g. Concur"
            onChange={(e) => onChange({ group: e.target.value })}
          />
          <datalist id="rt-groups">
            {groupOptions.map((g) => (
              <option key={g} value={g} />
            ))}
          </datalist>
        </div>

        <div className="tpl-field">
          <Label htmlFor="rt-body">Body — merge fields fill from the finding</Label>
          <Textarea
            id="rt-body"
            ref={taRef}
            rows={5}
            value={draft.body}
            placeholder="We concur with the appraiser's treatment of {{topic}}…"
            onChange={(e) => onChange({ body: e.target.value })}
          />
          <MergeFieldChips onInsert={insert} />
        </div>

        <LivePreview body={draft.body} />
      </div>

      <div className="resp-editor-foot">
        <Button
          variant="ghost"
          size="sm"
          iconLeft="trash"
          onClick={onDelete}
          className="resp-delete"
        >
          {isNew ? "Discard" : "Delete"}
        </Button>
        <Button iconLeft="check" onClick={onSave} disabled={!canSave}>
          {isNew ? "Create template" : "Save changes"}
        </Button>
      </div>
    </div>
  );
}
