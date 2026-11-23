"use client";

import type { ReactNode } from "react";
import type { UserRole } from "@/types";
import {
  NeedsYou,
  ValueBand,
  IssuesByCategory,
  FirmScorecard,
  ReviewerAgreement,
  PortfolioRisk,
  HOURS_SAVED_PER_REVIEW,
} from "@/components/organisms/dashboard";
import type { DashboardInsights } from "@/components/organisms/dashboard/insights.types";

type SectionKey = "needs" | "value" | "insights" | "trend" | "risk";

/**
 * Role lens (dashboard proposal, 21 Nov 2026): one page for every role, the same
 * sections, a different order.
 * - reviewer: their work, then the value, then insights.
 * - approver (chief appraiser / review manager): insights and risk straight after the work.
 * - org_admin: value (with spend; Billing owns the detail) leads, then the work and volume.
 */
const ORDER: Record<UserRole, SectionKey[]> = {
  reviewer: ["needs", "value", "insights", "trend", "risk"],
  approver: ["needs", "insights", "risk", "value", "trend"],
  org_admin: ["value", "needs", "trend", "insights", "risk"],
};

export function DashboardSections({
  role,
  insights,
  periodText,
  spend,
  trend,
}: {
  role: UserRole;
  insights: DashboardInsights;
  periodText: string;
  spend: { usd: number; credits: number } | null;
  trend: ReactNode;
}) {
  const blocks: Record<SectionKey, ReactNode> = {
    needs: <NeedsYou data={insights.needsYou} />,
    value: (
      <ValueBand
        data={insights.value}
        periodLabel={periodText}
        hoursPerType={HOURS_SAVED_PER_REVIEW}
        spend={spend}
      />
    ),
    insights: (
      <div className="dv2i-row">
        <IssuesByCategory rows={insights.categories} periodLabel={periodText} source={insights.sources.categories} />
        <FirmScorecard rows={insights.firms} periodLabel={periodText} source={insights.sources.firms} />
        <ReviewerAgreement data={insights.agreement} periodLabel={periodText} source={insights.sources.agreement} />
      </div>
    ),
    trend,
    risk: <PortfolioRisk rows={insights.risk} periodLabel={periodText} source={insights.sources.risk} />,
  };

  return (
    <div className="db-sections">
      {ORDER[role].map((k) => (
        <div key={k} className="db-section" data-section={k}>
          {blocks[k]}
        </div>
      ))}
    </div>
  );
}
