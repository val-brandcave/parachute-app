"use client";

import type { ResponseTemplate } from "@/types";

// Master pane: response templates grouped by their disposition group, with a
// short body preview. The selected row carries the active treatment.
export function ResponseList({
  groups,
  selectedId,
  onSelect,
}: {
  groups: { group: string; items: ResponseTemplate[] }[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  if (!groups.length) {
    return (
      <div className="resp-list-empty text-secondary">
        No templates here yet. Use “New template” to add one.
      </div>
    );
  }

  return (
    <div className="resp-list">
      {groups.map(({ group, items }) => (
        <div key={group} className="resp-group">
          <div className="resp-group-h">{group}</div>
          {items.map((t) => (
            <button
              key={t.id}
              type="button"
              className={`resp-row${t.id === selectedId ? " sel" : ""}`}
              onClick={() => onSelect(t.id)}
            >
              <span className="resp-row-name">{t.name}</span>
              <span className="resp-row-prev">{t.body.slice(0, 78)}</span>
            </button>
          ))}
        </div>
      ))}
    </div>
  );
}
