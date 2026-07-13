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

export interface ResponseGroup {
  group: string;
  items: ResponseTemplate[];
}

/**
 * Drives the Response library page: a single table with a scope toggle (Org /
 * Personal) and a search box, plus create/edit/duplicate/delete that all flow
 * through the shared Add/Edit modal. Selection isn't tracked here — editing is
 * the modal's job; the page just hands it a template (or null for a new one).
 */
export function useResponseLibrary() {
  const { responses, saveResponse, deleteResponse, fetchTemplates } =
    useTemplatesStore();

  const [scope, setScope] = useState<TemplateScope>("org");
  const [query, setQuery] = useState("");

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const counts = useMemo(
    () => ({
      org: responses.filter((r) => r.scope === "org").length,
      mine: responses.filter((r) => r.scope === "mine").length,
    }),
    [responses],
  );

  const scoped = useMemo(
    () => responses.filter((r) => r.scope === scope),
    [responses, scope],
  );

  const q = query.trim().toLowerCase();
  const matched = useMemo(() => {
    if (!q) return scoped;
    return scoped.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.body.toLowerCase().includes(q) ||
        r.group.toLowerCase().includes(q),
    );
  }, [scoped, q]);

  // Grouped for the expandable table, preserving first-seen group order.
  const groups = useMemo<ResponseGroup[]>(() => {
    const map = new Map<string, ResponseTemplate[]>();
    for (const r of matched) {
      if (!map.has(r.group)) map.set(r.group, []);
      map.get(r.group)!.push(r);
    }
    return Array.from(map, ([group, items]) => ({ group, items }));
  }, [matched]);

  // Every distinct group name across BOTH libraries — the modal's group
  // combobox offers all of them regardless of the current scope filter.
  const groupOptions = useMemo(
    () => Array.from(new Set(responses.map((r) => r.group))).sort(),
    [responses],
  );

  const save = (draft: ResponseDraft) => saveResponse(draft);
  const remove = (id: string) => deleteResponse(id);
  const duplicate = (t: ResponseTemplate) =>
    saveResponse({
      scope: t.scope,
      group: t.group,
      name: `Copy of ${t.name}`,
      body: t.body,
    });

  return {
    scope,
    setScope,
    query,
    setQuery,
    counts,
    groups,
    groupOptions,
    scopedCount: scoped.length,
    matchedCount: matched.length,
    hasQuery: q.length > 0,
    save,
    remove,
    duplicate,
  };
}
