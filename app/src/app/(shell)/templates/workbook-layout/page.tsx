"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/templates/PageHeader";
import { Button, Card, Chip, Icon } from "@/components/atoms";
import { useTemplatesStore } from "@/store";

export default function WorkbookLayoutPage() {
  const router = useRouter();
  const { layouts, fetchTemplates } = useTemplatesStore();

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const layout = layouts[0];

  return (
    <>
      <PageHeader
        eyebrow="Templates · Org workbook layout"
        title={layout?.name ?? "Org Workbook Layout"}
        sub={
          layout
            ? `v${layout.version} · ${layout.theme} theme · ${layout.sections.length} sections`
            : undefined
        }
        actions={
          <Button
            iconLeft="edit"
            onClick={() => router.push("/reviews")}
          >
            Edit in a review
          </Button>
        }
      />

      <div className="pagebody">
        <div className="wl-shell">
          <Card style={{ padding: 0, overflow: "hidden" }}>
            <div className="wl-head">
              <span className="wl-head-title">Default sections</span>
              <span className="text-tertiary" style={{ fontSize: 12.5 }}>
                New reviews inherit this order; reviewers can tweak per review.
              </span>
            </div>
            {layout?.sections.map((s, i) => (
              <div key={s.id} className="wl-row">
                <span className="wl-row-num">{i + 1}</span>
                <span className="wl-row-title">{s.title}</span>
                <Chip tone="neutral">{s.type}</Chip>
                <Chip tone={s.enabled ? "pass" : "na"} dot>
                  {s.enabled ? "Included" : "Hidden"}
                </Chip>
              </div>
            ))}
          </Card>

          <Card className="wl-note">
            <div className="wl-note-head">
              <Icon name="info" size={18} />
              <span>How workbook layout works</span>
            </div>
            <p>
              This is the org default for the Technical Review workbook — section
              order, theme and branding. Reviewers adjust a workbook’s sections
              inside a review’s <strong>Builder</strong> (Technical → Builder).
            </p>
            <p className="text-secondary">
              The full org-layout editor — drag-reorder, the section library, and
              versioned “publish org default” — is on the roadmap. For now, open a
              review to shape its workbook.
            </p>
          </Card>
        </div>
      </div>
    </>
  );
}
