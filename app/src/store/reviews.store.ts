import { create } from "zustand";
import { adapter } from "@/data/adapters";
import { Collections } from "@/data/collections";
import { generateId, type Review } from "@/types";

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
}

export const useReviewsStore = create<ReviewsState>((set, get) => ({
  reviews: [],
  isLoading: false,
  error: null,

  fetchReviews: async () => {
    set({ isLoading: true, error: null });
    try {
      const reviews = await adapter.getAll<Review>(Collections.REVIEWS);
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
      id: generateId(),
      orderedAt: now,
      createdAt: now,
    };
    const created = await adapter.create<Review>(Collections.REVIEWS, full);
    set((s) => ({ reviews: [created, ...s.reviews] }));
    return created;
  },
}));
