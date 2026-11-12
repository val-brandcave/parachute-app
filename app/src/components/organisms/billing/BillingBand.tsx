"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { PageHeader, Tabs, type TabItem } from "@realwired/ui";
import { Button } from "@/components/atoms";
import { useTourTarget } from "@/components/organisms/useTourTarget";
import { LockedAction } from "@/components/molecules";
import { HOW_CREDITS_HREF } from "@/components/organisms/checkout";
import "./billing-states.css";
import { TalkToUs } from "./TalkToUs";
import type { Billing } from "./useBilling";

/**
 * The Billing page band (PC-33): DS `PageHeader toolbar` with DS `Tabs`, the same band as Reviews.
 * Wallet admins get "Prefer a monthly invoice? Talk to us", "How credits work" and the band's primary,
 * Add credits (a locked action while the organization waits for approval). Invoiced admins keep
 * "Download statement". Reviewers get the tabs only.
 */
export function BillingBand({
  b,
  tab,
  tabs,
  onTab,
}: {
  b: Billing;
  tab: string;
  tabs: TabItem[];
  onTab: (tab: string) => void;
}) {
  const router = useRouter();
  const walletAdmin = b.isAdmin && !b.invoiced;
  const held = b.wallet.held;
  // Tour target (spec §5.13): the Usage tab trigger lives inside the DS Tabs.
  useTourTarget("billing-usage", '[role="tab"]', (els) => els.find((e) => /usage/i.test(e.textContent ?? "")));

  return (
    <PageHeader
      toolbar={
        <>
          <Tabs label="Billing sections" value={tab} onValueChange={onTab} tabs={tabs} />
          <div className="bl-band-spacer" />
          {walletAdmin && (
            <>
              <span className="bl-band-note">
                Prefer a monthly invoice? <TalkToUs />
              </span>
              <Link href={HOW_CREDITS_HREF} className="bl-textlink bl-band-link">
                How credits work
              </Link>
              {held ? (
                <LockedAction reason={{ kind: "approval" }} glyph="hourglass">
                  <Button variant="outline" iconLeft="add" data-tour="billing-add">
                    Add credits
                  </Button>
                </LockedAction>
              ) : (
                <Button iconLeft="add" onClick={b.openTopUp} data-tour="billing-add">
                  Add credits
                </Button>
              )}
            </>
          )}
          {b.isAdmin && b.invoiced && (
            <Button variant="outline" iconLeft="download" onClick={() => router.push("/configure/billing/statement")}>
              Download statement
            </Button>
          )}
        </>
      }
    />
  );
}
