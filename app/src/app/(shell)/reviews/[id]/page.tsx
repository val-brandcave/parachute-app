"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import {
  ReviewContextBar,
  type ReviewTab,
  type TechView,
} from "@/components/shell/ReviewContextBar";
import { TechnicalWorkspace } from "@/components/review/TechnicalWorkspace";
import { Card, Icon } from "@/components/atoms";

function DetailStub({ title, note }: { title: string; note: string }) {
  return (
    <div className="pagebody">
      <Card
        style={{
          padding: "48px 40px",
          textAlign: "center",
          color: "var(--md-on-surface-v)",
        }}
      >
        <Icon
          name="construction"
          size={40}
          style={{ color: "var(--md-accent-d)", margin: "0 auto" }}
        />
        <div
          style={{
            fontFamily: "var(--font-display)",
            fontSize: 18,
            color: "var(--md-on-surface)",
            marginTop: 12,
          }}
        >
          {title}
        </div>
        <p style={{ marginTop: 6, maxWidth: 520, marginInline: "auto" }}>{note}</p>
      </Card>
    </div>
  );
}

export default function ReviewDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [tab, setTab] = useState<ReviewTab>("technical");
  const [view, setView] = useState<TechView>("findings");

  return (
    <>
      <ReviewContextBar
        reviewId={id}
        tab={tab}
        setTab={setTab}
        view={view}
        setView={setView}
      />

      {tab === "administrative" ? (
        <DetailStub
          title="Administrative Review"
          note="AI pre-fills the bank's compliance checklist (Yes / No / N-A with page citations); the reviewer attests and signs. Coming in a later sprint."
        />
      ) : view === "builder" ? (
        <DetailStub
          title="Workbook Builder"
          note="Assemble and reorder sections, customize themes/fonts/risk labels, and set the org default layout. Coming in a later sprint."
        />
      ) : view === "workbook" ? (
        <DetailStub
          title="Reviewer Workbook"
          note="The compiled, branded output document — DRAFT → sign → complete or return to appraiser. Coming in a later sprint."
        />
      ) : (
        <TechnicalWorkspace reviewId={id} onOpenWorkbook={() => setView("workbook")} />
      )}
    </>
  );
}
