import { useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTemplatesStore } from "@/store";
import { publishedVersion, sortedVersions } from "@/lib/template-versions";
import type { VersionRow } from "@/components/templates/VersionHistoryTable";
import type { TemplateScope, WorkbookLayout } from "@/types";

// Compliance checklists were promoted to their own Configure section
// (/configure/checklists); this hub now holds the two authoring libraries:
// Workbook layouts (Technical) and the shared Response library.
export type TemplateTab = "workbook" | "response";

function formatDate(ts?: number): string {
  if (!ts) return "—";
  return new Date(ts).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export interface LayoutFamilyView {
  family: WorkbookLayout;
  versionBadge?: string;
  isDefault: boolean;
  /** Structured column values for the table. */
  profile: string;
  sectionCount: number;
  publishedLabel: string;
  versions: VersionRow[];
}

/**
 * Drives the tabbed Templates & layouts library: workbook-layout family views
 * (active snapshot + version history) and the response-library scope counts, so
 * the page itself stays declarative. Tab is DERIVED from the URL (?tab=).
 */
export function useTemplateHub() {
  const router = useRouter();
  const {
    responses,
    layouts,
    isLoading,
    fetchTemplates,
    promoteWorkbookVersion,
    deleteWorkbookVersion,
    setDefaultLayout,
  } = useTemplatesStore();

  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const tab: TemplateTab = tabParam === "response" ? "response" : "workbook";

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const setTab = (t: TemplateTab) => {
    const url = t === "workbook" ? "/configure/templates" : `/configure/templates?tab=${t}`;
    router.replace(url, { scroll: false });
  };

  const layoutFamilies = useMemo<LayoutFamilyView[]>(() => {
    return layouts.map((family) => {
      const pub = publishedVersion(family.versions);
      return {
        family,
        versionBadge: pub ? `v${pub.version}` : undefined,
        isDefault: !!family.isDefault,
        profile: family.profile,
        sectionCount: pub?.sections.length ?? 0,
        publishedLabel: pub ? formatDate(pub.publishedAt) : "—",
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

  // --- Workbook actions (view real; editing deferred to in-review builder) ---
  const viewLayout = (versionId?: string) =>
    router.push(
      versionId
        ? `/configure/templates/workbook-layout?v=${versionId}`
        : "/configure/templates/workbook-layout",
    );

  return {
    isLoading,
    tab,
    setTab,
    layoutFamilies,
    responseScopes,
    // workbook
    viewLayout,
    promoteWorkbookVersion,
    deleteWorkbookVersion,
    setDefaultLayout,
    // responses
    openResponses: (scope: TemplateScope) =>
      router.push(`/configure/templates/responses/${scope}`),
    newResponse: (scope: TemplateScope) =>
      router.push(`/configure/templates/responses/${scope}?new=1`),
  };
}
