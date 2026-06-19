import type { Timestamp, VersionStatus } from "@/types";

/**
 * Generic helpers over a template family's `versions[]`. Both ChecklistVersion
 * and WorkbookVersion share the shape `{ version, status }`, so the version
 * lifecycle (published / draft / archived) is resolved here once rather than
 * reimplemented per kind. Invariants the store maintains: at most one
 * `published` and at most one `draft` per family.
 */
export interface VersionLike {
  id: string;
  version: number;
  status: VersionStatus;
  createdAt: Timestamp;
  publishedAt?: Timestamp;
}

/** The live snapshot new reviews inherit. */
export function publishedVersion<V extends VersionLike>(versions: V[]): V | undefined {
  return versions.find((v) => v.status === "published");
}

/** The editable work-in-progress, if one exists. */
export function draftVersion<V extends VersionLike>(versions: V[]): V | undefined {
  return versions.find((v) => v.status === "draft");
}

/** What the editor should target: the draft if present, else the published one. */
export function activeVersion<V extends VersionLike>(versions: V[]): V | undefined {
  return draftVersion(versions) ?? publishedVersion(versions);
}

/** History order: newest version number first (draft floats to the top). */
export function sortedVersions<V extends VersionLike>(versions: V[]): V[] {
  return [...versions].sort((a, b) => {
    if (a.status === "draft" && b.status !== "draft") return -1;
    if (b.status === "draft" && a.status !== "draft") return 1;
    return b.version - a.version;
  });
}

/** Next monotonic version number for a new snapshot. */
export function nextVersionNumber<V extends VersionLike>(versions: V[]): number {
  return versions.reduce((max, v) => Math.max(max, v.version), 0) + 1;
}

/** Human label for a status chip. */
export const VERSION_STATUS_LABEL: Record<VersionStatus, string> = {
  published: "Published",
  draft: "Draft",
  archived: "Archived",
};
