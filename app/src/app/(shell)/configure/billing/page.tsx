"use client";

import { Suspense, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PageBody, type TabItem } from "@realwired/ui";
import { Chip, Icon } from "@/components/atoms";
import { useBuildNotes } from "@/store";
import {
  BillingBand,
  CreditsExplainer,
  InvoicesTab,
  OverviewTab,
  PlansTab,
  ReviewerBilling,
  SettingsTab,
  UsageTab,
  useBilling,
} from "@/components/organisms/billing";
import "./billing.css";
import "@/components/organisms/billing/usage/usage.css";

type Tab = "overview" | "usage" | "invoices" | "settings" | "plans" | "credits";

/** Old links keep working: Activity folded into Usage, Payment became Settings. */
const ALIASES: Record<string, Tab> = { activity: "usage", payment: "settings" };

function asTab(raw: string | null, allowed: readonly Tab[], fallback: Tab): Tab {
  const t = (raw && ALIASES[raw]) || raw;
  return (allowed as readonly string[]).includes(t ?? "") ? (t as Tab) : fallback;
}

const CREDITS_TAB: TabItem = { value: "credits", label: "How credits work" };

function BillingPage() {
  const router = useRouter();
  const params = useSearchParams();
  const b = useBilling();
  const plansOn = !!b.org?.flags?.plansTab;
  // The locked Plans preview is a build note: shown only when the flag is on or build notes are.
  const buildNotes = useBuildNotes();
  const showPlans = plansOn || buildNotes;

  const go = useCallback(
    (tab: string) => router.replace(`/configure/billing?tab=${tab}`, { scroll: false }),
    [router],
  );
  const raw = params.get("tab");

  // Which tabs this role sees (spec §5.7). The explainer is open to every role.
  let tabs: TabItem[];
  let allowed: Tab[];
  let fallback: Tab;
  if (b.invoiced) {
    // Invoiced orgs have no wallet: Usage, Invoices, Settings. Reviewers see usage only.
    if (b.isAdmin) {
      tabs = [
        { value: "usage", label: "Usage" },
        { value: "invoices", label: "Invoices" },
        { value: "settings", label: "Settings" },
        CREDITS_TAB,
      ];
      allowed = ["usage", "invoices", "settings", "credits"];
    } else {
      tabs = [{ value: "usage", label: "Usage" }, CREDITS_TAB];
      allowed = ["usage", "credits"];
    }
    fallback = "usage";
  } else if (!b.isAdmin) {
    // Reviewers and approvers: the org balance, read-only, plus their own usage. Credits only.
    tabs = [
      { value: "overview", label: "Overview" },
      { value: "usage", label: "My usage" },
      CREDITS_TAB,
    ];
    allowed = ["overview", "usage", "credits"];
    fallback = "overview";
  } else {
    tabs = [
      { value: "overview", label: "Overview" },
      { value: "usage", label: "Usage" },
      { value: "invoices", label: "Invoices" },
      { value: "settings", label: "Settings" },
      ...(showPlans
        ? [
            {
              value: "plans",
              label: "Plans",
              leading: plansOn ? undefined : <Icon name="lock" size={14} />,
              trailing: plansOn ? undefined : <Chip>Hidden · flag</Chip>,
            },
          ]
        : []),
      CREDITS_TAB,
    ];
    allowed = ["overview", "usage", "invoices", "settings", ...(showPlans ? (["plans"] as Tab[]) : []), "credits"];
    fallback = "overview";
  }
  const tab = asTab(raw, allowed, fallback);

  return (
    <>
      <BillingBand b={b} tab={tab} tabs={tabs} onTab={go} />
      <PageBody className="bl-page">
        {tab === "overview" &&
          (b.isAdmin ? (
            <OverviewTab b={b} onViewAll={() => go("usage")} onUsage={() => go("usage")} onSettings={() => go("settings")} />
          ) : (
            <ReviewerBilling b={b} onViewAll={() => go("usage")} />
          ))}
        {tab === "usage" && <UsageTab b={b} invoiced={!!b.invoiced} />}
        {tab === "invoices" && <InvoicesTab b={b} invoiced={!!b.invoiced} />}
        {tab === "settings" && <SettingsTab b={b} invoiced={!!b.invoiced} />}
        {tab === "plans" && <PlansTab enabled={plansOn} />}
        {tab === "credits" && <CreditsExplainer b={b} />}
      </PageBody>
    </>
  );
}

export default function Page() {
  return (
    <Suspense fallback={null}>
      <BillingPage />
    </Suspense>
  );
}
