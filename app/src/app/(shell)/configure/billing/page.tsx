"use client";

import { Suspense, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button, Chip, Icon } from "@/components/atoms";
import { Tabs } from "@/components/molecules";
import { useBuildNotes } from "@/store";
import { PageHeader } from "@/components/templates/PageHeader";
import {
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

type Tab = "overview" | "usage" | "invoices" | "settings" | "plans";

/** Old links keep working: Activity folded into Usage, Payment became Settings. */
const ALIASES: Record<string, Tab> = { activity: "usage", payment: "settings" };

function asTab(raw: string | null, allowed: readonly Tab[], fallback: Tab): Tab {
  const t = (raw && ALIASES[raw]) || raw;
  return (allowed as readonly string[]).includes(t ?? "") ? (t as Tab) : fallback;
}

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

  // Invoiced orgs have no wallet: Usage, Invoices, Settings. Reviewers see their own usage only.
  if (b.invoiced) {
    if (!b.isAdmin) {
      return (
        <div className="pagebody bl-page">
          <UsageTab b={b} invoiced />
        </div>
      );
    }
    const tab = asTab(raw, ["usage", "invoices", "settings"], "usage");
    return (
      <>
        <PageHeader
          badges={
            <Tabs
              value={tab}
              onChange={go}
              tabs={[
                { value: "usage", label: "Usage" },
                { value: "invoices", label: "Invoices" },
                { value: "settings", label: "Settings" },
              ]}
            />
          }
          actions={
            <Button variant="outline" iconLeft="download" onClick={() => router.push("/configure/billing/statement")}>
              Download statement
            </Button>
          }
        />
        <div className="pagebody bl-page">
          {tab === "usage" && <UsageTab b={b} invoiced />}
          {tab === "invoices" && <InvoicesTab b={b} invoiced />}
          {tab === "settings" && <SettingsTab b={b} invoiced />}
        </div>
      </>
    );
  }

  // Reviewers and approvers: the org balance, read-only, plus their own usage. Credits only.
  if (!b.isAdmin) {
    const tab = asTab(raw, ["overview", "usage"], "overview");
    return (
      <>
        <PageHeader
          badges={
            <Tabs
              value={tab}
              onChange={go}
              tabs={[
                { value: "overview", label: "Overview" },
                { value: "usage", label: "My usage" },
              ]}
            />
          }
        />
        <div className="pagebody bl-page">
          {tab === "overview" && <ReviewerBilling b={b} onViewAll={() => go("usage")} />}
          {tab === "usage" && <UsageTab b={b} invoiced={false} />}
        </div>
      </>
    );
  }

  const tab = asTab(raw, showPlans ? ["overview", "usage", "invoices", "settings", "plans"] : ["overview", "usage", "invoices", "settings"], "overview");
  return (
    <>
      <PageHeader
        badges={
          <Tabs
            value={tab}
            onChange={go}
            tabs={[
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
            ]}
          />
        }
        actions={
          <Button iconLeft="add" onClick={b.openTopUp}>
            Add credits
          </Button>
        }
      />
      <div className="pagebody bl-page">
        {tab === "overview" && <OverviewTab b={b} onViewAll={() => go("usage")} onUsage={() => go("usage")} onSettings={() => go("settings")} />}
        {tab === "usage" && <UsageTab b={b} invoiced={false} />}
        {tab === "invoices" && <InvoicesTab b={b} invoiced={false} />}
        {tab === "settings" && <SettingsTab b={b} invoiced={false} />}
        {tab === "plans" && <PlansTab enabled={plansOn} />}
      </div>
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
