"use client";

import { useMemo, useState } from "react";
import { Dialog, Input, Switch, useToast } from "@realwired/ui";
import { Button, CreditChip, Icon } from "@/components/atoms";
import { useCurrentOrg } from "@/lib/current-user";
import {
  CREDIT_PACKS,
  CREDIT_USD,
  CUSTOM_CREDITS,
  DEFAULT_PACK_ID,
  PURCHASED_LIFE_MONTHS,
  costFor,
  creditRateUsd,
  customPriceUsd,
  formatUsd,
  packById,
  type CreditPack,
} from "@/lib/pricing";
import { FULL_REVIEW_TYPES } from "@/lib/setup-steps";
import { useApprovalPending, useSessionStore, useUsersStore, useWalletStore } from "@/store";
import type { CreditPackId } from "@/types";
import "./wallet.css";
import "./topup-chips.css";

const FULL_REVIEW_COST = costFor(FULL_REVIEW_TYPES);

const fullReviews = (credits: number) => Math.floor(credits / FULL_REVIEW_COST);
const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

type Choice = CreditPackId | "custom";
/** Custom amount shown before the buyer types one: sits in the middle tier. */
const CUSTOM_DEFAULT = 15;

/** Selected on open: the default pack, the smallest pack that covers what a blocked run needs, or Custom
 *  pre-filled with the exact shortfall when no pack covers it. */
function initialChoice(needed: number | null): { choice: Choice; custom: number } {
  const def = packById(DEFAULT_PACK_ID);
  if (needed == null) return { choice: def.id, custom: CUSTOM_DEFAULT };
  const covering = CREDIT_PACKS.find((p) => p.credits >= needed);
  if (!covering) return { choice: "custom", custom: Math.min(needed, CUSTOM_CREDITS.max) };
  return { choice: covering.credits > def.credits ? covering.id : def.id, custom: needed };
}

/** Mounted once in the shell. Admins get the purchase dialog; anyone else is sent to their admin. */
export function TopUpModal() {
  const open = useWalletStore((s) => s.topUpOpen);
  const role = useSessionStore((s) => s.role);
  if (!open) return null;
  return role === "org_admin" ? <TopUpDialog /> : <AskAdminDialog />;
}

function AskAdminDialog() {
  const toast = useToast();
  const admin = useUsersStore((s) => s.users.find((u) => u.role === "org_admin"));
  const close = () => useWalletStore.getState().closeTopUp();
  const name = admin?.name ?? "your organization admin";
  return (
    <Dialog
      open
      onOpenChange={(o) => !o && close()}
      size="sm"
      title="Ask your admin"
      description="Only your organization admin can buy credits."
      footer={
        <>
          <Button variant="ghost" onClick={close}>
            Close
          </Button>
          <Button
            iconLeft="mail"
            onClick={() => {
              toast({ title: `We emailed ${name}`, description: "They can add credits from Billing.", tone: "success" });
              close();
            }}
          >
            Email {admin ? admin.name.split(" ")[0] : "admin"}
          </Button>
        </>
      }
    >
      <p className="tu-ask">
        Credits are bought from Billing by {name}. We will let them know you are waiting, and your work stays saved
        as a draft.
      </p>
    </Dialog>
  );
}

