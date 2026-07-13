"use client";

import { useEffect, useRef, useState } from "react";
import {
  Button,
  ConfirmDialog,
  Icon,
  Input,
  Label,
  Modal,
  Textarea,
} from "@/components/atoms";
import { cn } from "@/lib/utils";
import type { ResponseTemplate, TemplateScope } from "@/types";
import { MergeFieldChips } from "./MergeFieldChips";
import { LivePreview } from "./LivePreview";
import type { ResponseDraft } from "@/app/(shell)/configure/responses/hooks/useResponseLibrary";

const SCOPE_OPTIONS: { value: TemplateScope; label: string }[] = [
  { value: "org", label: "Org library" },
  { value: "mine", label: "Personal library" },
];

const SCOPE_HINT: Record<TemplateScope, string> = {
  org: "Shared across your firm — everyone on the team can use it.",
  mine: "Private to you — only you see this snippet.",
};

/**
 * Add / Edit a response template. A large two-column modal: the form on the
 * left, a sticky live preview on the right. Carries the library selector
 * (Org / Personal) so a template can be created into — or moved between —
 * libraries, and doubles as both the create (blank draft) and edit surface.
 *
 * Two guard dialogs are retained from the old inline editor: a DISCARD prompt
 * when closing with unsaved edits, and a DELETE confirm. Both are real
 * ConfirmDialogs; `requestClose` no-ops while either is open so the main modal
 * never closes out from under a confirm (and stray Escapes dismiss only it).
 */
