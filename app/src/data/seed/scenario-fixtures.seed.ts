import type { CreditRequest, Review } from "@/types";
import type { DataState } from "@/lib/prototype/scenario";
import { seedReviews } from "./reviews.seed";

/**
 * Scenario fixtures (spec §7): the rows the prototype scenario writes into the stage org
 * when its `data` / `request` axes change. NOT part of `seedAll`: nothing here is written at
 * seed time, so these rows never need a SEED_VERSION bump. `rebuildStageOrg` (lib/demo.ts)
 * reads them on every apply.
 *
 *  - `populated` = the stage org's own seeded reviews (reviews.seed.ts, unchanged).
 *  - `busy` = populated plus a full pipeline. Lakeside and Cedar never had review rows, so
 *    the busy rows are re-keyed copies of the Meridian queue: same tailored content (the
 *    workspace and admin stores fall back to review-001's findings for any review without
 *    its own), new ids, the stage org's bank name. The tailored seeds are never edited.
 */

const BUSY_ASSIGNEES = ["user-dr", "user-mo", "user-pn"];

/** The stage org's own seeded reviews, without the org-agnostic sample. */
function ownReviews(orgId: string): Review[] {
  return seedReviews.filter((r) => r.orgId === orgId && !r.sample);
}

/** Meridian's queue re-keyed into the stage org. Ids are stable, so a reload finds them. */
function busyReviews(orgId: string, bank: string): Review[] {
  return seedReviews
    .filter((r) => r.orgId === "org-001")
    .map((r, i) => ({
      ...r,
      id: `fx-busy-${r.id}`,
      orgId,
      bank,
      assigneeId: BUSY_ASSIGNEES[i % BUSY_ASSIGNEES.length],
    }));
}

/** Reviews for the stage org under a `data` value. The sample review is handled separately. */
export function fixtureReviews(data: DataState, orgId: string, bank: string): Review[] {
  if (data === "empty") return [];
  if (data === "populated") return ownReviews(orgId);
  return [...ownReviews(orgId), ...busyReviews(orgId, bank)];
}

/** The "Request waiting" record (spec §5.9): Marcus asked Dana for credits half an hour ago. */
export function fixtureCreditRequest(orgId: string, now: number): CreditRequest {
  return {
    id: `creq-sc-${orgId}`,
    orgId,
    requesterId: "user-mo",
    note: "Two appraisals are waiting for me this week.",
    createdAt: now - 30 * 60_000,
    status: "open",
  };
}
