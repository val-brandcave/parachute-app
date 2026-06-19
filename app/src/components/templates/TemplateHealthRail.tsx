"use client";

import { Button, Icon } from "@/components/atoms";

// Sticky right rail on the checklist mapper: at-a-glance template health, the
// source .docx, and the "add item" entry point.
export function TemplateHealthRail({
  stats,
  sourceFile,
  usedInReviews,
  onReplaceSource,
  onAddItem,
  readOnly = false,
}: {
  stats: { items: number; groups: number; mapped: number; warn: number };
  sourceFile: string;
  usedInReviews: number;
  onReplaceSource: () => void;
  onAddItem: () => void;
  readOnly?: boolean;
}) {
  return (
    <aside className="ck-rail">
      <div className="ck-rail-head">
        <Icon name="checklist" size={18} />
        <div>
          <div className="ck-rail-title">Template health</div>
          <div className="ck-rail-sub">Used in {usedInReviews} reviews</div>
        </div>
      </div>

      <div className="ck-stats">
        <div className="ck-stat">
          <div className="ck-stat-n">{stats.items}</div>
          <div className="ck-stat-l">Items</div>
        </div>
        <div className="ck-stat">
          <div className="ck-stat-n">{stats.groups}</div>
          <div className="ck-stat-l">Groups</div>
        </div>
        <div className="ck-stat">
          <div className="ck-stat-n">{stats.mapped}</div>
          <div className="ck-stat-l">Mapped</div>
        </div>
        <div className={`ck-stat${stats.warn ? " warn" : ""}`}>
          <div className="ck-stat-n">{stats.warn}</div>
          <div className="ck-stat-l">Need attention</div>
        </div>
      </div>

      <div className="ck-file">
        <Icon name="document" size={16} />
        <span className="ck-file-name">{sourceFile}</span>
        {!readOnly && (
          <button type="button" className="ck-file-replace" onClick={onReplaceSource}>
            replace
          </button>
        )}
      </div>

      <p className="ck-rail-note">
        At order time the AI answers every item with evidence and a page cite; the
        reviewer attests or adjusts. Items needing attention may be answered
        inconsistently — fix the mapping before publishing.
      </p>

      {!readOnly && (
        <Button variant="outline" size="sm" iconLeft="add" block onClick={onAddItem}>
          Add item manually
        </Button>
      )}
    </aside>
  );
}
