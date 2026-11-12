"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { CreditLedgerEntry } from "@/types";
import {
  CHECKOUT_STEPS,
  checkoutBlock,
  parseCheckoutQuery,
  type CheckoutBlock,
  type CheckoutChoice,
  type CheckoutDraft,
  type CheckoutStep,
} from "@/lib/checkout";
import { useCurrentOrg, useCurrentUser } from "@/lib/current-user";
import { walletView } from "@/lib/wallet-view";
import {
  AUTO_RELOAD_DEFAULTS,
  CREDIT_USD,
  PURCHASED_LIFE_MONTHS,
  costFor,
  creditRateUsd,
  customPriceUsd,
  packById,
} from "@/lib/pricing";
import { useCreditRequestStore, useOrgStore, useSessionStore, useUsersStore, useWalletStore, useWalletView } from "@/store";

/**
 * Page hook for `/checkout/credits` (spec §5.6). Everything that must survive a hard
 * reload lives in the URL (amount, step, return, types, request, the paid receipt) or in
 * the adapter-backed wallet. The Payment form (contact, PO, new card, auto-reload opt-in)
 * is a per-tab draft kept in sessionStorage, seeded from the wallet settings.
 */

const FULL_REVIEW = costFor(["technical", "administrative"]);
const FORM_KEY = "parachute:checkout-form";

export type PayWith = "saved" | "new";

export interface CheckoutForm {
  payWith: PayWith;
  cardNumber: string;
  cardExpiry: string;
  cardCvc: string;
  name: string;
  email: string;
  receiptCc: string;
  poNumber: string;
  autoReload: boolean;
}

export interface CheckoutLine {
  credits: number;
  priceUsd: number;
  rateUsd: number;
  /** Dollars saved against the list price (CREDIT_USD a credit). */
  savingUsd: number;
  isPack: boolean;
}

/** The order line for a choice; every number from pricing.ts. */
export function lineFor(choice: CheckoutChoice): CheckoutLine {
  if ("pack" in choice) {
    const p = packById(choice.pack);
    return {
      credits: p.credits,
      priceUsd: p.priceUsd,
      rateUsd: p.priceUsd / p.credits,
      savingUsd: p.credits * CREDIT_USD - p.priceUsd,
      isPack: true,
    };
  }
  const price = customPriceUsd(choice.credits);
  return {
    credits: choice.credits,
    priceUsd: price,
    rateUsd: creditRateUsd(choice.credits),
    savingUsd: choice.credits * CREDIT_USD - price,
    isPack: false,
  };
}

/** Append `types=<a,b>` to a same-origin path, merging with its own query. */
export function withTypes(path: string, types: readonly string[]): string {
  if (!types.length) return path;
  const hashAt = path.indexOf("#");
  const hash = hashAt >= 0 ? path.slice(hashAt) : "";
  const base = hashAt >= 0 ? path.slice(0, hashAt) : path;
  const qAt = base.indexOf("?");
  const pathname = qAt >= 0 ? base.slice(0, qAt) : base;
  const q = new URLSearchParams(qAt >= 0 ? base.slice(qAt + 1) : "");
  q.set("types", types.join(","));
  return `${pathname}?${q.toString().replace(/%2C/g, ",")}${hash}`;
}

export const fullReviewsIn = (credits: number) => Math.floor(credits / FULL_REVIEW);
export const FULL_REVIEW_CREDITS = FULL_REVIEW;

function readForm(): Partial<CheckoutForm> | null {
  try {
    const raw = window.sessionStorage.getItem(FORM_KEY);
    return raw ? (JSON.parse(raw) as Partial<CheckoutForm>) : null;
  } catch {
    return null;
  }
}

function writeForm(f: CheckoutForm) {
  try {
    // Never keep card details (number, expiry, CVC), even in a prototype.
    const { cardNumber: _n, cardExpiry: _e, cardCvc: _c, ...rest } = f;
    void _n;
    void _e;
    void _c;
    window.sessionStorage.setItem(FORM_KEY, JSON.stringify(rest));
  } catch {
    /* storage blocked: the form just resets on reload */
  }
}

