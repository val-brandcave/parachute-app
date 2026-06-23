"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import {
  ReviewContextBar,
  type ReviewTab,
  type TechView,
} from "@/components/shell/ReviewContextBar";
import { TechnicalWorkspace } from "@/components/review/TechnicalWorkspace";
import { Workbook } from "@/components/review/Workbook";
import { Builder } from "@/components/review/Builder";
import { ReviewChromeProvider } from "@/components/review/ReviewChrome";
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
    <ReviewChromeProvider>
      <div className="rw">
        <ReviewContextBar
          reviewId={id}
          tab={tab}
          setTab={setTab}
          view={view}
          setView={setView}
        />

        <div className="rw-body">
          {tab === "administrative" ? (
            <DetailStub
              title="Administrative Review"
              note="AI pre-fills the bank's compliance checklist (Yes / No / N-A with page citations); the reviewer attests and signs. Coming next."
            />
          ) : view === "workbook" ? (
            <Workbook reviewId={id} />
          ) : view === "builder" ? (
            <Builder reviewId={id} />
          ) : (
            <TechnicalWorkspace reviewId={id} onOpenWorkbook={() => setView("workbook")} />
          )}
        </div>
      </div>
    </ReviewChromeProvider>
  );
}
