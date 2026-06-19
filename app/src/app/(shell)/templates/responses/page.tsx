"use client";

import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/templates/PageHeader";
import { Button, Icon } from "@/components/atoms";
import { ResponseList } from "@/components/templates/ResponseList";
import { ResponseEditor } from "@/components/templates/ResponseEditor";
import { useResponseLibrary } from "../hooks/useResponseLibrary";

export default function ResponseTemplatesPage() {
  const router = useRouter();
  const {
    scope,
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
  const isOrg = scope === "org";

  return (
    <>
      <PageHeader
        title={isOrg ? "Org library" : "Personal library"}
        sub={
          isOrg
            ? "Shared response language across your firm — populates finding actions and workbook wording."
            : "Your personal canned language, in your voice — private to you, usable alongside the org library."
        }
        actions={
          <>
            <Button variant="outline" iconLeft="back" onClick={() => router.push("/templates?tab=response")}>
              All response templates
            </Button>
            <Button iconLeft="add" onClick={() => startNew(scope)}>
              New template
            </Button>
          </>
        }
      />

      <div className="pagebody">
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
