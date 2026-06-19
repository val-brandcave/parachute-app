import { create } from "zustand";
import { adapter } from "@/data/adapters";
import { Collections } from "@/data/collections";
import { CURRENT_USER } from "@/lib/current-user";
import type { ReviewSource, ReviewType, YcDelivery } from "@/types";

/** Step indices for the 3-step Order stepper. Callers that pre-open the flow
 *  (dashboard "New from YouConnect", queue "Run") use `ORDER_STEP.confirm` —
 *  never a hardcoded number — so the shape can change in one place. */
export const ORDER_STEP = { source: 0, configure: 1, confirm: 2 } as const;
export const ORDER_STEP_COUNT = 3;

/** Resolved property summary the rail/confirm render — from a YC delivery,
 *  an uploaded+parsed PDF, or a launch prefill. */
export interface OrderProperty {
  address: string;
  propertyType: string;
  lender: string; // the bank / branch
  loanNo: string;
  firm: string; // the fee-appraiser firm
}

/** Context carried into the stepper when launched from an existing delivery
 *  (e.g. a "New from YouConnect" item's Run), so it opens pre-selected. */
export interface OrderPrefill {
  reviewId?: string;
  source?: ReviewSource;
  propertyAddress?: string;
  loanNo?: string;
  bank?: string;
}

export interface OrderDraft {
  source: ReviewSource | null;
  ycDeliveryId: string | null;
  property: OrderProperty | null;
  doc: { name: string; pages: number; viaApi: boolean } | null;
  slaDueAt: number | null;
  isSecondReview: boolean;
  existingReviewId: string | null;
  uploadParsed: boolean; // standalone mode: has the dropped PDF been parsed?
  reviewTypes: ReviewType[];
  // Admin checklist for this order. null = use the org default (resolved at
  // render); a value = a per-order override (the reviewer picked another).
  checklistId: string | null;
  assigneeId: string;
  inheritedAssignee: boolean; // assignee came from the YC delivery
  dueDate: string; // yyyy-mm-dd, "" = use SLA default
  priority: "normal" | "high";
  autoReject: boolean;
  optionsOverridden: boolean;
}

function emptyDraft(): OrderDraft {
  return {
    source: null,
    ycDeliveryId: null,
    property: null,
    doc: null,
    slaDueAt: null,
    isSecondReview: false,
    existingReviewId: null,
    uploadParsed: false,
    reviewTypes: ["technical"],
    checklistId: null,
    assigneeId: CURRENT_USER.id,
    inheritedAssignee: false,
    dueDate: "",
    priority: "normal",
    autoReject: true,
    optionsOverridden: false,
  };
}

interface OrderState {
  open: boolean;
  step: number;
  prefill: OrderPrefill | null;
  draft: OrderDraft;
  deliveries: YcDelivery[];

  openOrder: (opts?: { step?: number; prefill?: OrderPrefill }) => Promise<void>;
  close: () => void;
  setStep: (n: number) => void;

  loadDeliveries: () => Promise<void>;
  chooseSource: (source: ReviewSource) => void;
  selectDelivery: (d: YcDelivery) => void;
  /** Standalone mode: a dropped PDF "parses" → autofill the property summary. */
  parseUpload: (property: OrderProperty, doc: { name: string; pages: number }) => void;
  setUploadField: (key: keyof OrderProperty, value: string) => void;

  toggleType: (t: ReviewType) => void;
  setChecklist: (id: string) => void;
  setAssignee: (id: string) => void;
  setDue: (date: string) => void;
  setPriority: (p: "normal" | "high") => void;
  toggleAutoReject: () => void;
  setOverridden: (v: boolean) => void;
}

/** Controls the global "Order a review" stepper (mounted in AppShell).
 *  `openOrder()` starts a blank order; pass `{ step, prefill }` to jump straight
 *  to a step with a delivery pre-selected (the YouConnect "Run" path). */
