import { useEffect } from "react";
import { useReviewsStore } from "./reviews.store";

/** Ensures reviews are loaded and returns the one matching `id`. */
export function useReview(id: string) {
  const { reviews, fetchReviews } = useReviewsStore();
  useEffect(() => {
    if (!reviews.length) fetchReviews();
  }, [reviews.length, fetchReviews]);
  return reviews.find((r) => r.id === id);
}
