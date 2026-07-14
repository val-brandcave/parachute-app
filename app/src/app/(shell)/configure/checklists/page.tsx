"use client";

import { useRef, useState } from "react";
import { Chip, Icon } from "@/components/atoms";
import { type ActionItem } from "@/components/molecules";
import {
  FamilyTable,
  type FamilyColumn,
  type FamilyRow,
} from "@/components/templates/FamilyTable";
import { ChecklistUploadWizard } from "@/components/templates/ChecklistUploadWizard";
import { useChecklistLibrary } from "./hooks/useChecklistLibrary";

const COLUMNS: FamilyColumn[] = [
  { key: "version", label: "Version", width: "96px" },
  { key: "items", label: "Items", width: "84px" },
  { key: "used", label: "Used", width: "84px" },
  { key: "published", label: "Published", width: "156px" },
];

export default function ChecklistsPage() {
  const {
    checklistFamilies,
    editChecklist,
    viewChecklist,
    promoteChecklistVersion,
    deleteChecklistVersion,
    setDefaultChecklist,
    duplicateChecklistFamily,
    deleteChecklistFamily,
  } = useChecklistLibrary();

  // The dropzone captures the file itself (click → picker, or drag-and-drop);
  // the wizard then opens already showing it. Non-null filename = wizard open.
  const [uploadFile, setUploadFile] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const capture = (name?: string) => {
    if (name) setUploadFile(name);
  };

  const rows: FamilyRow[] = checklistFamilies.map((c) => {
    // Opening a checklist always lands in the editable mapper (auto-draft), so
    // there's no separate read-only "View" — one "Edit"/"Continue draft" entry.
    // The org default can't delete itself (transfer the default first).
    const menuItems: ActionItem[] = [
      {
        label: c.hasDraft ? "Continue draft" : "Edit",
        icon: "edit" as const,
        onClick: () => editChecklist(c.family.id),
      },
      { divider: true },
      ...(!c.isDefault
        ? [
            {
              label: "Set as default",
              icon: "check-circle" as const,
              onClick: () => setDefaultChecklist(c.family.id),
            },
          ]
        : []),
      {
        label: "Duplicate",
        icon: "copy" as const,
        onClick: () => duplicateChecklistFamily(c.family.id),
      },
      ...(!c.isDefault
        ? [
            { divider: true },
            {
              label: "Delete checklist",
              icon: "trash" as const,
              danger: true,
              onClick: () => deleteChecklistFamily(c.family.id),
            },
          ]
        : []),
    ];

    return {
      id: c.family.id,
      name: c.family.name,
      badges: (
        <>
          {c.isDefault && <Chip tone="accent">Default</Chip>}
          {c.hasDraft && <Chip tone="flag">Draft in progress</Chip>}
        </>
      ),
      cells: {
        version: c.versionBadge ? (
          <span className="fam-vbadge">{c.versionBadge}</span>
        ) : (
          <span className="ckmuted">—</span>
        ),
        items: <span className="ckrow-num">{c.itemCount || "—"}</span>,
        used: <span className="ckrow-num">{c.usedInReviews || "—"}</span>,
        published: <span className="ckrow-date">{c.publishedLabel}</span>,
      },
      versions: c.versions,
      contentsHeader: "Items",
      menuItems,
      onOpen: () => editChecklist(c.family.id),
      onViewVersion: (vid) => viewChecklist(c.family.id, vid),
      onPromoteVersion: (vid) => promoteChecklistVersion(c.family.id, vid),
      onDuplicateVersion: (vid) => editChecklist(c.family.id, vid),
      onDeleteVersion: (vid) => deleteChecklistVersion(c.family.id, vid),
    };
  });

  return (
    <div className="pagebody">
      {/* Ingest affordance — a checklist is uploaded, not authored from scratch,
          so the create action is a dropzone. It captures the file directly (click
          to browse or drop one on it); the wizard then opens showing that file. */}
      <button
        type="button"
        className={`cfg-uploadzone${dragging ? " drag" : ""}`}
        onClick={() => fileRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          capture(e.dataTransfer.files?.[0]?.name);
        }}
      >
        <Icon name="upload" size={22} />
        <span className="cfg-uploadzone-main">Upload a checklist</span>
        <span className="cfg-uploadzone-sub">
          .docx / .xlsx / .pdf — the AI extracts and maps each item
        </span>
        <input
          ref={fileRef}
          type="file"
          accept=".doc,.docx,.xls,.xlsx,.pdf"
          hidden
          onChange={(e) => capture(e.target.files?.[0]?.name)}
        />
      </button>

      <FamilyTable columns={COLUMNS} rows={rows} ariaLabel="Compliance checklists" />

      <ChecklistUploadWizard
        open={!!uploadFile}
        fileName={uploadFile ?? ""}
        onClose={() => setUploadFile(null)}
      />
    </div>
  );
}
