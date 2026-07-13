"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/templates/PageHeader";
import { Button, Card, Chip, Icon } from "@/components/atoms";
import { useTemplatesStore } from "@/store";
import { publishedVersion, VERSION_STATUS_LABEL } from "@/lib/template-versions";

function formatDate(ts?: number): string {
  if (!ts) return "";
  return new Date(ts).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function WorkbookLayoutPage() {
  const router = useRouter();
  const { layouts, fetchTemplates, promoteWorkbookVersion } = useTemplatesStore();

  const [versionId] = useState<string | undefined>(() => {
    if (typeof window === "undefined") return undefined;
    return new URLSearchParams(window.location.search).get("v") ?? undefined;
  });

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  // Resolve the family that owns the requested version (default: the only one).
  const family =
    layouts.find((l) => l.versions.some((v) => v.id === versionId)) ?? layouts[0];
  const version = versionId
    ? family?.versions.find((v) => v.id === versionId)
    : family && publishedVersion(family.versions);

  const isArchived = version?.status === "archived";

  return (
    <>
      <PageHeader
        title={family?.name ?? "Org Workbook Layout"}
        sub={
          version
            ? `v${version.version} · ${VERSION_STATUS_LABEL[version.status]}${
                version.publishedAt ? ` ${formatDate(version.publishedAt)}` : ""
              } · ${version.theme} theme · ${version.sections.length} sections`
            : undefined
        }
        actions={
          <>
            <Button
              variant="outline"
              iconLeft="back"
              onClick={() => router.push("/configure/workbook-layouts")}
            >
              All layouts
            </Button>
            {isArchived && family && version ? (
              <Button
                iconLeft="publish"
                onClick={async () => {
                  await promoteWorkbookVersion(family.id, version.id);
                  router.push("/configure/workbook-layouts");
                }}
              >
                Promote to published
              </Button>
            ) : (
              <Button iconLeft="edit" onClick={() => router.push("/reviews")}>
                Edit in a review
              </Button>
            )}
          </>
        }
      />

      <div className="pagebody">
        <div className="wl-shell">
          <Card style={{ padding: 0, overflow: "hidden" }}>
            <div className="wl-head">
              <span className="wl-head-title">Default sections</span>
              <span className="text-tertiary" style={{ fontSize: 12.5 }}>
                New reviews inherit this order; reviewers can tweak per review.
              </span>
            </div>
            {version?.sections.map((s, i) => (
              <div key={s.id} className="wl-row">
                <span className="wl-row-num">{i + 1}</span>
                <span className="wl-row-title">{s.title}</span>
                <Chip tone="neutral">{s.type}</Chip>
                <Chip tone={s.enabled ? "pass" : "na"} dot>
                  {s.enabled ? "Included" : "Hidden"}
                </Chip>
              </div>
            ))}
          </Card>

          <Card className="wl-note">
            <div className="wl-note-head">
              <Icon name="info" size={18} />
              <span>How workbook layout works</span>
            </div>
            <p>
              This is the org default for the Technical Review workbook — section
              order, theme and branding. Reviewers adjust a workbook’s sections
              inside a review’s <strong>Builder</strong> (Technical → Builder).
            </p>
            <p className="text-secondary">
              The full org-layout editor — drag-reorder, the section library, and
              publishing a new org default — is on the roadmap. For now, promote an
              existing version or open a review to shape its workbook.
            </p>
          </Card>
        </div>
      </div>
    </>
  );
}
