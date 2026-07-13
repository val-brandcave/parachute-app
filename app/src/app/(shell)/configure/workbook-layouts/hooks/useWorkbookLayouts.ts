import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useTemplatesStore } from "@/store";
import { publishedVersion, sortedVersions } from "@/lib/template-versions";
import type { VersionRow } from "@/components/templates/VersionHistoryTable";
import type { WorkbookLayout } from "@/types";

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
 * Drives the Workbook layouts library: one row per layout family (active
 * snapshot + version history), so the page stays declarative. The Response
 * library is its own Configure section now (/configure/responses) — this hook
 * no longer knows about it, and there are no tabs.
 */
export function useWorkbookLayouts() {
  const router = useRouter();
  const {
    layouts,
    isLoading,
    fetchTemplates,
    promoteWorkbookVersion,
    deleteWorkbookVersion,
    setDefaultLayout,
  } = useTemplatesStore();

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

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

  // Editing a published org layout is deferred to the in-review Builder; the
  // library only views a version (real) and sets the profile default.
  const viewLayout = (versionId?: string) =>
    router.push(
      versionId
        ? `/configure/workbook-layouts/view?v=${versionId}`
        : "/configure/workbook-layouts/view",
    );

  return {
    isLoading,
    layoutFamilies,
    viewLayout,
    promoteWorkbookVersion,
    deleteWorkbookVersion,
    setDefaultLayout,
  };
}
