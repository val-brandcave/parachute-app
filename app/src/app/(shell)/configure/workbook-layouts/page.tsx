"use client";

import { useEffect, useState } from "react";
import { Button, Chip } from "@/components/atoms";
import { EmptyState, type ActionItem } from "@/components/molecules";
import { EmptyVideo } from "@/components/organisms/EmptyVideo";
import { useTourTarget } from "@/components/organisms/useTourTarget";
import { useTemplatesStore } from "@/store";
import {
  FamilyTable,
  type FamilyColumn,
  type FamilyRow,
} from "@/components/templates/FamilyTable";
import { useWorkbookLayouts } from "./hooks/useWorkbookLayouts";

const LAYOUT_COLUMNS: FamilyColumn[] = [
  { key: "profile", label: "Profile", width: "128px" },
  { key: "version", label: "Version", width: "84px" },
  { key: "sections", label: "Sections", width: "96px" },
  { key: "published", label: "Published", width: "156px" },
];

export default function WorkbookLayoutsPage() {
  const {
    layoutFamilies,
    viewLayout,
    promoteWorkbookVersion,
    deleteWorkbookVersion,
    setDefaultLayout,
  } = useWorkbookLayouts();

  // Level 1 needs the library to have really loaded.
  const [fetched, setFetched] = useState(false);
  useEffect(() => {
    void useTemplatesStore
      .getState()
      .fetchTemplates()
      .then(() => setFetched(true));
  }, []);

  // Level 1 (spec §5.12): nothing but the built-in default exists, so there is nothing to manage yet.
  const defaultOnly = layoutFamilies.length <= 1 && layoutFamilies.every((l) => l.isDefault);
  const level1 = defaultOnly;

  // Tour targets (spec §5.13): the default FamilyTable row and its open action (the name link).
  useTourTarget("layouts-default", ".cktable .ckrow:has(.fam-default)");
  useTourTarget("layouts-open", ".cktable .ckrow:has(.fam-default) .fam-title");

  const layoutRows: FamilyRow[] = layoutFamilies.map((l) => {
    const publishedId = l.versions.find((v) => v.status === "published")?.id;
    // Layouts have no "Edit" (authoring happens in the in-review Builder), so the
    // ⋯ menu is View + Set as default — matching the checklist table's ⋯-only cell.
    const menuItems: ActionItem[] = [
      { label: "View", icon: "eye" as const, onClick: () => viewLayout(publishedId) },
      ...(!l.isDefault
        ? [
            {
              label: "Set as default",
              icon: "check-circle" as const,
              onClick: () => setDefaultLayout(l.family.id),
            },
          ]
        : []),
    ];

    return {
      id: l.family.id,
      name: l.family.name,
      badges: l.isDefault ? (
        <>
          <Chip tone="accent">Default</Chip>
          {/* Data marker for the tour targets (FamilyTable passes no row props). */}
          <span className="fam-default" hidden />
        </>
      ) : undefined,
      cells: {
        profile: l.profile,
        version: l.versionBadge ? (
          <span className="fam-vbadge">{l.versionBadge}</span>
        ) : (
          <span className="ckmuted">—</span>
        ),
        sections: <span className="ckrow-num">{l.sectionCount || "—"}</span>,
        published: <span className="ckrow-date">{l.publishedLabel}</span>,
      },
      versions: l.versions,
      contentsHeader: "Sections",
      menuItems,
      onOpen: () => viewLayout(publishedId),
      onViewVersion: (vid) => viewLayout(vid),
      onPromoteVersion: (vid) => promoteWorkbookVersion(l.family.id, vid),
      onDeleteVersion: (vid) => deleteWorkbookVersion(l.family.id, vid),
    };
  });

  if (!fetched) return <div className="pagebody" aria-busy="true" />;

  return (
    <div className="pagebody">
      {level1 ? (
        <EmptyState
          layout="stack"
          title="Make the workbook yours"
          media={<EmptyVideo videoId="workbook-layouts" />}
          actions={
            <Button onClick={() => viewLayout(layoutFamilies[0]?.family.versions.find((v) => v.status === "published")?.id)}>
              Start from a built-in layout
            </Button>
          }
        >
          Every workbook starts from the built-in layout. Add your logo, rename sections and publish your own version.
        </EmptyState>
      ) : (
        <FamilyTable columns={LAYOUT_COLUMNS} rows={layoutRows} ariaLabel="Workbook layouts" />
      )}
    </div>
  );
}
