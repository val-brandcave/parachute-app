import { create } from "zustand";
import { adapter } from "@/data/adapters";
import { Collections } from "@/data/collections";
import { DEFAULT_ORG_ID } from "@/lib/identity-defaults";
import { generateId, type Review } from "@/types";
import { useSessionStore } from "./session.store";

/** Reviews with no orgId belong to the default org. */
const currentOrgId = () => useSessionStore.getState().orgId;
const belongsTo = (r: Review, orgId: string | null) =>
  orgId !== null && (r.orgId ?? DEFAULT_ORG_ID) === orgId;

/** The order-derived fields; the store stamps id + timestamps. */
type NewReview = Omit<Review, "id" | "createdAt" | "orderedAt">;

interface ReviewsState {
  reviews: Review[];
  isLoading: boolean;
  error: string | null;
  fetchReviews: () => Promise<void>;
  getById: (id: string) => Review | undefined;
  /** Persist a new review (Order stepper "Run pipeline") and add it to state. */
  addReview: (review: NewReview) => Promise<Review>;
  /** Patch an existing review + persist (e.g. Start flips intake → running). */
  updateReview: (id: string, patch: Partial<Review>) => Promise<void>;
}

export const useReviewsStore = create<ReviewsState>((set, get) => ({
  reviews: [],
  isLoading: false,
  error: null,

  fetchReviews: async () => {
    set({ isLoading: true, error: null });
    try {
      const orgId = currentOrgId();
      const reviews = (await adapter.getAll<Review>(Collections.REVIEWS)).filter((r) =>
        belongsTo(r, orgId),
      );
      set({ reviews, isLoading: false });
    } catch (err) {
      set({ isLoading: false, error: (err as Error).message });
    }
  },

  getById: (id) => get().reviews.find((r) => r.id === id),

  addReview: async (review) => {
    const now = Date.now();
    const full: Review = {
      ...review,
      orgId: review.orgId ?? currentOrgId() ?? DEFAULT_ORG_ID,
      id: generateId(),
      orderedAt: now,
      createdAt: now,
    };
    const created = await adapter.create<Review>(Collections.REVIEWS, full);
    set((s) => ({ reviews: [created, ...s.reviews] }));
    return created;
  },

  updateReview: async (id, patch) => {
    const current = get().reviews.find((r) => r.id === id);
    if (!current) return;
    const next = { ...current, ...patch };
    await adapter.update<Review>(Collections.REVIEWS, id, patch);
    set((s) => ({ reviews: s.reviews.map((r) => (r.id === id ? next : r)) }));
  },
}));
