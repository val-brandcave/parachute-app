import { create } from "zustand";
import { adapter } from "@/data/adapters";
import { Collections } from "@/data/collections";
import {
  generateId,
  type ChecklistTemplate,
  type ChecklistTemplateItem,
  type ResponseTemplate,
  type TemplateScope,
  type WorkbookLayout,
} from "@/types";

/** Response-template fields the editor supplies; the store stamps id/timestamps. */
type ResponseDraft = Pick<ResponseTemplate, "scope" | "group" | "name" | "body"> & {
  id?: string;
};

interface TemplatesState {
  responses: ResponseTemplate[];
  checklists: ChecklistTemplate[];
  layouts: WorkbookLayout[];
  isLoading: boolean;
  error: string | null;

  fetchTemplates: () => Promise<void>;

  // selectors
  getResponseById: (id: string) => ResponseTemplate | undefined;
  responsesByScope: (scope: TemplateScope) => ResponseTemplate[];
  getChecklistById: (id: string) => ChecklistTemplate | undefined;

  // mutators — stamp id/timestamps in-store, persist via adapter, update state
  saveResponse: (draft: ResponseDraft) => Promise<ResponseTemplate>;
  deleteResponse: (id: string) => Promise<void>;
  saveChecklistItem: (
    checklistId: string,
    item: ChecklistTemplateItem,
  ) => Promise<void>;
  publishChecklistVersion: (checklistId: string) => Promise<void>;
  addChecklist: (input: {
    name: string;
    sourceFile: string;
    items: ChecklistTemplateItem[];
  }) => Promise<ChecklistTemplate>;
}

export const useTemplatesStore = create<TemplatesState>((set, get) => ({
  responses: [],
  checklists: [],
  layouts: [],
  isLoading: false,
  error: null,

  fetchTemplates: async () => {
    set({ isLoading: true, error: null });
    try {
      const [responses, checklists, layouts] = await Promise.all([
        adapter.getAll<ResponseTemplate>(Collections.RESPONSE_TEMPLATES),
        adapter.getAll<ChecklistTemplate>(Collections.CHECKLIST_TEMPLATES),
        adapter.getAll<WorkbookLayout>(Collections.WORKBOOK_LAYOUTS),
      ]);
      set({ responses, checklists, layouts, isLoading: false });
    } catch (err) {
      set({ isLoading: false, error: (err as Error).message });
    }
  },

  getResponseById: (id) => get().responses.find((r) => r.id === id),
  responsesByScope: (scope) => get().responses.filter((r) => r.scope === scope),
  getChecklistById: (id) => get().checklists.find((c) => c.id === id),

  saveResponse: async (draft) => {
    const now = Date.now();
    if (draft.id && get().getResponseById(draft.id)) {
      const updated = await adapter.update<ResponseTemplate>(
        Collections.RESPONSE_TEMPLATES,
        draft.id,
        { ...draft, updatedAt: now },
      );
      set((s) => ({
        responses: s.responses.map((r) => (r.id === updated.id ? updated : r)),
      }));
      return updated;
    }
    const full: ResponseTemplate = {
      id: draft.id ?? generateId(),
      scope: draft.scope,
      group: draft.group,
      name: draft.name,
      body: draft.body,
      createdAt: now,
    };
    const created = await adapter.create<ResponseTemplate>(
      Collections.RESPONSE_TEMPLATES,
      full,
    );
    set((s) => ({ responses: [...s.responses, created] }));
    return created;
  },

  deleteResponse: async (id) => {
    await adapter.remove(Collections.RESPONSE_TEMPLATES, id);
    set((s) => ({ responses: s.responses.filter((r) => r.id !== id) }));
  },

  saveChecklistItem: async (checklistId, item) => {
    const checklist = get().getChecklistById(checklistId);
    if (!checklist) return;
    const exists = checklist.items.some((i) => i.id === item.id);
    const items = exists
      ? checklist.items.map((i) => (i.id === item.id ? item : i))
      : [...checklist.items, item];
    const updated = await adapter.update<ChecklistTemplate>(
      Collections.CHECKLIST_TEMPLATES,
      checklistId,
      { items, updatedAt: Date.now() },
    );
    set((s) => ({
      checklists: s.checklists.map((c) => (c.id === updated.id ? updated : c)),
    }));
  },

  publishChecklistVersion: async (checklistId) => {
    const checklist = get().getChecklistById(checklistId);
    if (!checklist) return;
    const now = Date.now();
    const updated = await adapter.update<ChecklistTemplate>(
      Collections.CHECKLIST_TEMPLATES,
      checklistId,
      { version: checklist.version + 1, publishedAt: now, updatedAt: now },
    );
    set((s) => ({
      checklists: s.checklists.map((c) => (c.id === updated.id ? updated : c)),
    }));
  },

  addChecklist: async ({ name, sourceFile, items }) => {
    const now = Date.now();
    const full: ChecklistTemplate = {
      id: generateId(),
      name,
      sourceFile,
      version: 1,
      publishedAt: now,
      usedInReviews: 0,
      items,
      createdAt: now,
    };
    const created = await adapter.create<ChecklistTemplate>(
      Collections.CHECKLIST_TEMPLATES,
      full,
    );
    set((s) => ({ checklists: [...s.checklists, created] }));
    return created;
  },
}));
