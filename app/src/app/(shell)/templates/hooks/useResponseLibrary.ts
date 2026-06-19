import { useEffect, useMemo, useState } from "react";
import { useTemplatesStore } from "@/store";
import type { ResponseTemplate, TemplateScope } from "@/types";

export interface ResponseDraft {
  id?: string;
  scope: TemplateScope;
  group: string;
  name: string;
  body: string;
}

const NEW_GROUP = "Other";

function toDraft(t: ResponseTemplate): ResponseDraft {
  return { id: t.id, scope: t.scope, group: t.group, name: t.name, body: t.body };
}

const blank = (scope: TemplateScope): ResponseDraft => ({
  scope,
  group: NEW_GROUP,
  name: "",
  body: "",
});

/**
 * Master/detail state for the Response Templates library. Selection is DERIVED
 * (explicit pick, else first in scope) rather than synced via effects; `editing`
 * holds the in-flight draft and falls back to the selected template unchanged.
 * Editing IS the page — "New" just shows a blank draft (create == edit).
 */
export function useResponseLibrary() {
  const { responses, isLoading, fetchTemplates, saveResponse, deleteResponse } =
    useTemplatesStore();

  // Scope is fixed by the card you entered from (?scope=org|mine) — there's no
  // in-page toggle. Lazy init avoids useSearchParams' Suspense bailout.
  const [scope, setScope] = useState<TemplateScope>(() => {
    if (typeof window === "undefined") return "org";
    return new URLSearchParams(window.location.search).get("scope") === "mine"
      ? "mine"
      : "org";
  });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editing, setEditing] = useState<ResponseDraft | null>(null);
  // Honour a ?new=1 deep-link from the hub once, at mount (no effect → no
  // cascading-render lint, and the shell only renders client-side anyway).
  const [creating, setCreating] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return new URLSearchParams(window.location.search).get("new") != null;
  });

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const scoped = useMemo(
    () => responses.filter((r) => r.scope === scope),
    [responses, scope],
  );

  const groups = useMemo(() => {
    const map = new Map<string, ResponseTemplate[]>();
    for (const r of scoped) {
      if (!map.has(r.group)) map.set(r.group, []);
      map.get(r.group)!.push(r);
    }
    return Array.from(map, ([group, items]) => ({ group, items }));
  }, [scoped]);

  // Derived selection: an explicit valid pick, otherwise the first in scope.
  const selectionValid = !!selectedId && scoped.some((r) => r.id === selectedId);
  const effectiveId = creating
    ? null
    : selectionValid
      ? selectedId
      : (scoped[0]?.id ?? null);
  const selectedTemplate = effectiveId
    ? responses.find((r) => r.id === effectiveId)
    : undefined;

  // The draft shown in the detail pane: live edits, else the selected template,
  // else a blank when creating.
  const baseDraft: ResponseDraft | null = creating
    ? blank(scope)
    : selectedTemplate
      ? toDraft(selectedTemplate)
      : null;
  const draft = editing ?? baseDraft;

  const select = (id: string) => {
    setCreating(false);
    setEditing(null);
    setSelectedId(id);
  };

  const startNew = (s: TemplateScope = scope) => {
    setScope(s);
    setCreating(true);
    setEditing(null);
    setSelectedId(null);
  };

  const changeScope = (s: TemplateScope) => {
    setScope(s);
    setCreating(false);
    setEditing(null);
    setSelectedId(null);
  };

  const update = (patch: Partial<ResponseDraft>) =>
    setEditing((prev) => ({ ...(prev ?? baseDraft!), ...patch }));

  const dirty =
    !!draft &&
    (creating
      ? draft.name.trim() !== "" || draft.body.trim() !== ""
      : !!selectedTemplate &&
        (draft.name !== selectedTemplate.name ||
          draft.group !== selectedTemplate.group ||
          draft.body !== selectedTemplate.body));

  const canSave =
    !!draft && draft.name.trim().length > 0 && (creating || dirty);

  const save = async () => {
    if (!draft) return;
    const saved = await saveResponse(draft);
    setCreating(false);
    setEditing(null);
    setSelectedId(saved.id);
  };

  const remove = async () => {
    if (!creating && draft?.id) await deleteResponse(draft.id);
    setCreating(false);
    setEditing(null);
    setSelectedId(null);
  };

  return {
    isLoading,
    scope,
    changeScope,
    groups,
    selectedId: effectiveId,
    draft,
    isNew: creating,
    dirty,
    canSave,
    startNew,
    select,
    update,
    save,
    remove,
  };
}
