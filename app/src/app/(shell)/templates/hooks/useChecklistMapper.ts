import { useEffect, useMemo, useState } from "react";
import { useTemplatesStore } from "@/store";
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
 * State for the Compliance Checklist mapper: grouped items, health stats, and
 * the BottomSheet item-edit drawer (the focused sub-task surface). Selection is
 * derived from the route id; editing/adding flows through one drawer.
 */
export function useChecklistMapper(id: string) {
  const {
    checklists,
    isLoading,
    fetchTemplates,
    saveChecklistItem,
    publishChecklistVersion,
  } = useTemplatesStore();

  const [drawerItem, setDrawerItem] = useState<ChecklistTemplateItem | null>(null);
  const [drawerIsNew, setDrawerIsNew] = useState(false);
  // Kept separate from drawerItem so closing animates out (item lingers for the
  // exit transition) rather than vanishing.
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const checklist = checklists.find((c) => c.id === id);

  const groups = useMemo(() => {
    if (!checklist) return [];
    const map = new Map<string, ChecklistTemplateItem[]>();
    for (const it of checklist.items) {
      if (!map.has(it.group)) map.set(it.group, []);
      map.get(it.group)!.push(it);
    }
    return Array.from(map, ([group, items]) => ({ group, items }));
  }, [checklist]);

  const stats = useMemo(() => {
    const items = checklist?.items ?? [];
    return {
      items: items.length,
      groups: new Set(items.map((i) => i.group)).size,
      mapped: items.filter((i) => i.map === "ok").length,
      warn: items.filter((i) => i.map === "warn").length,
    };
  }, [checklist]);

  const openItem = (item: ChecklistTemplateItem) => {
    setDrawerIsNew(false);
    setDrawerItem(item);
    setDrawerOpen(true);
  };

  const openNew = () => {
    setDrawerIsNew(true);
    setDrawerItem(blankItem(NEW_ITEM_GROUP));
    setDrawerOpen(true);
  };

  const closeDrawer = () => setDrawerOpen(false);

  const saveItem = async (item: ChecklistTemplateItem) => {
    await saveChecklistItem(id, item);
    setDrawerOpen(false);
  };

  // Split a double-barrelled row into two mapped items at the first "?".
  const splitItem = async (item: ChecklistTemplateItem) => {
    const clauses = item.question
      .split("?")
      .map((s) => s.trim())
      .filter(Boolean);
    const first = (clauses[0] ?? item.question).replace(/\?+$/, "") + "?";
    const second = clauses.slice(1).join("? ").trim();
    await saveChecklistItem(id, {
      ...item,
      question: first,
      map: "ok",
      hint: undefined,
    });
    if (second) {
      await saveChecklistItem(id, {
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

  const publish = () => publishChecklistVersion(id);

  return {
    isLoading,
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
  };
}
