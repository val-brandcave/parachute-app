import { create } from "zustand";
import { adapter } from "@/data/adapters";
import { Collections } from "@/data/collections";
import type { Review } from "@/types";

interface ReviewsState {
  reviews: Review[];
  isLoading: boolean;
  error: string | null;
  fetchReviews: () => Promise<void>;
  getById: (id: string) => Review | undefined;
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
}));
