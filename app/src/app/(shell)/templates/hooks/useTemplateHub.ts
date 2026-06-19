import { useEffect, useMemo } from "react";
import { useTemplatesStore } from "@/store";
import { TEMPLATE_KINDS, type TemplateKindMeta } from "../template-kinds";

export interface HubCard extends TemplateKindMeta {
  /** Resolved navigation target (may deep-link to a specific instance). */
  to: string;
  /** Small summary chips shown under the description. */
  meta: string[];
}

/** Feeds the Templates hub: live counts + resolved deep-links per kind. */
export function useTemplateHub() {
  const { responses, checklists, layouts, isLoading, fetchTemplates } =
    useTemplatesStore();

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const cards = useMemo<HubCard[]>(() => {
    const activeChecklist = checklists[0];
    const layout = layouts[0];
    const orgCount = responses.filter((r) => r.scope === "org").length;
    const mineCount = responses.filter((r) => r.scope === "mine").length;
    const groupCount = new Set(responses.map((r) => r.group)).size;

    return TEMPLATE_KINDS.map((kind) => {
      switch (kind.key) {
        case "checklist":
          return {
            ...kind,
            to: activeChecklist
              ? `/templates/checklist/${activeChecklist.id}`
              : kind.href,
            meta: activeChecklist
              ? [
                  `${activeChecklist.items.length} items`,
                  `v${activeChecklist.version}`,
                  `Used in ${activeChecklist.usedInReviews} reviews`,
                ]
              : ["No checklist yet"],
          };
        case "response":
          return {
            ...kind,
            to: kind.href,
            meta: [
              `${orgCount} org · ${mineCount} personal`,
              `${groupCount} groups`,
            ],
          };
        case "workbook":
          return {
            ...kind,
            to: kind.href,
            meta: layout
              ? [`${layout.sections.length} sections`, layout.theme, `v${layout.version}`]
              : ["Not configured"],
          };
        default:
          return { ...kind, to: kind.href, meta: [] };
      }
    });
  }, [responses, checklists, layouts]);

  return { cards, isLoading };
}
