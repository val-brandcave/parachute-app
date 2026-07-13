"use client";

import { Suspense } from "react";
import { Chip } from "@/components/atoms";
import { Tabs, type ActionItem } from "@/components/molecules";
import {
  FamilyTable,
  type FamilyColumn,
  type FamilyRow,
} from "@/components/templates/FamilyTable";
import { ResponseScopeCard } from "@/components/templates/ResponseScopeCard";
import { useTemplateHub, type TemplateTab } from "./hooks/useTemplateHub";

// Labelled by the review type each library shapes — workbook layouts drive the
// Technical deliverable; the response library is shared across every review type.
const TABS: { value: TemplateTab; label: string }[] = [
  { value: "workbook", label: "Workbook layouts" },
  { value: "response", label: "Response library" },
];

const LAYOUT_COLUMNS: FamilyColumn[] = [
  { key: "profile", label: "Profile", width: "128px" },
  { key: "version", label: "Version", width: "84px" },
  { key: "sections", label: "Sections", width: "96px" },
  { key: "published", label: "Published", width: "156px" },
];

// useTemplateHub reads useSearchParams(), which Next requires to sit under a
// Suspense boundary.
export default function TemplatesPage() {
  return (
    <Suspense>
      <TemplatesHub />
    </Suspense>
  );
}

function TemplatesHub() {
  const {
    tab,
    setTab,
    layoutFamilies,
    responseScopes,
    viewLayout,
    promoteWorkbookVersion,
    deleteWorkbookVersion,
    setDefaultLayout,
    openResponses,
  } = useTemplateHub();

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
    <>
      {/* Header band IS the tab bar (the breadcrumb already names the section). */}
      <div className="pagehead">
        <Tabs tabs={TABS} value={tab} onChange={setTab} />
      </div>

      <div className="pagebody">
        {tab === "workbook" && (
          <div className="tpl-tabpane">
            <FamilyTable
              columns={LAYOUT_COLUMNS}
              rows={layoutRows}
              ariaLabel="Workbook layouts"
            />
          </div>
        )}

        {tab === "response" && (
          <div className="tpl-tabpane">
            <div className="fam-list">
              <ResponseScopeCard
                index={0}
                title="Org library"
                sub={`Shared across your firm · ${responseScopes.org.count} templates · ${responseScopes.org.groups} groups`}
                onOpen={() => openResponses("org")}
              />
              <ResponseScopeCard
                index={1}
                title="Personal library"
                sub={`Private to you · ${responseScopes.mine.count} templates`}
                onOpen={() => openResponses("mine")}
              />
            </div>
          </div>
        )}
      </div>
    </>
  );
}
