"use client";

import { Suspense, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button, Chip, Icon } from "@/components/atoms";
import { Tabs } from "@/components/molecules";
import { PageHeader } from "@/components/templates/PageHeader";
import {
  ActivityTable,
  InvoicedBilling,
  OverviewTab,
  PaymentTab,
  PlansTab,
  ReviewerBilling,
  useBilling,
} from "@/components/organisms/billing";
import "./billing.css";

type WalletTab = "overview" | "activity" | "payment" | "plans";
type InvoiceTab = "usage" | "invoices";

function asTab<T extends string>(raw: string | null, allowed: readonly T[], fallback: T): T {
  return (allowed as readonly string[]).includes(raw ?? "") ? (raw as T) : fallback;
}

function BillingPage() {
  const router = useRouter();
  const params = useSearchParams();
  const b = useBilling();
  const plansOn = !!b.org?.flags?.plansTab;

  const go = useCallback(
    (tab: string) => router.replace(`/configure/billing?tab=${tab}`, { scroll: false }),
    [router],
  );
  const statement = () => router.push("/configure/billing/statement");
  const raw = params.get("tab");

  // Invoiced orgs: no wallet. Usage and invoices.
  if (b.invoiced) {
    const tab = asTab<InvoiceTab>(raw, ["usage", "invoices"], "usage");
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
              ]}
            />
          }
          actions={
            b.isAdmin ? (
              <Button variant="outline" iconLeft="download" onClick={statement}>
                Download statement
              </Button>
            ) : undefined
          }
        />
        <div className="pagebody bl-page">
          <InvoicedBilling b={b} tab={tab} showAmounts={b.isAdmin} />
        </div>
      </>
    );
  }

  // Reviewers and approvers: read-only balance, credits only.
  if (!b.isAdmin) {
    return (
      <div className="pagebody bl-page">
        <ReviewerBilling b={b} />
      </div>
    );
  }

  const tab = asTab<WalletTab>(raw, ["overview", "activity", "payment", "plans"], "overview");
  return (
    <>
      <PageHeader
        badges={
          <Tabs
            value={tab}
            onChange={go}
            tabs={[
              { value: "overview", label: "Overview" },
              { value: "activity", label: "Activity" },
              { value: "payment", label: "Payment" },
              {
                value: "plans",
                label: "Plans",
                leading: plansOn ? undefined : <Icon name="lock" size={14} />,
                trailing: plansOn ? undefined : <Chip>Hidden · flag</Chip>,
              },
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
        {tab === "overview" && <OverviewTab b={b} onViewAll={() => go("activity")} onStatement={statement} />}
        {tab === "activity" && (
          <div className="bl-stack">
            <div className="bl-row bl-sechead">
              <h2 className="bl-section">Activity</h2>
              <div className="bl-actions">
                <Button variant="outline" iconLeft="download" onClick={b.exportCsv}>
                  Export CSV
                </Button>
                <Button variant="outline" iconLeft="document" onClick={statement}>
                  Monthly statement
                </Button>
              </div>
            </div>
            <ActivityTable rows={b.rows} onReceipt={b.openReceipt} footer={`${b.rows.length} events · every credit movement for ${b.org?.name ?? "your organization"}`} />
          </div>
        )}
        {tab === "payment" && <PaymentTab b={b} />}
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
