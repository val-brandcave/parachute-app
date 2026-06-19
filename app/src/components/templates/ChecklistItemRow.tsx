"use client";

import { Chip, Icon } from "@/components/atoms";
import type { ChecklistTemplateItem } from "@/types";

// One extracted checklist item. Shows the AI-normalized question, the raw source
// text, a mapping-health chip (Mapped / Review) and a type chip. Flagged rows
// surface a hint. Clicking opens the edit drawer (focused sub-task).
export function ChecklistItemRow({
  item,
  index,
  onOpen,
  readOnly = false,
}: {
  item: ChecklistTemplateItem;
  index: number;
  onOpen: () => void;
  readOnly?: boolean;
}) {
  const flagged = item.map === "warn";
  const Tag = readOnly ? "div" : "button";
  return (
    <Tag
      {...(readOnly ? {} : { type: "button" as const, onClick: onOpen })}
      className={`ck-row${flagged ? " warn" : ""}${readOnly ? " ck-row--ro" : ""}`}
    >
      <span className="ck-row-num">{index}</span>
      <span className="ck-row-main">
        <span className="ck-row-q">{item.question}</span>
        {item.orig && <span className="ck-row-src">source: “{item.orig}”</span>}
        {flagged && item.hint && (
          <span className="ck-row-hint">
            <Icon name="warn" size={14} />
            {item.hint}
          </span>
        )}
      </span>
      <span className="ck-row-chips">
        <Chip tone={flagged ? "flag" : "pass"} dot>
          {flagged ? "Review" : "Mapped"}
        </Chip>
        <Chip tone="neutral">{item.type === "binary" ? "Binary" : "Qualitative"}</Chip>
      </span>
    </Tag>
  );
}
