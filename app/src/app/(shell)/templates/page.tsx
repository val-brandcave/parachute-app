"use client";

import { Suspense } from "react";
import { Tabs, type ActionItem } from "@/components/molecules";
import { TemplateFamilyCard } from "@/components/templates/TemplateFamilyCard";
import { ResponseScopeCard } from "@/components/templates/ResponseScopeCard";
import { useTemplateHub, type TemplateTab } from "./hooks/useTemplateHub";

const TABS: { value: TemplateTab; label: string }[] = [
  { value: "checklist", label: "Compliance Checklists" },
  { value: "response", label: "Response Templates" },
  { value: "workbook", label: "Workbook Layout" },
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
    checklistFamilies,
    layoutFamilies,
    responseScopes,
    editChecklist,
    viewChecklist,
    promoteChecklistVersion,
    deleteChecklistVersion,
    setDefaultChecklist,
    duplicateChecklistFamily,
    deleteChecklistFamily,
    viewLayout,
    promoteWorkbookVersion,
    deleteWorkbookVersion,
    openResponses,
  } = useTemplateHub();

  return (
    <>
      {/* Header band IS the tab bar (no redundant title — nav already says
          Templates). Checklist creation (the .docx upload wizard) is deferred
          pending client clarity, so there's no create action here yet. */}
      <div className="pagehead">
        <Tabs tabs={TABS} value={tab} onChange={setTab} />
      </div>

      <div className="pagebody">
        {tab === "checklist" && (
          <div className="tpl-tabpane">
            <div className="fam-list">
              {checklistFamilies.map((c, i) => {
                const publishedId = c.versions.find((v) => v.status === "published")?.id;
                // Family-level secondary actions. The org default can't delete
                // itself (transfer the default first) and has no "Set as default".
                const menuItems: ActionItem[] = [
                  ...(!c.isDefault
                    ? [
                        {
                          label: "Set as default",
                          icon: "check-circle" as const,
                          onClick: () => setDefaultChecklist(c.family.id),
                        },
                      ]
                    : []),
                  {
                    label: "Duplicate",
                    icon: "copy" as const,
                    onClick: () => duplicateChecklistFamily(c.family.id),
                  },
                  ...(!c.isDefault
                    ? [
                        { divider: true },
                        {
                          label: "Delete checklist",
                          icon: "trash" as const,
                          danger: true,
                          onClick: () => deleteChecklistFamily(c.family.id),
                        },
                      ]
                    : []),
                ];
                return (
                  <TemplateFamilyCard
                    key={c.family.id}
                    index={i}
                    title={c.family.name}
                    onOpenDetails={() =>
                      publishedId
                        ? viewChecklist(c.family.id, publishedId)
                        : editChecklist(c.family.id)
                    }
                    versionBadge={c.versionBadge}
                    defaultBadge={c.defaultBadge}
                    sub={c.sub}
                    hasDraft={c.hasDraft}
                    primaryLabel={c.hasDraft ? "Continue draft" : "Edit"}
                    primaryIcon="edit"
                    onPrimary={() => editChecklist(c.family.id)}
                    menuItems={menuItems}
                    contentsHeader="Items"
                    versions={c.versions}
                    onView={(vid) => viewChecklist(c.family.id, vid)}
                    onPromote={(vid) => promoteChecklistVersion(c.family.id, vid)}
                    onDuplicate={(vid) => editChecklist(c.family.id, vid)}
                    onDelete={(vid) => deleteChecklistVersion(c.family.id, vid)}
                  />
                );
              })}
            </div>
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

        {tab === "workbook" && (
          <div className="tpl-tabpane">
            <div className="fam-list">
              {layoutFamilies.map((l, i) => {
                const publishedId = l.versions.find((v) => v.status === "published")?.id;
                return (
                  <TemplateFamilyCard
                    key={l.family.id}
                    index={i}
                    title={l.family.name}
                    onOpenDetails={() => viewLayout(publishedId)}
                    versionBadge={l.versionBadge}
                    defaultBadge={l.defaultBadge}
                    sub={l.sub}
                    primaryLabel="Open"
                    primaryIcon="eye"
                    onPrimary={() => viewLayout(publishedId)}
                    contentsHeader="Sections"
                    versions={l.versions}
                    onView={(vid) => viewLayout(vid)}
                    onPromote={(vid) => promoteWorkbookVersion(l.family.id, vid)}
                    onDelete={(vid) => deleteWorkbookVersion(l.family.id, vid)}
                  />
                );
              })}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
