"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn, STATUS_META, relativeDue } from "@/lib/utils";
import { useReview } from "@/store/useReview";
import { Chip } from "@/components/atoms";

export function ReviewContextBar({ reviewId }: { reviewId: string }) {
  const pathname = usePathname();
  const review = useReview(reviewId);

  const base = `/reviews/${reviewId}`;
  const onTechnical =
    pathname.includes("/technical") ||
    pathname.includes("/builder") ||
    pathname.includes("/workbook");
  const onAdmin = pathname.includes("/administrative");

  const subItems = [
    { href: `${base}/technical`, label: "Findings", match: "/technical" },
    { href: `${base}/builder`, label: "Builder", match: "/builder" },
    { href: `${base}/workbook`, label: "Workbook", match: "/workbook" },
  ];

  const st = review ? STATUS_META[review.status] : null;
  const due = review ? relativeDue(review.slaDueAt) : null;

  return (
    <div className="revbar">
      <div className="revbar-tabs">
        <Link href={`${base}/technical`} className={cn("revtab", onTechnical && "on")}>
          Technical
          {review && review.openFindings > 0 && (
            <span className="revtab-b">{review.openFindings}</span>
          )}
        </Link>
        <Link
          href={`${base}/administrative`}
          className={cn("revtab", onAdmin && "on")}
        >
          Administrative
        </Link>

        <div style={{ flex: 1 }} />
        {st && (
          <Chip tone={review!.status === "completed" ? "pass" : review!.status === "returned" ? "flag" : "info"}>
            {st.label}
          </Chip>
        )}
        {review && review.flaggedCount > 0 && (
          <Chip tone="flag">{review.flaggedCount} flagged</Chip>
        )}
        {due && review?.status !== "completed" && (
          <Chip tone={due.tone === "overdue" ? "fail" : "neutral"}>{due.label}</Chip>
        )}
      </div>

      {onTechnical && (
        <div className="revbar-sub">
          {subItems.map((s) => (
            <Link
              key={s.href}
              href={s.href}
              className={cn("revsub", pathname.includes(s.match) && "on")}
            >
              {s.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
