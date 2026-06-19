"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { PageHeader } from "@/components/templates/PageHeader";
import { Button, Card, Icon } from "@/components/atoms";
import { ChecklistItemRow } from "@/components/templates/ChecklistItemRow";
import { TemplateHealthRail } from "@/components/templates/TemplateHealthRail";
import { ChecklistItemDrawer } from "@/components/templates/ChecklistItemDrawer";
import { useChecklistMapper } from "../../hooks/useChecklistMapper";

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
  const id = String(params.id);
  const {
    checklist,
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
  } = useChecklistMapper(id);

  const [reextracting, setReextracting] = useState(false);
  const reextract = () => {
    setReextracting(true);
    setTimeout(() => setReextracting(false), 1400);
  };

  if (!checklist) {
    return (
      <>
        <PageHeader eyebrow="Templates" title="Checklist" />
        <div className="pagebody">
          <Card style={{ padding: "44px", textAlign: "center", color: "var(--md-on-surface-v)" }}>
            <Icon name="checklist" size={36} style={{ margin: "0 auto" }} />
            <p style={{ marginTop: 12 }}>This checklist template could not be found.</p>
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

  return (
    <>
      <PageHeader
        eyebrow="Templates · Administrative checklist"
        title={checklist.name}
        sub={`v${checklist.version} · published ${formatDate(checklist.publishedAt)}`}
        actions={
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
        }
      />

      <div className="pagebody">
        <div className="ck-shell">
          <div className="ck-items">
            <div className="ck-items-head">
              <span className="ck-items-title">Extracted checklist items</span>
              <span className="ck-items-hint text-tertiary">
                AI-mapped from your .docx — confirm or adjust each mapping
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
                    onOpen={() => openItem(item)}
                  />
                ))}
              </div>
            ))}
          </div>

          <TemplateHealthRail
            stats={stats}
            sourceFile={checklist.sourceFile}
            usedInReviews={checklist.usedInReviews}
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