function TopUpDialog() {
  const toast = useToast();
  const org = useCurrentOrg();
  const reason = useWalletStore((s) => s.topUpReason);
  const needed = useWalletStore((s) => s.topUpNeeded);
  const settings = useWalletStore((s) => s.settings);
  const balance = useWalletStore((s) => s.ledger.reduce((sum, e) => sum + e.credits, 0));
  const me = useSessionStore((s) => s.userId);
  const meEmail = useUsersStore((s) => s.users.find((u) => u.id === me)?.email);

  const pending = useApprovalPending();
  const [start] = useState(() => initialChoice(needed));
  const [choice, setChoice] = useState<Choice>(start.choice);
  // Raw text so the field can be cleared while typing; parsed below.
  const [customText, setCustomText] = useState(String(start.custom));
  const hasCard = settings?.paymentMethod === "card" && !!settings.cardLast4;
  const [editingCard, setEditingCard] = useState(false);
  const showForm = !hasCard || editingCard;
  const [card, setCard] = useState({ name: "", number: "", expiry: "", cvc: "" });
  const [paying, setPaying] = useState(false);

  const customN = Number.parseInt(customText, 10);
  const customValid = Number.isFinite(customN) && customN >= CUSTOM_CREDITS.min && customN <= CUSTOM_CREDITS.max;
  const overMax = Number.isFinite(customN) && customN > CUSTOM_CREDITS.max;
  const isCustom = choice === "custom";
  const pack: CreditPack | null = isCustom ? null : packById(choice);
  const buyCredits = pack ? pack.credits : customValid ? customN : 0;
  const buyPrice = pack ? pack.priceUsd : customValid ? customPriceUsd(customN) : 0;
  const stepCustom = (d: number) => {
    const base = Number.isFinite(customN) ? customN : CUSTOM_DEFAULT;
    setCustomText(String(Math.min(CUSTOM_CREDITS.max, Math.max(CUSTOM_CREDITS.min, base + d))));
    setChoice("custom");
  };
  const reloadPack = packById(settings?.reloadPackId ?? DEFAULT_PACK_ID);
  const reloadBelow = settings?.reloadBelow ?? 2;
  const email = settings?.billingEmail ?? meEmail ?? "your billing contact";

  const digits = card.number.replace(/\D/g, "");
  const cardErrors = useMemo(
    () => ({
      name: card.name.trim().length < 2,
      number: digits.length < 12 || digits.length > 19,
      expiry: !/^(0[1-9]|1[0-2])\s*\/\s*\d{2}$/.test(card.expiry.trim()),
      cvc: !/^\d{3,4}$/.test(card.cvc.trim()),
    }),
    [card, digits],
  );
  const cardValid = !Object.values(cardErrors).some(Boolean);
  const canPay = !pending && !paying && buyCredits > 0 && (!showForm || cardValid);

  const close = () => useWalletStore.getState().closeTopUp();

  const pay = async () => {
    if (!canPay) return;
    setPaying(true);
    const w = useWalletStore.getState();
    if (showForm) await w.setPaymentMethod({ paymentMethod: "card", cardLast4: digits.slice(-4) });
    await new Promise((r) => setTimeout(r, 600));
    const entry = await w.purchase(pack ? pack.id : { credits: buyCredits });
    const after = useWalletStore.getState().balance();
    w.closeTopUp();
    toast({
      title: `${plural(buyCredits, "credit", "credits")} added`,
      description: `Balance ${after}`,
      tone: "success",
      action: entry.receiptId
        ? { label: "Receipt", onClick: () => useWalletStore.getState().openReceipt(entry.receiptId!) }
        : undefined,
    });
  };

  const talkToUs = () =>
    toast({ title: "We’ll be in touch", description: "A Realwired specialist will reach out about invoicing.", tone: "success" });

  const setField = (k: keyof typeof card) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setCard((c) => ({ ...c, [k]: e.target.value }));

  return (
    <Dialog
      open
      onOpenChange={(o) => !o && !paying && close()}
      size="md"
      className="tu-dialog"
      title="Add credits"
      description={`${org.name} · 1 credit ≈ ${formatUsd(CREDIT_USD)} · 1 credit = 1 review type on 1 report`}
      footerStart={
        <button type="button" className="tu-link" onClick={talkToUs}>
          Need invoicing? Talk to us
        </button>
      }
      footer={
        pending ? (
          <>
            <Button variant="ghost" onClick={close}>
              Close
            </Button>
            <Button disabled iconLeft="lock">
              {buyPrice ? `Pay ${formatUsd(buyPrice)}` : "Pay"}
            </Button>
          </>
        ) : (
          <Button onClick={pay} disabled={!canPay} iconLeft="lock">
            {paying ? "Processing" : buyPrice ? `Pay ${formatUsd(buyPrice)}` : "Pay"}
          </Button>
        )
      }
    >
      <div className="tu-body">
        {pending && (
          <p className="tu-context tu-context--pending" role="status">
            <Icon name="clock" size={16} />
            <span>
              <b>You can buy credits once {org.name} is approved.</b>{" "}
              Realwired is checking your sign-up and will
              email you when it&rsquo;s done. The prices below are what you&rsquo;ll pay.
            </span>
          </p>
        )}
        {!pending && reason === "low_balance" && needed != null && (
          <p className="tu-context" role="status">
            <Icon name="warn" size={16} />
            <span>
              This review needs <b>{plural(needed, "credit", "credits")}</b>. You have <b>{balance}</b>.
            </span>
          </p>
        )}

        <fieldset className="tu-packs">
          <legend className="tu-label">Choose a pack</legend>
          <div className="tu-pack-row">
            {CREDIT_PACKS.map((p) => {
              const n = fullReviews(p.credits);
              return (
                <label key={p.id} className="tu-pack" data-on={p.id === choice || undefined}>
                  <input
                    type="radio"
                    name="tu-pack"
                    value={p.id}
                    checked={p.id === choice}
                    onChange={() => setChoice(p.id)}
                  />
                  <span className="tu-pack-n">{p.credits}</span>
                  <span className="tu-pack-u">credits</span>
                  <CreditChip tone="money" className="tu-pack-p">{formatUsd(p.priceUsd)}</CreditChip>
                  <span className="tu-pack-f">{plural(n, "full review", "full reviews")}</span>
                  {p.note && (
                    <CreditChip tone="free" size="sm" className="tu-pack-note">
                      {p.note}
                    </CreditChip>
                  )}
                </label>
              );
            })}
            <div className="tu-pack tu-pack--custom" data-on={isCustom || undefined} onClick={() => setChoice("custom")}>
              <input
                type="radio"
                name="tu-pack"
                value="custom"
                aria-label="Custom amount"
                checked={isCustom}
                onChange={() => setChoice("custom")}
              />
              <span className="tu-pack-u tu-custom-l">Custom</span>
              <span className="tu-step">
                <button
                  type="button"
                  aria-label="One credit fewer"
                  onClick={() => stepCustom(-1)}
                  disabled={customValid && customN <= CUSTOM_CREDITS.min}
                >
                  <Icon name="minus" size={14} />
                </button>
                <input
                  className="tu-step-n"
                  inputMode="numeric"
                  aria-label="Credits"
                  value={customText}
                  onFocus={() => setChoice("custom")}
                  onChange={(e) => {
                    setCustomText(e.target.value.replace(/\D/g, "").slice(0, 4));
                    setChoice("custom");
                  }}
                />
                <button
                  type="button"
                  aria-label="One credit more"
                  onClick={() => stepCustom(1)}
                  disabled={customValid && customN >= CUSTOM_CREDITS.max}
                >
                  <Icon name="add" size={14} />
                </button>
              </span>
              {customValid ? (
                <>
                  <CreditChip tone="money" className="tu-pack-p">
                    {formatUsd(customPriceUsd(customN))}
                  </CreditChip>
                  <span className="tu-pack-f">{formatUsd(creditRateUsd(customN))} a credit</span>
                </>
              ) : (
                <span className="tu-pack-f tu-custom-hint">
                  {CUSTOM_CREDITS.min} to {CUSTOM_CREDITS.max} credits
                </span>
              )}
            </div>
          </div>
          {isCustom && overMax && (
            <p className="tu-over">
              Buying more than {CUSTOM_CREDITS.max} credits?{" "}
              <button type="button" className="tu-link" onClick={talkToUs}>
                Talk to us
              </button>{" "}
              about a volume price and invoicing.
            </p>
          )}
          {isCustom && customValid && (
            <p className="tu-over">
              {plural(customN, "credit", "credits")} is enough for{" "}
              {plural(fullReviews(customN), "full review", "full reviews")}.
            </p>
          )}
        </fieldset>

        {!pending && (
        <div className="tu-pay">
          <div className="tu-label" id="tu-pay-l">
            {showForm ? "Add a card" : "Payment"}
          </div>
          {showForm ? (
            <div className="tu-card" aria-labelledby="tu-pay-l">
              <div className="tu-f">
                <label htmlFor="tu-name">Name on card</label>
                <Input
                  id="tu-name"
                  autoComplete="cc-name"
                  placeholder="Dana Reyes"
                  value={card.name}
                  onChange={setField("name")}
                />
              </div>
              <div className="tu-f">
                <label htmlFor="tu-num">Card number</label>
                <Input
                  id="tu-num"
                  inputMode="numeric"
                  autoComplete="cc-number"
                  placeholder="1234 5678 9012 3456"
                  value={card.number}
                  onChange={setField("number")}
                />
              </div>
              <div className="tu-card-2">
                <div className="tu-f">
                  <label htmlFor="tu-exp">Expiry</label>
                  <Input
                    id="tu-exp"
                    inputMode="numeric"
                    autoComplete="cc-exp"
                    placeholder="MM / YY"
                    value={card.expiry}
                    onChange={setField("expiry")}
                  />
                </div>
                <div className="tu-f">
                  <label htmlFor="tu-cvc">CVC</label>
                  <Input
                    id="tu-cvc"
                    inputMode="numeric"
                    autoComplete="cc-csc"
                    placeholder="3 digits"
                    value={card.cvc}
                    onChange={setField("cvc")}
                  />
                </div>
              </div>
              <p className="tu-hosted">
                <Icon name="lock" size={14} />
                Card details are collected by our payment provider; Parachute never stores them.
              </p>
              {hasCard && (
                <button type="button" className="tu-link" onClick={() => setEditingCard(false)}>
                  Keep using •••• {settings?.cardLast4}
                </button>
              )}
            </div>
          ) : (
            <div className="tu-method" aria-labelledby="tu-pay-l">
              <span className="tu-visa" aria-hidden="true">
                VISA
              </span>
              <span className="tu-method-n">•••• {settings?.cardLast4}</span>
              <span className="tu-method-s">Visa</span>
              <button type="button" className="tu-link tu-method-c" onClick={() => setEditingCard(true)}>
                Change
              </button>
            </div>
          )}
        </div>

        )}

        {!pending && (
        <div className="tu-reload">
          <label htmlFor="tu-reload-sw">
            Reload {reloadPack.credits} credits automatically when I drop below {reloadBelow}
          </label>
          <Switch
            id="tu-reload-sw"
            checked={!!settings?.autoReload}
            onCheckedChange={(v) => void useWalletStore.getState().setAutoReload({ autoReload: v })}
          />
        </div>
        )}

        <p className="tu-fine">
          Purchased credits last {PURCHASED_LIFE_MONTHS} months. Receipts go to {email}.
        </p>
      </div>
    </Dialog>
  );
}
