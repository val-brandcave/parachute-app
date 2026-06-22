import { useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTemplatesStore } from "@/store";
import {
  draftVersion,
  publishedVersion,
  sortedVersions,
} from "@/lib/template-versions";
import type { VersionRow } from "@/components/templates/VersionHistoryTable";
import type { ChecklistTemplate, TemplateScope, WorkbookLayout } from "@/types";

export type TemplateTab = "checklist" | "response" | "workbook";

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
  sub: string;
  versions: VersionRow[];
  hasDraft: boolean;
}

export interface LayoutFamilyView {
  family: WorkbookLayout;
  versionBadge?: string;
  defaultBadge?: string;
  sub: string;
  versions: VersionRow[];
}

/**
 * Drives the tabbed Templates library: per-kind family views (active snapshot +
 * version history) and all the version lifecycle callbacks, so the page itself
 * stays declarative. Tab is in-page state seeded from `?tab=` (lazy initializer,
 * no effect → no cascading-render lint).
 */
export function useTemplateHub() {
  const router = useRouter();
  const {
    responses,
    checklists,
    layouts,
    isLoading,
    fetchTemplates,
    ensureChecklistDraft,
    publishChecklistDraft,
    promoteChecklistVersion,
    deleteChecklistVersion,
    setDefaultChecklist,
    duplicateChecklistFamily,
    deleteChecklistFamily,
    promoteWorkbookVersion,
    deleteWorkbookVersion,
    setDefaultLayout,
  } = useTemplatesStore();

  // Tab is DERIVED from the URL (?tab=) so it stays correct on full load,
  // client-side <Link> navigation, and back/forward — not just first mount.
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const tab: TemplateTab =
    tabParam === "response" || tabParam === "workbook" ? tabParam : "checklist";

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const setTab = (t: TemplateTab) => {
    const url = t === "checklist" ? "/templates" : `/templates?tab=${t}`;
    router.replace(url, { scroll: false });
  };

  const checklistFamilies = useMemo<ChecklistFamilyView[]>(() => {
    return checklists.map((family) => {
      const pub = publishedVersion(family.versions);
      const draft = draftVersion(family.versions);
      const groups = new Set((pub?.items ?? []).map((i) => i.group)).size;
      const sub = pub
        ? `Published ${formatDate(pub.publishedAt)} · ${pub.items.length} items · ${groups} groups · Used in ${family.usedInReviews} reviews`
        : `Not yet published · Used in ${family.usedInReviews} reviews`;
      return {
        family,
        versionBadge: pub ? `v${pub.version}` : undefined,
        defaultBadge: family.isDefault ? "Default" : undefined,
        isDefault: !!family.isDefault,
        sub,
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

  const layoutFamilies = useMemo<LayoutFamilyView[]>(() => {
    return layouts.map((family) => {
      const pub = publishedVersion(family.versions);
      const sub = pub
        ? `Published ${formatDate(pub.publishedAt)} · ${pub.sections.length} sections · ${pub.theme} theme`
        : "Not yet published";
      return {
        family,
        versionBadge: pub ? `v${pub.version}` : undefined,
        defaultBadge: family.isDefault ? `Default · ${family.profile}` : undefined,
        sub,
        versions: sortedVersions(family.versions).map((v) => ({
          id: v.id,
          version: v.version,
          status: v.status,
          dateLabel: formatDate(v.publishedAt ?? v.createdAt),
          summary: `${v.sections.length} sections`,
        })),
      };
    });
  }, [layouts]);

  const responseScopes = useMemo(() => {
    const count = (s: TemplateScope) => responses.filter((r) => r.scope === s).length;
    const groups = new Set(
      responses.filter((r) => r.scope === "org").map((r) => r.group),
    ).size;
    return {
      org: { count: count("org"), groups },
      mine: { count: count("mine") },
    };
  }, [responses]);

  // --- Checklist actions ---
  const checklistTo = (familyId: string, versionId?: string) =>
    versionId
      ? `/templates/checklist/${familyId}?v=${versionId}`
      : `/templates/checklist/${familyId}`;

  const editChecklist = async (familyId: string, baseVersionId?: string) => {
    const draftId = await ensureChecklistDraft(familyId, baseVersionId);
    router.push(checklistTo(familyId, draftId));
  };
  const viewChecklist = (familyId: string, versionId: string) =>
    router.push(checklistTo(familyId, versionId));

  // --- Workbook actions (view real; editing deferred to in-review builder) ---
  const viewLayout = (versionId?: string) =>
    router.push(
      versionId ? `/templates/workbook-layout?v=${versionId}` : "/templates/workbook-layout",
    );

  return {
    isLoading,
    tab,
    setTab,
    checklistFamilies,
    layoutFamilies,
    responseScopes,
    // checklist
    editChecklist,
    viewChecklist,
    publishChecklistDraft,
    promoteChecklistVersion,
    deleteChecklistVersion,
    setDefaultChecklist,
    duplicateChecklistFamily,
    deleteChecklistFamily,
    // workbook
    viewLayout,
    promoteWorkbookVersion,
    deleteWorkbookVersion,
    setDefaultLayout,
    // responses
    openResponses: (scope: TemplateScope) =>
      router.push(`/templates/responses/${scope}`),
    newResponse: (scope: TemplateScope) =>
      router.push(`/templates/responses/${scope}?new=1`),
  };
}