function clearForm() {
  try {
    window.sessionStorage.removeItem(FORM_KEY);
  } catch {
    /* ignore */
  }
}

/** Why this viewer can't pay here (lock-then-explain), or null: the one rule in lib/checkout.ts. */
export type { CheckoutBlock } from "@/lib/checkout";

export function useCheckout() {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const spKey = sp.toString();
  const draft: CheckoutDraft = useMemo(() => parseCheckoutQuery(new URLSearchParams(spKey)), [spKey]);
  const receiptParam = new URLSearchParams(spKey).get("receipt");

  const user = useCurrentUser();
  const org = useCurrentOrg();
  const orgRecord = useOrgStore((s) => s.org);
  const sessionMode = useSessionStore((s) => s.mode);
  const allUsers = useUsersStore((s) => s.allUsers);
  const wallet = useWalletView();
  const ledger = useWalletStore((s) => s.ledger);
  const settings = useWalletStore((s) => s.settings);
  const walletLoading = useWalletStore((s) => s.loading);

  const savedCard = settings?.paymentMethod === "card" && !!settings.cardLast4;

  const [now] = useState(() => Date.now());

  // ---- Payment form (seeded from settings once they load) ----
  const [form, setFormState] = useState<CheckoutForm | null>(null);
  useEffect(() => {
    if (form || !settings) return;
    const stored = readForm();
    const seeded: CheckoutForm = {
      payWith: savedCard ? "saved" : "new",
      cardNumber: "",
      cardExpiry: "",
      cardCvc: "",
      name: user.name,
      email: settings.billingEmail ?? user.email,
      receiptCc: settings.receiptCc ?? "",
      poNumber: settings.poNumber ?? "",
      autoReload: settings.autoReload,
      ...(stored ?? {}),
    };
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time seed once the adapter-backed settings arrive
    setFormState(seeded);
  }, [form, settings, savedCard, user.name, user.email]);

  const setForm = useCallback((patch: Partial<CheckoutForm>) => {
    setFormState((f) => {
      if (!f) return f;
      const next = { ...f, ...patch };
      writeForm(next);
      return next;
    });
  }, []);

  // ---- URL helpers ----
  const hrefWith = useCallback(
    (patch: Record<string, string | null>) => {
      const q = new URLSearchParams(spKey);
      for (const [k, v] of Object.entries(patch)) {
        if (v === null) q.delete(k);
        else q.set(k, v);
      }
      const s = q.toString();
      return s ? `${pathname}?${s}` : pathname;
    },
    [spKey, pathname],
  );

  /** Walk to a step. push, so browser Back walks the steps. */
  const go = useCallback(
    (step: CheckoutStep) => router.push(hrefWith({ step: step === "amount" ? null : step }), { scroll: false }),
    [router, hrefWith],
  );

  /** Change the amount in place (replace: picking a tile is not a step). */
  const setChoice = useCallback(
    (choice: CheckoutChoice) => {
      const patch =
        "pack" in choice ? { pack: choice.pack, credits: null } : { credits: String(choice.credits), pack: null };
      router.replace(hrefWith(patch), { scroll: false });
    },
    [router, hrefWith],
  );

  /** Where Exit and "Back to your review" go: `returnTo` with the carried review types
   *  appended (RF4), so Review setup reopens with the same selection. */
  const returnHref = useMemo(() => withTypes(draft.returnTo, draft.types), [draft.returnTo, draft.types]);
  const exit = useCallback(() => router.push(returnHref), [router, returnHref]);

  // ---- Who may pay ----
  const admin = useMemo(
    () => allUsers.find((u) => u.orgId === org.id && u.role === "org_admin" && u.id !== user.id),
    [allUsers, org.id, user.id],
  );
  const block: CheckoutBlock = checkoutBlock({
    embedded: sessionMode === "embedded",
    billing: orgRecord?.billing,
    role: user.role,
    approval: orgRecord?.approval,
  });

  // ---- Paid ----
  const paidEntry: CreditLedgerEntry | null = useMemo(
    () => (receiptParam ? (ledger.find((e) => e.receiptId === receiptParam) ?? null) : null),
    [ledger, receiptParam],
  );
  /** `step=done` only renders with a receipt that exists; otherwise it reads as Amount. */
  const step: CheckoutStep =
    draft.step === "done" ? (receiptParam && (paidEntry || walletLoading) ? "done" : "amount") : draft.step;

  /** Balance just before the paid entry, read from the ledger as it stood then (not the
   *  live balance minus the pack, which drifts once anything else lands). */
  const paidBefore: number | null = useMemo(() => {
    if (!paidEntry) return null;
    const at = ledger.indexOf(paidEntry);
    return walletView(at >= 0 ? ledger.slice(0, at) : ledger, {
      now,
      approval: orgRecord?.approval,
      billing: orgRecord?.billing,
    }).balance;
  }, [ledger, paidEntry, now, orgRecord?.approval, orgRecord?.billing]);

  // ---- Pay ----
  /**
   * Buys first. Once purchase() has succeeded the money has moved, so the settings writes
   * after it are best-effort: a failure there is reported (`settingsFailed`) but never
   * turns the payment into a failure a retry would charge again.
   */
  const pay = useCallback(async (): Promise<{ receiptId: string; settingsFailed: boolean }> => {
    const ws = useWalletStore.getState();
    const choice = "pack" in draft.choice ? draft.choice.pack : { credits: draft.choice.credits };
    const entry = await ws.purchase(choice);
    let settingsFailed = false;
    if (form) {
      const writes: Promise<void>[] = [
        // The same setters Billing → Settings uses, so the two never disagree.
        ws.setBillingSettings({
          billingEmail: form.email.trim() || undefined,
          receiptCc: form.receiptCc.trim() || undefined,
          poNumber: form.poNumber.trim() || undefined,
        }),
      ];
      const digits = form.cardNumber.replace(/\D/g, "");
      if (form.payWith === "new" && digits.length >= 4) {
        writes.push(ws.setPaymentMethod({ paymentMethod: "card", cardLast4: digits.slice(-4) }));
      }
      if (form.autoReload && !settings?.autoReload) {
        writes.push(
          ws.setAutoReload({
            autoReload: true,
            reloadPackId: AUTO_RELOAD_DEFAULTS.packId,
            reloadBelow: AUTO_RELOAD_DEFAULTS.below,
            monthlyCap: AUTO_RELOAD_DEFAULTS.monthlyCap,
          }),
        );
      }
      const results = await Promise.allSettled(writes);
      settingsFailed = results.some((r) => r.status === "rejected");
    }
    // A reviewer's credit request rides in as `request=<id>`: Paid fulfils it. Best-effort,
    // like the settings writes above: the money has moved, so a failure here never fails the pay.
    if (draft.request) {
      try {
        const rs = useCreditRequestStore.getState();
        if (!rs.loaded) await rs.fetchRequests();
        await rs.fulfil(draft.request);
      } catch {
        /* the purchase stands; the request stays open and the admin can dismiss it */
      }
    }
    clearForm();
    return { receiptId: entry.receiptId ?? "", settingsFailed };
  }, [draft.choice, draft.request, form, settings?.autoReload]);

  /** After pay(): replace, so browser Back can't land on Review and pay twice. */
  const finish = useCallback(
    (receiptId: string) => router.replace(hrefWith({ step: "done", receipt: receiptId, error: null }), { scroll: false }),
    [router, hrefWith],
  );

  const validUntil = useMemo(() => {
    const d = new Date(now);
    d.setMonth(d.getMonth() + PURCHASED_LIFE_MONTHS);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  }, [now]);

  return {
    draft,
    step,
    stepIndex: CHECKOUT_STEPS.indexOf(step),
    go,
    pay,
    finish,
    exit,
    returnHref,
    savedCard,
    setChoice,
    line: lineFor(draft.choice),
    form,
    setForm,
    settings,
    wallet,
    org,
    user,
    admin,
    block,
    paidEntry,
    paidBefore,
    validUntil,
  };
}

export type CheckoutApi = ReturnType<typeof useCheckout>;
