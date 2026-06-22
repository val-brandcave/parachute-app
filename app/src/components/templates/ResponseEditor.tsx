"use client";

import { useEffect, useRef, useState } from "react";
import { Button, ConfirmDialog, Icon, Input, Label, Textarea } from "@/components/atoms";
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
  dirty,
  canSave,
  groupOptions,
  onChange,
  onSave,
  onDelete,
}: {
  draft: EditorDraft;
  isNew: boolean;
  dirty: boolean;
  canSave: boolean;
  groupOptions: string[];
  onChange: (patch: Partial<EditorDraft>) => void;
  onSave: () => void;
  onDelete: () => void;
}) {
  const taRef = useRef<HTMLTextAreaElement>(null);
  const [confirmRemove, setConfirmRemove] = useState(false);

  // Existing templates always confirm before deleting. A new draft only needs a
  // confirm if there's unsaved content to lose; an untouched blank just discards.
  const onRemoveClick = () => {
    if (isNew && !dirty) onDelete();
    else setConfirmRemove(true);
  };

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
          <GroupCombobox
            value={draft.group}
            options={groupOptions}
            onChange={(group) => onChange({ group })}
          />
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
          onClick={onRemoveClick}
          className="resp-delete"
        >
          {isNew ? "Discard" : "Delete"}
        </Button>
        <Button iconLeft="check" onClick={onSave} disabled={!canSave}>
          {isNew ? "Create template" : "Save changes"}
        </Button>
      </div>

      <ConfirmDialog
        open={confirmRemove}
        danger
        title={isNew ? "Discard this draft?" : "Delete this template?"}
        message={
          isNew
            ? "Your new template hasn’t been saved yet. Discarding will lose it."
            : `“${draft.name}” will be permanently removed. This can’t be undone.`
        }
        confirmLabel={isNew ? "Discard" : "Delete"}
        cancelLabel="Keep editing"
        onConfirm={() => {
          setConfirmRemove(false);
          onDelete();
        }}
        onCancel={() => setConfirmRemove(false)}
      />
    </div>
  );
}

/**
 * Group picker: a combobox over the existing groups. Opening (focus or chevron)
 * lists every group to browse; typing filters and offers to create a new group.
 * Replaces a native <datalist>, whose popup collapsed to the single value that
 * matched a pre-filled field — so it read as a tooltip, not a real dropdown.
 */
function GroupCombobox({
  value,
  options,
  onChange,
}: {
  value: string;
  options: string[];
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [filtering, setFiltering] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const wrapRef = useRef<HTMLDivElement>(null);

  const close = () => {
    setOpen(false);
    setCreating(false);
    setNewName("");
  };

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) close();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const q = value.trim().toLowerCase();
  // Browse mode (chevron / focus) shows everything; typing narrows the list.
  const shown = filtering && q ? options.filter((o) => o.toLowerCase().includes(q)) : options;
  const exact = options.some((o) => o.toLowerCase() === q);

  const pick = (g: string) => {
    onChange(g);
    setFiltering(false);
    close();
  };

  return (
    <div className="combo" ref={wrapRef}>
      <Input
        id="rt-group"
        className="combo-input"
        value={value}
        placeholder="e.g. Concur"
        autoComplete="off"
        role="combobox"
        aria-expanded={open}
        onChange={(e) => {
          onChange(e.target.value);
          setFiltering(true);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
      />
      <button
        type="button"
        className="combo-chevron"
        aria-label={open ? "Hide groups" : "Show groups"}
        aria-expanded={open}
        onClick={() => {
          setFiltering(false);
          if (open) close();
          else setOpen(true);
        }}
      >
        <Icon name="chevron-down" size={16} />
      </button>

      {open && (
        <div className="combo-pop scroll" role="listbox">
          {creating ? (
            // Inline "new group" creator — the name becomes this template's
            // group and shows up in the list once saved (groups are implicit).
            <div className="combo-create">
              <Input
                className="combo-create-input"
                autoFocus
                value={newName}
                placeholder="New group name"
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    if (newName.trim()) pick(newName.trim());
                  } else if (e.key === "Escape") {
                    e.stopPropagation();
                    setCreating(false);
                    setNewName("");
                  }
                }}
              />
              <button
                type="button"
                className="combo-create-confirm"
                aria-label="Create group"
                disabled={!newName.trim()}
                onClick={() => newName.trim() && pick(newName.trim())}
              >
                <Icon name="check" size={16} />
              </button>
            </div>
          ) : (
            <>
              {shown.map((o) => (
                <button
                  key={o}
                  type="button"
                  role="option"
                  aria-selected={o === value}
                  className="ui-menu-item"
                  onClick={() => pick(o)}
                >
                  <span className="ui-menu-check">
                    {o === value && <Icon name="check" size={15} />}
                  </span>
                  {o}
                </button>
              ))}
              {filtering && q && !exact ? (
                // Quick path while typing a brand-new name.
                <button type="button" className="ui-menu-item combo-newgroup" onClick={() => pick(value.trim())}>
                  <Icon name="add" size={16} />
                  Create “{value.trim()}”
                </button>
              ) : (
                // Always-visible entry point when browsing.
                <button
                  type="button"
                  className="ui-menu-item combo-newgroup"
                  onClick={() => {
                    setCreating(true);
                    setNewName("");
                  }}
                >
                  <Icon name="add" size={16} />
                  New group
                </button>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
