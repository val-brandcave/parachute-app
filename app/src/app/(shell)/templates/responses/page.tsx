"use client";

import { PageHeader } from "@/components/templates/PageHeader";
import { Button, Icon } from "@/components/atoms";
import { SegmentedControl } from "@/components/molecules";
import { ResponseList } from "@/components/templates/ResponseList";
import { ResponseEditor } from "@/components/templates/ResponseEditor";
import { useResponseLibrary } from "../hooks/useResponseLibrary";
import type { TemplateScope } from "@/types";

const SCOPES: { value: TemplateScope; label: string }[] = [
  { value: "org", label: "Org library" },
  { value: "mine", label: "My templates" },
];

export default function ResponseTemplatesPage() {
  const {
    scope,
    changeScope,
    groups,
    selectedId,
    draft,
    isNew,
    canSave,
    startNew,
    select,
    update,
    save,
    remove,
  } = useResponseLibrary();

  const groupOptions = groups.map((g) => g.group);

  return (
    <>
      <PageHeader
        eyebrow="Templates"
        title="Response Templates"
        sub="Canned disposition language with merge fields. These populate finding actions and workbook wording."
        actions={
          <Button iconLeft="add" onClick={() => startNew(scope)}>
            New template
          </Button>
        }
      />

      <div className="pagebody">
        <div className="resp-toolbar">
          <SegmentedControl options={SCOPES} value={scope} onChange={changeScope} />
          <span className="resp-toolbar-hint text-tertiary">
            {scope === "org"
              ? "Shared across your firm."
              : "Private to you — usable alongside the org library."}
          </span>
        </div>

        <div className="resp-shell">
          <div className="resp-master">
            <ResponseList groups={groups} selectedId={selectedId} onSelect={select} />
          </div>

          <div className="resp-detail">
            {draft ? (
              <ResponseEditor
                draft={draft}
                isNew={isNew}
                canSave={canSave}
                groupOptions={groupOptions}
                onChange={update}
                onSave={save}
                onDelete={remove}
              />
            ) : (
              <div className="resp-empty">
                <Icon name="quote" size={30} />
                <p>Select a template to edit, or create a new one.</p>
                <Button variant="outline" size="sm" iconLeft="add" onClick={() => startNew(scope)}>
                  New template
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
