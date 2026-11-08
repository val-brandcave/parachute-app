"use client";

import { useMemo, useState } from "react";
import { Dialog, Input, Switch, useToast } from "@realwired/ui";
import { Button, Icon } from "@/components/atoms";
import { useCurrentOrg } from "@/lib/current-user";
import {
  CREDIT_PACKS,
  CREDIT_USD,
  DEFAULT_PACK_ID,
  PURCHASED_LIFE_MONTHS,
  costFor,
  formatUsd,
  packById,
  type CreditPack,
} from "@/lib/pricing";
import { FULL_REVIEW_TYPES } from "@/lib/setup-steps";
import { useSessionStore, useUsersStore, useWalletStore } from "@/store";
import type { CreditPackId } from "@/types";
import "./wallet.css";

const FULL_REVIEW_COST = costFor(FULL_REVIEW_TYPES);

const fullReviews = (p: CreditPack) => Math.floor(p.credits / FULL_REVIEW_COST);
const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

/** Pack pre-selected on open: the default, or the smallest pack that covers what a blocked run needs. */
function initialPack(needed: number | null): CreditPackId {
  const def = packById(DEFAULT_PACK_ID);
  if (needed == null) return def.id;
  const covering = CREDIT_PACKS.find((p) => p.credits >= needed);
  return covering && covering.credits > def.credits ? covering.id : def.id;
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

  const [packId, setPackId] = useState<CreditPackId>(() => initialPack(needed));
  const hasCard = settings?.paymentMethod === "card" && !!settings.cardLast4;
  const [editingCard, setEditingCard] = useState(false);
  const showForm = !hasCard || editingCard;
  const [card, setCard] = useState({ name: "", number: "", expiry: "", cvc: "" });
  const [paying, setPaying] = useState(false);

  const pack = packById(packId);
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
  const canPay = !paying && (!showForm || cardValid);

  const close = () => useWalletStore.getState().closeTopUp();

  const pay = async () => {
    if (!canPay) return;
    setPaying(true);
    const w = useWalletStore.getState();
    if (showForm) await w.setPaymentMethod({ paymentMethod: "card", cardLast4: digits.slice(-4) });
    await new Promise((r) => setTimeout(r, 600));
    const entry = await w.purchase(packId);
    const after = useWalletStore.getState().balance();
    w.closeTopUp();
    toast({
      title: `${plural(pack.credits, "credit", "credits")} added`,
      description: `Balance ${after}`,
      tone: "success",
      action: entry.receiptId
        ? { label: "Receipt", onClick: () => useWalletStore.getState().openReceipt(entry.receiptId!) }
        : undefined,
    });
  };

  const setField = (k: keyof typeof card) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setCard((c) => ({ ...c, [k]: e.target.value }));

  return (
    <Dialog
      open
      onOpenChange={(o) => !o && !paying && close()}
      size="sm"
      className="tu-dialog"
      title="Add credits"
      description={`${org.name} · 1 credit ≈ ${formatUsd(CREDIT_USD)} · 1 credit = 1 review type on 1 report`}
      footerStart={
        <button
          type="button"
          className="tu-link"
          onClick={() =>
            toast({ title: "We’ll be in touch", description: "A Realwired specialist will reach out about invoicing.", tone: "success" })
          }
        >
          Need invoicing? Talk to us
        </button>
      }
      footer={
        <Button onClick={pay} disabled={!canPay} iconLeft="lock">
          {paying ? "Processing" : `Pay ~${formatUsd(pack.priceUsd)}`}
        </Button>
      }
    >
      <div className="tu-body">
        {reason === "low_balance" && needed != null && (
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
              const n = fullReviews(p);
              return (
                <label key={p.id} className="tu-pack" data-on={p.id === packId || undefined}>
                  <input
                    type="radio"
                    name="tu-pack"
                    value={p.id}
                    checked={p.id === packId}
                    onChange={() => setPackId(p.id)}
                  />
                  <span className="tu-pack-n">{p.credits}</span>
                  <span className="tu-pack-u">credits</span>
                  <span className="tu-pack-p">~{formatUsd(p.priceUsd)}</span>
                  <span className="tu-pack-f">{plural(n, "full review", "full reviews")}</span>
                  {p.note && <span className="tu-pack-note">{p.note}</span>}
                </label>
              );
            })}
          </div>
        </fieldset>

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

        <p className="tu-fine">
          Purchased credits last {PURCHASED_LIFE_MONTHS} months. Receipts go to {email}.
        </p>
      </div>
    </Dialog>
  );
}
