"use client";

import { useReviewsStore } from "@/store";
import type { Review } from "@/types";

const SAMPLE_ID = "review-sample";

/**
 * The org's first own review (spec §5.2 real-app adaptations): "Open review", "Start tour"
 * and "Sign workbook" land on it. Derived from the reviews store (already scoped to the
 * session's org), skipping the walkthrough review; no stored field.
 */
// "First" = reviews-store order, not earliest createdAt: the seed intends 220 Commerce Way for Harbor.
export function useFirstOwnReview(): Review | undefined {
  return useReviewsStore((s) => s.reviews.find((r) => !r.sample && r.id !== SAMPLE_ID));
}