export const useOrderStore = create<OrderState>((set, get) => ({
  open: false,
  step: 0,
  prefill: null,
  draft: emptyDraft(),
  deliveries: [],

  openOrder: async (opts) => {
    set({
      open: true,
      step: opts?.step ?? ORDER_STEP.source,
      prefill: opts?.prefill ?? null,
      draft: emptyDraft(),
    });

    // Ensure the inbox is loaded, then resolve any prefill into a real selection.
    let deliveries = get().deliveries;
    if (!deliveries.length) {
      deliveries = await adapter.getAll<YcDelivery>(Collections.YC_DELIVERIES);
      set({ deliveries });
    }

    const pf = opts?.prefill;
    if (!pf) return;
    const match = pf.loanNo
      ? deliveries.find((d) => d.loanNo === pf.loanNo)
      : undefined;
    if (match) {
      get().selectDelivery(match);
    } else if (pf.propertyAddress) {
      // Fallback: seed the summary straight from the prefill.
      set((s) => ({
        draft: {
          ...s.draft,
          source: pf.source ?? "yc",
          property: {
            address: pf.propertyAddress!,
            propertyType: "",
            lender: pf.bank ?? "",
            loanNo: pf.loanNo ?? "",
            firm: "",
          },
        },
      }));
    }
  },

  close: () => set({ open: false, prefill: null, draft: emptyDraft() }),
  setStep: (step) => set({ step }),

  loadDeliveries: async () => {
    if (get().deliveries.length) return;
    const deliveries = await adapter.getAll<YcDelivery>(Collections.YC_DELIVERIES);
    set({ deliveries });
  },

  chooseSource: (source) =>
    set((s) => {
      if (s.draft.source === source) return s;
      // Switching modes clears the source-specific selection.
      return {
        draft: {
          ...s.draft,
          source,
          ycDeliveryId: null,
          property: null,
          doc: null,
          slaDueAt: null,
          isSecondReview: false,
          existingReviewId: null,
          uploadParsed: false,
          inheritedAssignee: false,
        },
      };
    }),

  selectDelivery: (d) =>
    set((s) => ({
      draft: {
        ...s.draft,
        source: "yc",
        ycDeliveryId: d.id,
        property: {
          address: d.propertyAddress,
          propertyType: d.propertyType,
          lender: d.bank,
          loanNo: d.loanNo,
          firm: d.appraisalFirm,
        },
        doc: { name: d.docName, pages: d.docPages, viaApi: d.viaApi },
        slaDueAt: d.slaDueAt,
        isSecondReview: d.status === "in_queue",
        existingReviewId: d.existingReviewId ?? null,
        assigneeId: d.defaultAssigneeId,
        inheritedAssignee: true,
        uploadParsed: false,
      },
    })),

  parseUpload: (property, doc) =>
    set((s) => ({
      draft: {
        ...s.draft,
        source: "manual",
        ycDeliveryId: null,
        property,
        doc: { ...doc, viaApi: false },
        uploadParsed: true,
        isSecondReview: false,
        existingReviewId: null,
        inheritedAssignee: false,
      },
    })),

  setUploadField: (key, value) =>
    set((s) => ({
      draft: {
        ...s.draft,
        property: {
          ...(s.draft.property ?? {
            address: "",
            propertyType: "",
            lender: "",
            loanNo: "",
            firm: "",
          }),
          [key]: value,
        },
      },
    })),

  toggleType: (t) =>
    set((s) => ({
      draft: {
        ...s.draft,
        reviewTypes: s.draft.reviewTypes.includes(t)
          ? s.draft.reviewTypes.filter((x) => x !== t)
          : [...s.draft.reviewTypes, t],
      },
    })),

  setChecklist: (id) => set((s) => ({ draft: { ...s.draft, checklistId: id } })),
  setAssignee: (id) =>
    set((s) => ({ draft: { ...s.draft, assigneeId: id, inheritedAssignee: false } })),
  setDue: (dueDate) => set((s) => ({ draft: { ...s.draft, dueDate } })),
  setPriority: (priority) => set((s) => ({ draft: { ...s.draft, priority } })),
  toggleAutoReject: () =>
    set((s) => ({
      draft: { ...s.draft, autoReject: !s.draft.autoReject, optionsOverridden: true },
    })),
  setOverridden: (optionsOverridden) =>
    set((s) => ({ draft: { ...s.draft, optionsOverridden } })),
}));
