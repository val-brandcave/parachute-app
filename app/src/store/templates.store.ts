import { create } from "zustand";
import { adapter } from "@/data/adapters";
import { Collections } from "@/data/collections";
import {
  draftVersion,
  nextVersionNumber,
  publishedVersion,
} from "@/lib/template-versions";
import {
  generateId,
  type ChecklistTemplate,
  type ChecklistTemplateItem,
  type ChecklistVersion,
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
  getLayoutById: (id: string) => WorkbookLayout | undefined;

  // ---- Response mutators ----
  saveResponse: (draft: ResponseDraft) => Promise<ResponseTemplate>;
  deleteResponse: (id: string) => Promise<void>;

  // ---- Checklist version lifecycle ----
  // Ensure a draft exists (cloning a base version, default = published) and
  // return its id so the caller can route into the editor for that version.
  ensureChecklistDraft: (
    familyId: string,
    baseVersionId?: string,
  ) => Promise<string | undefined>;
  saveChecklistItem: (
    familyId: string,
    versionId: string,
    item: ChecklistTemplateItem,
  ) => Promise<void>;
  publishChecklistDraft: (familyId: string) => Promise<void>;
  promoteChecklistVersion: (familyId: string, versionId: string) => Promise<void>;
  deleteChecklistVersion: (familyId: string, versionId: string) => Promise<void>;
  addChecklist: (input: {
    name: string;
    sourceFile: string;
    items: ChecklistTemplateItem[];
  }) => Promise<ChecklistTemplate>;

  // ---- Checklist family-level (org default + duplicate / delete) ----
  setDefaultChecklist: (familyId: string) => Promise<void>;
  duplicateChecklistFamily: (familyId: string) => Promise<void>;
  deleteChecklistFamily: (familyId: string) => Promise<void>;

  // ---- Workbook version lifecycle (editing is deferred; promote/delete real) ----
  promoteWorkbookVersion: (familyId: string, versionId: string) => Promise<void>;
  deleteWorkbookVersion: (familyId: string, versionId: string) => Promise<void>;
  setDefaultLayout: (familyId: string) => Promise<void>;
  /** "Save as my template" (F-147): capture a per-review workbook's STRUCTURE +
   *  THEME (never content) as a new personal `WorkbookLayout`, so the next run
   *  can come out the reviewer's way via the F-133 inherited-template tile. */
  saveLayoutFromWorkbook: (input: {
    name: string;
    profile: string;
    theme: string;
    sections: { id: string; title: string; type: string; enabled: boolean }[];
  }) => Promise<WorkbookLayout>;
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
  getLayoutById: (id) => get().layouts.find((l) => l.id === id),

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

  // --- Checklist versions -------------------------------------------------

  ensureChecklistDraft: async (familyId, baseVersionId) => {
    const family = get().getChecklistById(familyId);
    if (!family) return undefined;

    // A family carries at most one draft — reuse it rather than stacking drafts.
    const existing = draftVersion(family.versions);
    if (existing) return existing.id;

    const base =
      (baseVersionId && family.versions.find((v) => v.id === baseVersionId)) ||
      publishedVersion(family.versions) ||
      family.versions[family.versions.length - 1];
    if (!base) return undefined;

    const now = Date.now();
    const draft: ChecklistVersion = {
      id: generateId(),
      version: nextVersionNumber(family.versions),
      status: "draft",
      sourceFile: base.sourceFile,
      // Deep-clone items with fresh ids so editing the draft never mutates the
      // snapshot it was based on.
      items: base.items.map((it) => ({ ...it, id: generateId() })),
      createdAt: now,
    };
    const updated = await adapter.update<ChecklistTemplate>(
      Collections.CHECKLIST_TEMPLATES,
      familyId,
      { versions: [...family.versions, draft], updatedAt: now },
    );
    set((s) => ({
      checklists: s.checklists.map((c) => (c.id === updated.id ? updated : c)),
    }));
    return draft.id;
  },

  saveChecklistItem: async (familyId, versionId, item) => {
    const family = get().getChecklistById(familyId);
    if (!family) return;
    const versions = family.versions.map((v) => {
      if (v.id !== versionId) return v;
      const exists = v.items.some((i) => i.id === item.id);
      const items = exists
        ? v.items.map((i) => (i.id === item.id ? item : i))
        : [...v.items, item];
      return { ...v, items };
    });
    const updated = await adapter.update<ChecklistTemplate>(
      Collections.CHECKLIST_TEMPLATES,
      familyId,
      { versions, updatedAt: Date.now() },
    );
    set((s) => ({
      checklists: s.checklists.map((c) => (c.id === updated.id ? updated : c)),
    }));
  },

  publishChecklistDraft: async (familyId) => {
    const family = get().getChecklistById(familyId);
    if (!family) return;
    const draft = draftVersion(family.versions);
    if (!draft) return;
    const now = Date.now();
    const versions = family.versions.map((v) => {
      if (v.id === draft.id) return { ...v, status: "published" as const, publishedAt: now };
      if (v.status === "published") return { ...v, status: "archived" as const };
      return v;
    });
    const updated = await adapter.update<ChecklistTemplate>(
      Collections.CHECKLIST_TEMPLATES,
      familyId,
      { versions, updatedAt: now },
    );
    set((s) => ({
      checklists: s.checklists.map((c) => (c.id === updated.id ? updated : c)),
    }));
  },

  // Roll back: re-publish an existing snapshot, archiving the current published.
  promoteChecklistVersion: async (familyId, versionId) => {
    const family = get().getChecklistById(familyId);
    if (!family) return;
    const now = Date.now();
    const versions = family.versions.map((v) => {
      if (v.id === versionId) return { ...v, status: "published" as const, publishedAt: now };
      if (v.status === "published") return { ...v, status: "archived" as const };
      return v;
    });
    const updated = await adapter.update<ChecklistTemplate>(
      Collections.CHECKLIST_TEMPLATES,
      familyId,
      { versions, updatedAt: now },
    );
    set((s) => ({
      checklists: s.checklists.map((c) => (c.id === updated.id ? updated : c)),
    }));
  },

  deleteChecklistVersion: async (familyId, versionId) => {
    const family = get().getChecklistById(familyId);
    if (!family) return;
    const target = family.versions.find((v) => v.id === versionId);
    // Never delete the published version or the family's last remaining version.
    if (!target || target.status === "published" || family.versions.length <= 1) return;
    const versions = family.versions.filter((v) => v.id !== versionId);
    const updated = await adapter.update<ChecklistTemplate>(
      Collections.CHECKLIST_TEMPLATES,
      familyId,
      { versions, updatedAt: Date.now() },
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
      usedInReviews: 0,
      createdAt: now,
      // New upload lands as a draft: the reviewer confirms the AI mappings on
      // the mapper, then publishes v1 to make it live for new reviews.
      versions: [
        {
          id: generateId(),
          version: 1,
          status: "draft",
          sourceFile,
          items,
          createdAt: now,
        },
      ],
    };
    const created = await adapter.create<ChecklistTemplate>(
      Collections.CHECKLIST_TEMPLATES,
      full,
    );
    set((s) => ({ checklists: [...s.checklists, created] }));
    return created;
  },

  // Single org default: setting one clears the flag on every other family.
  setDefaultChecklist: async (familyId) => {
    const now = Date.now();
    await Promise.all(
      get().checklists.map((c) =>
        adapter.update<ChecklistTemplate>(Collections.CHECKLIST_TEMPLATES, c.id, {
          isDefault: c.id === familyId,
          updatedAt: now,
        }),
      ),
    );
    set((s) => ({
      checklists: s.checklists.map((c) => ({ ...c, isDefault: c.id === familyId })),
    }));
  },

  duplicateChecklistFamily: async (familyId) => {
    const family = get().getChecklistById(familyId);
    if (!family) return;
    const now = Date.now();
    const copy: ChecklistTemplate = {
      id: generateId(),
      name: `Copy of ${family.name}`,
      usedInReviews: 0,
      isDefault: false,
      createdAt: now,
      versions: family.versions.map((v) => ({
        ...v,
        id: generateId(),
        items: v.items.map((it) => ({ ...it, id: generateId() })),
      })),
    };
    const created = await adapter.create<ChecklistTemplate>(
      Collections.CHECKLIST_TEMPLATES,
      copy,
    );
    set((s) => ({ checklists: [...s.checklists, created] }));
  },

  deleteChecklistFamily: async (familyId) => {
    const family = get().getChecklistById(familyId);
    // Guard: the org default can't be deleted — transfer the default first.
    if (!family || family.isDefault) return;
    await adapter.remove(Collections.CHECKLIST_TEMPLATES, familyId);
    set((s) => ({ checklists: s.checklists.filter((c) => c.id !== familyId) }));
  },

  // --- Workbook versions (promote/delete real; section editing deferred) ---

  promoteWorkbookVersion: async (familyId, versionId) => {
    const family = get().getLayoutById(familyId);
    if (!family) return;
    const now = Date.now();
    const versions = family.versions.map((v) => {
      if (v.id === versionId) return { ...v, status: "published" as const, publishedAt: now };
      if (v.status === "published") return { ...v, status: "archived" as const };
      return v;
    });
    const updated = await adapter.update<WorkbookLayout>(
      Collections.WORKBOOK_LAYOUTS,
      familyId,
      { versions, updatedAt: now },
    );
    set((s) => ({
      layouts: s.layouts.map((l) => (l.id === updated.id ? updated : l)),
    }));
  },

  deleteWorkbookVersion: async (familyId, versionId) => {
    const family = get().getLayoutById(familyId);
    if (!family) return;
    const target = family.versions.find((v) => v.id === versionId);
    if (!target || target.status === "published" || family.versions.length <= 1) return;
    const versions = family.versions.filter((v) => v.id !== versionId);
    const updated = await adapter.update<WorkbookLayout>(
      Collections.WORKBOOK_LAYOUTS,
      familyId,
      { versions, updatedAt: Date.now() },
    );
    set((s) => ({
      layouts: s.layouts.map((l) => (l.id === updated.id ? updated : l)),
    }));
  },

  // One default per profile: setting one clears the flag on others in the same
  // profile (other profiles' defaults are untouched).
  setDefaultLayout: async (familyId) => {
    const target = get().getLayoutById(familyId);
    if (!target) return;
    const now = Date.now();
    const affected = get().layouts.filter((l) => l.profile === target.profile);
    await Promise.all(
      affected.map((l) =>
        adapter.update<WorkbookLayout>(Collections.WORKBOOK_LAYOUTS, l.id, {
          isDefault: l.id === familyId,
          updatedAt: now,
        }),
      ),
    );
    set((s) => ({
      layouts: s.layouts.map((l) =>
        l.profile === target.profile ? { ...l, isDefault: l.id === familyId } : l,
      ),
    }));
  },

  saveLayoutFromWorkbook: async ({ name, profile, theme, sections }) => {
    const now = Date.now();
    const full: WorkbookLayout = {
      id: generateId(),
      // Personal save inherits the org of the existing layout shelf.
      orgId: get().layouts[0]?.orgId ?? "org-001",
      name,
      profile,
      isDefault: false,
      createdAt: now,
      versions: [
        {
          id: generateId(),
          version: 1,
          status: "published",
          theme,
          sections,
          createdAt: now,
          publishedAt: now,
        },
      ],
    };
    const created = await adapter.create<WorkbookLayout>(
      Collections.WORKBOOK_LAYOUTS,
      full,
    );
    set((s) => ({ layouts: [...s.layouts, created] }));
    return created;
  },
}));
