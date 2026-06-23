"use client";

import { useEffect, useMemo } from "react";
import { Button, Icon } from "@/components/atoms";
import { useTemplatesStore } from "@/store";
import { useReview } from "@/store/useReview";
import { publishedVersion } from "@/lib/template-versions";
import { inheritedLayout, layoutLabel, profileFor } from "@/lib/workbook";

/**
 * Workbook Builder — the layout/section authoring surface (its own Technical
 * sub-view). This is the Phase-1 shell: it shows the sections this review's
 * workbook inherits from the org default layout (read-only) and previews the
 * authoring capabilities — add/configure section types, import appraisal
 * sections, document settings — that land in the next pass. The full 3-pane
 * editor (sections list · per-section editor · live preview) is built next.
 */

const SECTION_TYPES = [
  { icon: "document", label: "Property/value summary" },
  { icon: "reviews", label: "Findings section" },
  { icon: "checklist", label: "Analytical exhibits (table/chart)" },
  { icon: "filter", label: "Sensitivity analysis" },
  { icon: "info", label: "SWOT analysis" },
  { icon: "checklist", label: "Conditions of approval" },
  { icon: "edit", label: "Conclusion & action items" },
  { icon: "document", label: "Free-text narrative" },
  { icon: "book", label: "Reviewer certification" },
] as const;

const IMPORT_SOURCES = [
  "Reconciliation of Value",
  "Highest & Best Use",
  "Scope of Work",
  "Site Description",
  "Subject Photographs",
  "Improvements Analysis",
];

export function Builder({
  reviewId,
  onPreview,
}: {
  reviewId: string;
  onPreview?: () => void;
}) {
  const layouts = useTemplatesStore((s) => s.layouts);
  const fetchTemplates = useTemplatesStore((s) => s.fetchTemplates);
  const review = useReview(reviewId);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const layout = useMemo(
    () => (review ? inheritedLayout(layouts, profileFor(review.propertyType)) : undefined),
    [layouts, review],
  );
  const version = layout ? publishedVersion(layout.versions) : undefined;
  const sections = version?.sections ?? [];

  return (
    <div className="bld">
      <div className="bld-bar">
        <div className="bld-inherit">
          <Icon name="templates" size={15} />
          Inherits <b>{layoutLabel(layout)}</b> · {sections.length} sections
        </div>
        <div className="wb-bar-spacer" />
        <Button variant="outline" size="sm" iconLeft="eye" onClick={onPreview}>
          Preview workbook
        </Button>
      </div>

      <div className="bld-note">
        <Icon name="construction" size={16} />
        <div>
          <b>Authoring tools arrive in the next pass.</b> The full Builder is a three-pane editor —
          a sections list you reorder &amp; configure, a per-section editor, and a live preview —
          plus document settings (theme, branding, risk wording) and import-from-appraisal. Below
          is the layout this review currently inherits.
        </div>
      </div>

      <div className="bld-grid">
        <section className="bld-panel">
          <div className="bld-panel-h">
            <Icon name="document" size={15} /> Inherited sections
          </div>
          <ol className="bld-seclist">
            {sections.map((s, i) => (
              <li key={s.id} className={s.enabled ? undefined : "is-off"}>
                <span className="bld-sec-n">{i + 1}</span>
                <span className="bld-sec-title">{s.title}</span>
                <span className="bld-sec-type">{s.type}</span>
                <Icon name={s.enabled ? "eye" : "close"} size={14} className="bld-sec-eye" />
              </li>
            ))}
            {!sections.length && <li className="bld-empty">No inherited layout found.</li>}
          </ol>
        </section>

        <section className="bld-panel">
          <div className="bld-panel-h">
            <Icon name="add" size={15} /> Section types
          </div>
          <div className="bld-types">
            {SECTION_TYPES.map((t) => (
              <span key={t.label} className="bld-type">
                <Icon name={t.icon} size={15} />
                {t.label}
              </span>
            ))}
          </div>

          <div className="bld-panel-h" style={{ marginTop: 18 }}>
            <Icon name="download" size={15} /> Import from the appraisal
          </div>
          <div className="bld-imports">
            {IMPORT_SOURCES.map((s) => (
              <span key={s} className="bld-import">
                <Icon name="document" size={14} />
                {s}
              </span>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
