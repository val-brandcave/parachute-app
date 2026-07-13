import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useTemplatesStore } from "@/store";
import {
  draftVersion,
  publishedVersion,
  sortedVersions,
} from "@/lib/template-versions";
import type { VersionRow } from "@/components/templates/VersionHistoryTable";
import type { ChecklistTemplate } from "@/types";

function formatDate(ts?: number): string {
  if (!ts) return "—";
  return new Date(ts).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export interface ChecklistFamilyView {
  family: ChecklistTemplate;
  versionBadge?: string;
  defaultBadge?: string;
  isDefault: boolean;
  /** Structured column values for the table. */
  itemCount: number;
  usedInReviews: number;
  publishedLabel: string;
  versions: VersionRow[];
  hasDraft: boolean;
}

/**
 * Drives the Compliance checklists library (its own Configure section): family
 * views (active snapshot + version history) and the version-lifecycle callbacks.
 * The bank's checklist is INGESTED (upload → AI-map → version), not authored
 * from scratch — the upload wizard is the create affordance on the page.
 */
export function useChecklistLibrary() {
  const router = useRouter();
  const {
    checklists,
    isLoading,
    fetchTemplates,
    ensureChecklistDraft,
    promoteChecklistVersion,
    deleteChecklistVersion,
    setDefaultChecklist,
    duplicateChecklistFamily,
    deleteChecklistFamily,
  } = useTemplatesStore();

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const checklistFamilies = useMemo<ChecklistFamilyView[]>(() => {
    return checklists.map((family) => {
      const pub = publishedVersion(family.versions);
      const draft = draftVersion(family.versions);
      return {
        family,
        versionBadge: pub ? `v${pub.version}` : undefined,
        defaultBadge: family.isDefault ? "Default" : undefined,
        isDefault: !!family.isDefault,
        itemCount: pub?.items.length ?? 0,
        usedInReviews: family.usedInReviews,
        publishedLabel: pub ? formatDate(pub.publishedAt) : "—",
        hasDraft: !!draft,
        versions: sortedVersions(family.versions).map((v) => ({
          id: v.id,
          version: v.version,
          status: v.status,
          dateLabel: formatDate(v.publishedAt ?? v.createdAt),
          summary: `${v.items.length} items`,
        })),
      };
    });
  }, [checklists]);

  const checklistTo = (familyId: string, versionId?: string) =>
    versionId
      ? `/configure/checklists/${familyId}?v=${versionId}`
      : `/configure/checklists/${familyId}`;

  const editChecklist = async (familyId: string, baseVersionId?: string) => {
    const draftId = await ensureChecklistDraft(familyId, baseVersionId);
    router.push(checklistTo(familyId, draftId));
  };
  const viewChecklist = (familyId: string, versionId: string) =>
    router.push(checklistTo(familyId, versionId));

  return {
    isLoading,
    checklistFamilies,
    editChecklist,
    viewChecklist,
    promoteChecklistVersion,
    deleteChecklistVersion,
    setDefaultChecklist,
    duplicateChecklistFamily,
    deleteChecklistFamily,
  };
}
