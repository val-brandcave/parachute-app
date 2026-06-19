"use client";

import type { MergeField } from "@/types";

// Click-to-insert merge tokens for the response body. Rendered in Inter (NOT a
// mono face — house rule) with a subtle token treatment.
const FIELDS: MergeField[] = [
  "topic",
  "page",
  "detail",
  "action",
  "condition",
  "property",
];

export function MergeFieldChips({
  onInsert,
}: {
  onInsert: (token: string) => void;
}) {
  return (
    <div className="mf-row">
      <span className="mf-row-lb">Insert field</span>
      {FIELDS.map((f) => (
        <button
          key={f}
          type="button"
          className="mf-chip"
          onClick={() => onInsert(`{{${f}}}`)}
        >
          {`{{${f}}}`}
        </button>
      ))}
    </div>
  );
}