export function ResponseModal({
  open,
  editing,
  defaultScope,
  groupOptions,
  onClose,
  onSave,
  onDelete,
}: {
  open: boolean;
  editing: ResponseTemplate | null;
  defaultScope: TemplateScope;
  groupOptions: string[];
  onClose: () => void;
  onSave: (draft: ResponseDraft) => Promise<unknown>;
  onDelete: (id: string) => Promise<unknown>;
}) {
  const isEdit = !!editing;

  // The working draft is seeded straight from props via lazy initializers. The
  // parent passes a fresh `key` each time it opens the modal, so this component
  // remounts and re-seeds per open — no reset effect (which would trip the
  // no-setState-in-effect lint / cascading-render rule).
  const [scope, setScope] = useState<TemplateScope>(editing?.scope ?? defaultScope);
  const [group, setGroup] = useState(editing?.group ?? "Other");
  const [name, setName] = useState(editing?.name ?? "");
  const [body, setBody] = useState(editing?.body ?? "");
  const [confirmDel, setConfirmDel] = useState(false);
  const [discardOpen, setDiscardOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const taRef = useRef<HTMLTextAreaElement>(null);

  const dirty = isEdit
    ? name !== editing!.name ||
      group !== editing!.group ||
      body !== editing!.body ||
      scope !== editing!.scope
    : name.trim() !== "" || body.trim() !== "";
  const canSave = name.trim().length > 0 && (!isEdit || dirty);
  const moved = isEdit && scope !== editing!.scope;

  const insert = (token: string) => {
    const ta = taRef.current;
    if (!ta) {
      setBody((b) => b + token);
      return;
    }
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    setBody(body.slice(0, start) + token + body.slice(end));
    requestAnimationFrame(() => {
      ta.focus();
      const pos = start + token.length;
      ta.setSelectionRange(pos, pos);
    });
  };

  // Backdrop / X / Escape / Cancel all route here. A sub-confirm owns the
  // interaction while it's open; otherwise prompt to discard unsaved edits.
  const requestClose = () => {
    if (confirmDel || discardOpen) return;
    if (dirty) setDiscardOpen(true);
    else onClose();
  };

  const submit = async () => {
    if (!canSave || saving) return;
    setSaving(true);
    await onSave({
      id: editing?.id,
      scope,
      group: group.trim() || "Other",
      name: name.trim(),
      body,
    });
    onClose();
  };

  const doDelete = async () => {
    if (!editing) return;
    await onDelete(editing.id);
    setConfirmDel(false);
    onClose();
  };

  return (
    <>
      <Modal
        open={open}
        onClose={requestClose}
        title={isEdit ? "Edit template" : "Add template"}
      >
        <div className="rtl-modal">
          <div className="rtl-modal-grid">
            <div className="rtl-modal-form">
              <div className="tpl-field">
                <Label>Library</Label>
                <div className="rtl-radio-row" role="radiogroup" aria-label="Library">
                  {SCOPE_OPTIONS.map((o) => (
                    <label
                      key={o.value}
                      className={cn("rtl-radio", scope === o.value && "on")}
                    >
                      <input
                        type="radio"
                        name="rt-scope"
                        checked={scope === o.value}
                        onChange={() => setScope(o.value)}
                      />
                      <span className="rtl-radio-dot" aria-hidden />
                      <span>{o.label}</span>
                    </label>
                  ))}
                </div>
                <p className="rtl-scope-hint">
                  {moved ? (
                    <>
                      <Icon name="info" size={14} /> Moving to the{" "}
                      {scope === "org" ? "Org" : "Personal"} library — recorded in
                      the audit trail.
                    </>
                  ) : (
                    SCOPE_HINT[scope]
                  )}
                </p>
              </div>

              <div className="tpl-field">
                <Label htmlFor="rt-name">Template name</Label>
                <Input
                  id="rt-name"
                  value={name}
                  placeholder="e.g. Concur — adequately supported"
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className="tpl-field">
                <Label htmlFor="rt-group">Group</Label>
                <GroupCombobox value={group} options={groupOptions} onChange={setGroup} />
              </div>

              <div className="tpl-field">
                <Label htmlFor="rt-body">Body — merge fields fill from the finding</Label>
                <Textarea
                  id="rt-body"
                  ref={taRef}
                  rows={6}
                  value={body}
                  placeholder="We concur with the appraiser's treatment of {{topic}}…"
                  onChange={(e) => setBody(e.target.value)}
                />
                <MergeFieldChips onInsert={insert} />
              </div>
            </div>

            <div className="rtl-modal-divider" aria-hidden />

            <aside className="rtl-modal-preview">
              <LivePreview body={body} />
            </aside>
          </div>

          <div className="rtl-modal-foot">
            {isEdit && (
              <Button
                variant="ghost"
                size="sm"
                iconLeft="trash"
                className="rtl-del"
                onClick={() => setConfirmDel(true)}
              >
                Delete
              </Button>
            )}
            <div className="rtl-foot-right">
              <Button variant="outline" onClick={requestClose}>
                Cancel
              </Button>
              <Button iconLeft="check" onClick={submit} disabled={!canSave || saving}>
                {isEdit ? "Save changes" : "Create template"}
              </Button>
            </div>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={confirmDel}
        danger
        title="Delete this template?"
        message={
          editing
            ? `“${editing.name}” will be permanently removed. This can’t be undone.`
            : ""
        }
        confirmLabel="Delete"
        cancelLabel="Keep editing"
        onConfirm={doDelete}
        onCancel={() => setConfirmDel(false)}
      />

      <ConfirmDialog
        open={discardOpen}
        danger
        title="Discard unsaved changes?"
        message="You have unsaved changes to this template. Closing now will discard them."
        confirmLabel="Discard"
        cancelLabel="Keep editing"
        onConfirm={() => {
          setDiscardOpen(false);
          onClose();
        }}
        onCancel={() => setDiscardOpen(false)}
      />
    </>
  );
}

/**
 * Group picker: a combobox over the existing groups. Opening (focus or chevron)
 * lists every group to browse; typing filters and offers to create a new group.
 * (Ported from the old inline editor — a native <datalist> collapsed to a single
 * value when the field was pre-filled, reading as a tooltip, not a dropdown.)
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
                <button
                  type="button"
                  className="ui-menu-item combo-newgroup"
                  onClick={() => pick(value.trim())}
                >
                  <Icon name="add" size={16} />
                  Create “{value.trim()}”
                </button>
              ) : (
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
