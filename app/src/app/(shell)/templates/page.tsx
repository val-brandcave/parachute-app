"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/templates/PageHeader";
import { TemplateHubCard } from "@/components/templates/TemplateHubCard";
import { ChecklistUploadWizard } from "@/components/templates/ChecklistUploadWizard";
import { useTemplateHub } from "./hooks/useTemplateHub";

export default function TemplatesPage() {
  const router = useRouter();
  const { cards } = useTemplateHub();
  const [wizardOpen, setWizardOpen] = useState(false);

  // The CTA may differ from opening the card: "New checklist" launches the
  // upload wizard; "New template" opens the response editor in create mode;
  // "Edit layout" deep-links into the Builder org-mode.
  const onCta = (key: string, to: string) => {
    if (key === "checklist") setWizardOpen(true);
    else if (key === "response") router.push("/templates/responses?new=1");
    else router.push(to);
  };

  return (
    <>
      <PageHeader
        eyebrow="Library"
        title="Templates"
        sub="Reusable, AI-configurable building blocks that drive reviews and their output."
      />
      <div className="pagebody">
        <div className="tpl-grid">
          {cards.map((c, i) => (
            <TemplateHubCard
              key={c.key}
              index={i}
              icon={c.icon}
              title={c.title}
              description={c.description}
              meta={c.meta}
              ctaLabel={c.cta.label}
              ctaIcon={c.cta.icon}
              onOpen={() => router.push(c.to)}
              onCta={() => onCta(c.key, c.to)}
            />
          ))}
        </div>
      </div>

      <ChecklistUploadWizard open={wizardOpen} onClose={() => setWizardOpen(false)} />
    </>
  );
}
