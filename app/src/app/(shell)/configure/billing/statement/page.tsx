"use client";

import { Suspense, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/atoms";
import { PageHeader } from "@/components/templates/PageHeader";
import {
  DEMO_TODAY,
  StatementPaper,
  downloadText,
  invoicedStatement,
  monthKey,
  monthTitle,
  statementCsv,
  useBilling,
  walletStatement,
} from "@/components/organisms/billing";
import { useCurrentOrg } from "@/lib/current-user";
import "../billing.css";

function StatementPage() {
  const router = useRouter();
  const params = useSearchParams();
  const b = useBilling();
  const { initials } = useCurrentOrg();

  // Months that have activity, newest first. Falls back to the demo month.
  const months = useMemo(() => {
    const keys = new Set<string>();
    if (!b.invoiced) b.ledger.filter((e) => e.kind === "debit" || e.kind === "rescan").forEach((e) => keys.add(monthKey(e.createdAt)));
    if (keys.size === 0) keys.add(monthKey(DEMO_TODAY));
    return [...keys].sort().reverse();
  }, [b.ledger, b.invoiced]);
  const asked = params.get("month");
  const key = asked && months.includes(asked) ? asked : months[0];

  const s = useMemo(
    () => (b.invoiced ? invoicedStatement(b.reviews, b.userName, key) : walletStatement(b.ledger, b.reviews, b.userName, key)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [b.invoiced, b.reviews, b.ledger, b.users, key],
  );

  if (!b.isAdmin) {
    return (
      <>
        <PageHeader title="Monthly statement" />
        <div className="pagebody bl-page">
          <section className="card bl-card bl-locked">
            <h2 className="bl-h">Only an org admin can see statements</h2>
            <p className="bl-sub">Ask {b.adminName} for a copy.</p>
            <Button onClick={b.askAdmin}>Ask your admin</Button>
          </section>
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title={`Monthly statement · ${monthTitle(key)}`}
        actions={
          <>
            {months.length > 1 && (
              <div className="field bl-sel bl-sel--month">
                <select aria-label="Statement month" value={key} onChange={(e) => router.replace(`/configure/billing/statement?month=${e.target.value}`)}>
                  {months.map((m) => (
                    <option key={m} value={m}>
                      {monthTitle(m)}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <Button variant="outline" iconLeft="sheet" onClick={() => downloadText(`parachute-statement-${key}.csv`, statementCsv(s))}>
              CSV
            </Button>
            <Button iconLeft="download" onClick={() => window.print()}>
              Download PDF
            </Button>
          </>
        }
      />
      <div className="pagebody bl-page bl-paperwrap">
        <StatementPaper
          orgName={b.org?.name ?? "Your organization"}
          orgInitials={initials}
          place={b.org?.id === "org-hcb" ? "Norfolk, VA" : undefined}
          monthKey={key}
          s={s}
          invoiced={b.invoiced}
        />
      </div>
    </>
  );
}

export default function Page() {
  return (
    <Suspense fallback={null}>
      <StatementPage />
    </Suspense>
  );
}
