"use client";

import { useState } from "react";
import { Button, ConfirmDialog, Icon } from "@/components/atoms";
import { EmptyLine, EmptyState, GhostRows, Tabs } from "@/components/molecules";
import { ResponseTable } from "@/components/templates/ResponseTable";
import { ResponseModal } from "@/components/templates/ResponseModal";
import type { ResponseTemplate, TemplateScope } from "@/types";
import { useResponseLibrary } from "./hooks/useResponseLibrary";

export default function ResponseLibraryPage() {
  const {
    scope,
    setScope,
    query,
    setQuery,
    counts,
    groups,
    groupOptions,
    scopedCount,
    hasQuery,
    save,
    remove,
    duplicate,
  } = useResponseLibrary();

  // Modal state: `open` + the template under edit (null = creating a new one).
  // `modalKey` bumps on every open so the modal remounts and re-seeds its draft.
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ResponseTemplate | null>(null);
  const [modalKey, setModalKey] = useState(0);
  // Quick delete from a row's ⋯ menu still confirms (parity with the editor).
  const [pendingDelete, setPendingDelete] = useState<ResponseTemplate | null>(null);

  const openNew = () => {
    setEditing(null);
    setModalKey((k) => k + 1);
    setModalOpen(true);
  };
  const openEdit = (t: ResponseTemplate) => {
    setEditing(t);
    setModalKey((k) => k + 1);
    setModalOpen(true);
  };

  const noneAtAll = counts.org + counts.mine === 0;
  const scopeName = scope === "org" ? "org" : "personal";

  const empty = hasQuery ? (
    <div className="card">
      <EmptyLine
        action={
          <Button variant="ghost" size="sm" onClick={() => setQuery("")}>
            Clear search
          </Button>
        }
      >
        Nothing matches “{query.trim()}”.
      </EmptyLine>
    </div>
  ) : (
    <EmptyState
      title={noneAtAll ? "Your response library starts here" : `No ${scopeName} templates yet`}
      preview={<GhostRows rows={3} />}
    >
      {scope === "org"
        ? "Reusable replies your team can insert into a review, grouped so they’re easy to find. Use Add template to write the first one."
        : "Replies in your own voice. Only you see them, and you can insert them into any review. Use Add template to write your first."}
    </EmptyState>
  );

  return (
    <>
      {/* Header band IS the table toolbar (nav already names the section): Org /
          Personal libraries as tabs (sliding pill), search, and the Add CTA share
          the one line — same shape as the Reviews queue header. */}
      <div className="pagehead">
        {!noneAtAll && (
          <Tabs<TemplateScope>
            value={scope}
            onChange={setScope}
            tabs={[
              { value: "org", label: "Org", count: counts.org },
              { value: "mine", label: "Personal", count: counts.mine },
            ]}
          />
        )}
        <div style={{ flex: 1 }} />
        {scopedCount > 0 && (
          <div className="qsearch">
            <Icon name="search" size={15} />
            <input
              placeholder="Search templates…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Search response templates"
            />
          </div>
        )}
        <Button iconLeft="add" onClick={openNew}>
          Add template
        </Button>
      </div>

      <div className="pagebody">
        <ResponseTable
          groups={groups}
          empty={empty}
          onEdit={openEdit}
          onDuplicate={duplicate}
          onDelete={(t) => setPendingDelete(t)}
        />

        <ResponseModal
          key={modalKey}
          open={modalOpen}
          editing={editing}
          defaultScope={scope}
          groupOptions={groupOptions}
          onClose={() => setModalOpen(false)}
          onSave={save}
          onDelete={remove}
        />

        <ConfirmDialog
          open={!!pendingDelete}
          danger
          title="Delete this template?"
          message={
            pendingDelete
              ? `“${pendingDelete.name}” will be permanently removed. This can’t be undone.`
              : ""
          }
          confirmLabel="Delete"
          cancelLabel="Cancel"
          onConfirm={() => {
            if (pendingDelete) remove(pendingDelete.id);
            setPendingDelete(null);
          }}
          onCancel={() => setPendingDelete(null)}
        />
      </div>
    </>
  );
}
