"use client";

import { usePathname } from "next/navigation";
import { TourChip } from "@/components/molecules/TourChip";
import { tourForPath } from "@/lib/tours";

/**
 * Header start slot after Breadcrumbs: the page tour chip (spec §5.13, PC-38). The route
 * match comes from `lib/tours.ts`; the chip is keyed by pathname so each visit to a page
 * is a fresh "first visit" check. The chip itself decides whether to show (first visit,
 * first target on the page).
 */
export function HeaderChipSlot() {
  const pathname = usePathname() ?? "";
  const tour = tourForPath(pathname);
  if (!tour) return null;
  return (
    <span className="tour-slot">
      <TourChip key={pathname} tourId={tour.id} />
    </span>
  );
}
