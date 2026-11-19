import type { CreditRequest } from "@/types";

/**
 * Reviewer credit requests (spec §5.9). Pure rules; the store applies them.
 * Live = still waiting on an admin (open, or opened by an admin).
 */
export type CreditRequestAction = "open" | "fulfil" | "dismiss" | "cancel" | "remind";

export const isLive = (r: CreditRequest): boolean => r.status === "open" || r.status === "opened";

/** One live request per requester: they can ask again once the last one is resolved. */
export function canRequest(requests: readonly CreditRequest[], userId: string): boolean {
  return !requests.some((r) => r.requesterId === userId && isLive(r));
}

/** Apply an action. Illegal transitions return the request unchanged. Pure: `now` is passed in.
 *  open: an admin saw it (open → opened). fulfil/dismiss: an admin resolved it. cancel: the
 *  requester withdrew it. remind: sets remindedAt while live. */
export function nextStatus(r: CreditRequest, action: CreditRequestAction, now: number): CreditRequest {
  if (!isLive(r)) return r;
  switch (action) {
    case "open":
      return r.status === "open" ? { ...r, status: "opened", openedAt: now } : r;
    case "fulfil":
      return { ...r, status: "fulfilled", resolvedAt: now };
    case "dismiss":
      return { ...r, status: "dismissed", resolvedAt: now };
    case "cancel":
      return { ...r, status: "cancelled", resolvedAt: now };
    case "remind":
      return { ...r, remindedAt: now };
  }
}
