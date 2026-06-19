import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useTemplatesStore } from "@/store";
import { activeVersion } from "@/lib/template-versions";
import { generateId, type ChecklistTemplateItem } from "@/types";

const NEW_ITEM_GROUP = "Bank Policy & Special Considerations";

function blankItem(group: string): ChecklistTemplateItem {
  return {
    id: generateId(),
    group,
    orig: "",
    question: "",
    type: "binary",
    map: "ok",
    requireCitation: false,
  };
}

/**
 * State for the Compliance Checklist mapper, scoped to ONE version of a family.
 * The target version is `?v=` (or the family's active draft/published one).
 * Only a `draft` version is editable — published/archived versions render
 * read-only with new-version / promote affordances instead.
 */
export function useChecklistMapper(familyId: string, versionId?: string) {
  const router = useRouter();
  const {
    checklists,
    isLoading,
    fetchTemplates,
    saveChecklistItem,
    ensureChecklistDraft,
    publishChecklistDraft,
    promoteChecklistVersion,
  } = useTemplatesStore();

  const [drawerItem, setDrawerItem] = useState<ChecklistTemplateItem | null>(null);
  const [drawerIsNew, setDrawerIsNew] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const family = checklists.find((c) => c.id === familyId);
  const version = useMemo(() => {
    if (!family) return undefined;
    return versionId
      ? family.versions.find((v) => v.id === versionId)
      : activeVersion(family.versions);
  }, [family, versionId]);

  const readOnly = version?.status !== "draft";

  const groups = useMemo(() => {
    if (!version) return [];
    const map = new Map<string, ChecklistTemplateItem[]>();
    for (const it of version.items) {
      if (!map.has(it.group)) map.set(it.group, []);
      map.get(it.group)!.push(it);
    }
    return Array.from(map, ([group, items]) => ({ group, items }));
  }, [version]);

  const stats = useMemo(() => {
    const items = version?.items ?? [];
    return {
      items: items.length,
      groups: new Set(items.map((i) => i.group)).size,
      mapped: items.filter((i) => i.map === "ok").length,
      warn: items.filter((i) => i.map === "warn").length,
    };
  }, [version]);

  const openItem = (item: ChecklistTemplateItem) => {
    if (readOnly) return;
    setDrawerIsNew(false);
    setDrawerItem(item);
    setDrawerOpen(true);
  };

  const openNew = () => {
    if (readOnly) return;
    setDrawerIsNew(true);
    setDrawerItem(blankItem(NEW_ITEM_GROUP));
    setDrawerOpen(true);
  };

  const closeDrawer = () => setDrawerOpen(false);

  const saveItem = async (item: ChecklistTemplateItem) => {
    if (version) await saveChecklistItem(familyId, version.id, item);
    setDrawerOpen(false);
  };

  // Split a double-barrelled row into two mapped items at the first "?".
  const splitItem = async (item: ChecklistTemplateItem) => {
    if (!version) return;
    const clauses = item.question
      .split("?")
      .map((s) => s.trim())
      .filter(Boolean);
    const first = (clauses[0] ?? item.question).replace(/\?+$/, "") + "?";
    const second = clauses.slice(1).join("? ").trim();
    await saveChecklistItem(familyId, version.id, {
      ...item,
      question: first,
      map: "ok",
      hint: undefined,
    });
    if (second) {
      await saveChecklistItem(familyId, version.id, {
        id: generateId(),
        group: item.group,
        orig: item.orig,
        question: second.endsWith("?") ? second : `${second}?`,
        type: item.type,
        map: "ok",
        requireCitation: item.requireCitation,
      });
    }
    setDrawerOpen(false);
  };

  // Publish the draft, then return to the library (now the new published version).
  const publish = async () => {
    await publishChecklistDraft(familyId);
    router.push("/templates");
  };

  // From a read-only version: branch a fresh draft (based on this version) and
  // return its id so the page can switch to it in place (no route remount).
  const createDraft = () => ensureChecklistDraft(familyId, version?.id);

  const promote = async () => {
    if (version) await promoteChecklistVersion(familyId, version.id);
    router.push("/templates");
  };

  return {
    isLoading,
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
  };
}
