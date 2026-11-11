import type { CreditPackId, ReviewType } from "@/types";
import { CREDIT_PACKS, CUSTOM_CREDITS, DEFAULT_PACK_ID } from "@/lib/pricing";

/**
 * Focused checkout (`/checkout/credits`, spec §5.6): the query contract, the safe
 * return path and the initial amount. Pure; no store or router access.
 */

export type CheckoutStep = "amount" | "payment" | "review" | "done";
export const CHECKOUT_STEPS: CheckoutStep[] = ["amount", "payment", "review", "done"];

export const CHECKOUT_PATH = "/checkout/credits";
export const CHECKOUT_FALLBACK_RETURN = "/configure/billing";

export type CheckoutChoice = { pack: CreditPackId } | { credits: number };

export interface CheckoutDraft {
  choice: CheckoutChoice;
  step: CheckoutStep;
  /** Validated by safeReturn; always a same-origin path. */
  returnTo: string;
  /** True when the query carried a `return` (the Paid primary becomes "Back to …"). */
  hasReturn: boolean;
  /** Review types carried back to Review setup. */
  types: ReviewType[];
  /** Credit request being fulfilled (phase 4). */
  request?: string;
  /** Prototype-only: `error=card` shows the decline callout on Payment. */
  error?: "card";
}

const REVIEW_TYPES: ReviewType[] = ["technical", "administrative"];

/** Same-origin path only: starts with "/", not "//", not a checkout page. Else the billing page.
 *  Blocks open redirects through `return` (RF4). */
export function safeReturn(raw: string | null | undefined): string {
  if (!raw) return CHECKOUT_FALLBACK_RETURN;
  const v = raw.trim();
  if (!v.startsWith("/") || v.startsWith("//") || v.startsWith("/\\")) return CHECKOUT_FALLBACK_RETURN;
  if (v === "/checkout" || v.startsWith("/checkout/") || v.startsWith("/checkout?")) return CHECKOUT_FALLBACK_RETURN;
  return v;
}

const clampCredits = (n: number) => Math.min(CUSTOM_CREDITS.max, Math.max(CUSTOM_CREDITS.min, Math.round(n)));

/** The amount checkout opens on. `needed` is the SHORTFALL (RF2), never the full cost:
 *  below the smallest pack → exactly that many (custom); else the smallest pack that covers
 *  it; above every pack → custom (clamped). No need → the default pack. */
export function initialChoice(needed?: number): CheckoutChoice {
  if (needed === undefined || !Number.isFinite(needed) || needed <= 0) return { pack: DEFAULT_PACK_ID };
  const sorted = [...CREDIT_PACKS].sort((a, b) => a.credits - b.credits);
  if (needed < sorted[0].credits) return { credits: clampCredits(needed) };
  const covering = sorted.find((p) => p.credits >= needed);
  return covering ? { pack: covering.id } : { credits: clampCredits(needed) };
}

/** Build a checkout URL. `returnTo` is encoded; `types` joined with commas. */
export function checkoutHref(o: {
  credits?: number;
  pack?: CreditPackId;
  returnTo?: string;
  types?: ReviewType[];
  request?: string;
  step?: CheckoutStep;
}): string {
  const q = new URLSearchParams();
  if (o.step && o.step !== "amount") q.set("step", o.step);
  if (o.credits !== undefined) q.set("credits", String(o.credits));
  else if (o.pack) q.set("pack", o.pack);
  if (o.returnTo) q.set("return", o.returnTo);
  if (o.types?.length) q.set("types", o.types.join(","));
  if (o.request) q.set("request", o.request);
  const s = q.toString();
  return s ? `${CHECKOUT_PATH}?${s}` : CHECKOUT_PATH;
}

/** Read the query into a draft. Unknown values fall back; credits clamp to CUSTOM_CREDITS. */
export function parseCheckoutQuery(sp: URLSearchParams): CheckoutDraft {
  const rawStep = sp.get("step");
  const step: CheckoutStep = CHECKOUT_STEPS.includes(rawStep as CheckoutStep) ? (rawStep as CheckoutStep) : "amount";
  let choice: CheckoutChoice;
  const rawCredits = sp.get("credits");
  const n = rawCredits === null ? NaN : Number.parseInt(rawCredits, 10);
  if (Number.isFinite(n)) {
    choice = { credits: clampCredits(n) };
  } else {
    const rawPack = sp.get("pack");
    const pack = CREDIT_PACKS.find((p) => p.id === rawPack);
    choice = { pack: pack ? pack.id : DEFAULT_PACK_ID };
  }
  const rawReturn = sp.get("return");
  const types = (sp.get("types") ?? "")
    .split(",")
    .map((t) => t.trim())
    .filter((t): t is ReviewType => REVIEW_TYPES.includes(t as ReviewType));
  return {
    choice,
    step,
    returnTo: safeReturn(rawReturn),
    hasReturn: !!rawReturn && safeReturn(rawReturn) === rawReturn.trim(),
    types: [...new Set(types)],
    request: sp.get("request") || undefined,
    error: sp.get("error") === "card" ? "card" : undefined,
  };
}
