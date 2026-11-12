import { create } from "zustand";
import { adapter } from "@/data/adapters";
import { Collections } from "@/data/collections";
import {
  canRequest,
  isLive,
  nextStatus,
  type CreditRequestAction,
} from "@/lib/credit-requests";
import { getCurrentUser } from "@/lib/current-user";
import { generateId, type CreditRequest } from "@/types";
import { useSessionStore } from "./session.store";

/**
 * Reviewer credit requests (spec §5.9). Adapter-backed so a request survives reload.
 * One live request per requester (`canRequest`); transitions are the pure `nextStatus`.
 * Writers: the reviewer (request, remind, cancel) and an admin (markOpened, dismiss, fulfil).
 */
interface CreditRequestState {
  requests: CreditRequest[];
  loaded: boolean;
  fetchRequests: () => Promise<void>;
  /** Reviewer asks for more credits. Null when they already have a live request. */
  request: (note?: string) => Promise<CreditRequest | null>;
  remind: (id: string) => Promise<void>;
  cancel: (id: string) => Promise<void>;
  /** An admin saw it (popover opened). */
  markOpened: (id: string) => Promise<void>;
  dismiss: (id: string) => Promise<void>;
  /** Checkout with `request=<id>` paid. */
  fulfil: (id: string) => Promise<void>;
  /** Live requests for an org (admin view), newest first. */
  openFor: (orgId: string) => CreditRequest[];
  /** A requester's requests, newest first. */
  mine: (userId: string) => CreditRequest[];
}

const orgId = () => useSessionStore.getState().orgId ?? "";
const newestFirst = (a: CreditRequest, b: CreditRequest) =>
  b.createdAt - a.createdAt;

export const useCreditRequestStore = create<CreditRequestState>((set, get) => {
  // One ask in flight at a time: the dialog and Billing can both call request() before the
  // first write lands, and canRequest() alone would let both through.
  let asking: Promise<CreditRequest | null> | null = null;
  const apply = async (id: string, action: CreditRequestAction) => {
    const cur = get().requests.find((r) => r.id === id);
    if (!cur) return;
    const next = nextStatus(cur, action, Date.now());
    if (next === cur) return;
    await adapter.update<CreditRequest>(Collections.CREDIT_REQUESTS, id, next);
    set({ requests: get().requests.map((r) => (r.id === id ? next : r)) });
  };

  return {
    requests: [],
    loaded: false,

    fetchRequests: async () => {
      const all = await adapter.getAll<CreditRequest>(
        Collections.CREDIT_REQUESTS,
      );
      set({ requests: all, loaded: true });
    },

    request: (note) => {
      if (asking) return asking;
      asking = (async () => {
        if (!get().loaded) await get().fetchRequests();
        const me = getCurrentUser().id;
        const org = orgId();
        const inOrg = get().requests.filter((r) => r.orgId === org);
        if (!canRequest(inOrg, me)) return null;
        const row: CreditRequest = {
          id: generateId(),
          orgId: org,
          requesterId: me,
          note: note?.trim() || undefined,
          createdAt: Date.now(),
          status: "open",
        };
        await adapter.create<CreditRequest>(Collections.CREDIT_REQUESTS, row);
        set({ requests: [...get().requests, row] });
        return row;
      })().finally(() => {
        asking = null;
      });
      return asking;
    },

    remind: (id) => apply(id, "remind"),
    cancel: (id) => apply(id, "cancel"),
    markOpened: (id) => apply(id, "open"),
    dismiss: (id) => apply(id, "dismiss"),
    fulfil: (id) => apply(id, "fulfil"),

    openFor: (org) =>
      get()
        .requests.filter((r) => r.orgId === org && isLive(r))
        .sort(newestFirst),
    mine: (userId) =>
      get()
        .requests.filter((r) => r.requesterId === userId)
        .sort(newestFirst),
  };
});
