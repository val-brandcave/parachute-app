"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import {
  ReviewContextBar,
  type ReviewTab,
  type TechView,
  type AdminView,
} from "@/components/shell/ReviewContextBar";
import { TechnicalWorkspace } from "@/components/review/TechnicalWorkspace";
import { Workbook } from "@/components/review/Workbook";
import { Builder } from "@/components/review/Builder";
import { AdministrativeWorkspace } from "@/components/review/AdministrativeWorkspace";
import { AttestationPreview } from "@/components/review/AttestationPreview";
import { ReviewChromeProvider } from "@/components/review/ReviewChrome";

export default function ReviewDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [tab, setTab] = useState<ReviewTab>("technical");
  const [view, setView] = useState<TechView>("findings");
  const [adminView, setAdminView] = useState<AdminView>("attestations");

  return (
    <ReviewChromeProvider>
      <div className="rw">
        <ReviewContextBar
          reviewId={id}
          tab={tab}
          setTab={setTab}
          view={view}
          setView={setView}
          adminView={adminView}
          setAdminView={setAdminView}
        />

        <div className="rw-body">
          {tab === "administrative" ? (
            adminView === "preview" ? (
              <AttestationPreview reviewId={id} />
            ) : (
              <AdministrativeWorkspace
                reviewId={id}
                onOpenPreview={() => setAdminView("preview")}
              />
            )
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
