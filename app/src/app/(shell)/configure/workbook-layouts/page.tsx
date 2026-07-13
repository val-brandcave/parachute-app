"use client";

import { Chip } from "@/components/atoms";
import { type ActionItem } from "@/components/molecules";
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
      badges: l.isDefault ? <Chip tone="accent">Default</Chip> : undefined,
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

  return (
    <div className="pagebody">
      <FamilyTable
        columns={LAYOUT_COLUMNS}
        rows={layoutRows}
        ariaLabel="Workbook layouts"
      />
    </div>
  );
}
