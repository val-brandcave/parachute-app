"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { PageHeader } from "@/components/templates/PageHeader";
import { Button, Card, Icon } from "@/components/atoms";
import { ChecklistItemRow } from "@/components/templates/ChecklistItemRow";
import { TemplateHealthRail } from "@/components/templates/TemplateHealthRail";
import { ChecklistItemDrawer } from "@/components/templates/ChecklistItemDrawer";
import { useChecklistMapper } from "../hooks/useChecklistMapper";

function formatDate(ts?: number): string {
  if (!ts) return "";
  return new Date(ts).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function ChecklistMapperPage() {
  const params = useParams();
  const familyId = String(params.id);

  // The target version is page state seeded from ?v= (lazy init — the codebase
  // avoids useSearchParams' Suspense bailout). Branching a new draft updates it
  // in place via history.replaceState, no route remount.
  const [versionId, setVersionId] = useState<string | undefined>(() => {
    if (typeof window === "undefined") return undefined;
    return new URLSearchParams(window.location.search).get("v") ?? undefined;
  });

  const {
    family,
    version,
    readOnly,
    groups,
    stats,
    drawerItem,
    drawerIsNew,
    drawerOpen,
    openItem,
    openNew,
    closeDrawer,
    saveItem,
    splitItem,
    publish,
    createDraft,
    promote,
  } = useChecklistMapper(familyId, versionId);

  const [reextracting, setReextracting] = useState(false);
  const reextract = () => {
    setReextracting(true);
    setTimeout(() => setReextracting(false), 1400);
  };

  const onNewVersion = async () => {
    const draftId = await createDraft();
    if (!draftId) return;
    setVersionId(draftId);
    window.history.replaceState(null, "", `/configure/checklists/${familyId}?v=${draftId}`);
  };

  if (!family || !version) {
    return (
      <>
        <PageHeader title="Checklist" />
        <div className="pagebody">
          <Card style={{ padding: "44px", textAlign: "center", color: "var(--md-on-surface-v)" }}>
            <Icon name="checklist" size={36} style={{ margin: "0 auto" }} />
            <p style={{ marginTop: 12 }}>This checklist version could not be found.</p>
          </Card>
        </div>
      </>
    );
  }

  // Continuous 1-based item numbers across groups, computed without mutation.
  const numbered = groups.map((g, gi) => {
    const start = groups
      .slice(0, gi)
      .reduce((sum, gg) => sum + gg.items.length, 0);
    return {
      group: g.group,
      items: g.items.map((item, i) => ({ item, num: start + i + 1 })),
    };
  });

  const sub =
    version.status === "draft"
      ? "Draft · not yet published — edits go live when you publish"
      : version.status === "published"
        ? `v${version.version} · Published ${formatDate(version.publishedAt)}`
        : `v${version.version} · Archived${
            version.publishedAt ? ` · was published ${formatDate(version.publishedAt)}` : ""
          }`;

  return (
    <>
      <PageHeader
        title={family.name}
        sub={sub}
        actions={
          readOnly ? (
            <>
              {version.status === "archived" && (
                <Button variant="outline" iconLeft="publish" onClick={promote}>
                  Promote to published
                </Button>
              )}
              <Button iconLeft="add" onClick={onNewVersion}>
                New version
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                iconLeft="refresh"
                onClick={reextract}
                disabled={reextracting}
              >
                {reextracting ? "Re-extracting…" : "Re-extract"}
              </Button>
              <Button iconLeft="publish" onClick={publish}>
                Publish new version
              </Button>
            </>
          )
        }
      />

      <div className="pagebody">
        {readOnly && (
          <div className="ck-ro-banner">
            <Icon name="eye" size={16} />
            <span>
              You’re viewing a {version.status} version (read-only).{" "}
              {version.status === "archived"
                ? "Promote it to make it the published version, or start a new version from it."
                : "Start a new version to change the items."}
            </span>
          </div>
        )}

        <div className="ck-shell">
          <div className="ck-items">
            <div className="ck-items-head">
              <span className="ck-items-title">
                {readOnly ? "Checklist items" : "Extracted checklist items"}
              </span>
              <span className="ck-items-hint text-tertiary">
                {readOnly
                  ? `${stats.items} items · ${stats.groups} groups`
                  : "AI-mapped from your .docx — confirm or adjust each mapping"}
              </span>
            </div>
            {numbered.map(({ group, items }) => (
              <div key={group} className="ck-group">
                <div className="ck-group-h">{group}</div>
                {items.map(({ item, num }) => (
                  <ChecklistItemRow
                    key={item.id}
                    item={item}
                    index={num}
                    readOnly={readOnly}
                    onOpen={() => openItem(item)}
                  />
                ))}
              </div>
            ))}
          </div>

          <TemplateHealthRail
            stats={stats}
            sourceFile={version.sourceFile}
            usedInReviews={family.usedInReviews}
            readOnly={readOnly}
            onReplaceSource={reextract}
            onAddItem={openNew}
          />
        </div>
      </div>

      <ChecklistItemDrawer
        open={drawerOpen}
        item={drawerItem}
        isNew={drawerIsNew}
        onClose={closeDrawer}
        onSave={saveItem}
        onSplit={splitItem}
      />
    </>
  );
}
