import type { WorkbookLayout } from "@/types";

// The org-default Technical workbook layout (= Builder in org mode). New reviews
// inherit it; reviewers can tweak per review. Light for v2 — the full 3-pane
// builder is deferred; "Edit layout" deep-links into the existing Builder.
const NOW = 1781827200000;

export const seedWorkbookLayouts: WorkbookLayout[] = [
  {
    id: "wl-org-commercial",
    orgId: "org-001",
    name: "Org Workbook Layout — Commercial",
    theme: "Navy",
    version: 1,
    sections: [
      { id: "ws-summary", title: "Property & Value Summary", type: "summary", enabled: true },
      { id: "ws-scope", title: "Scope & Compliance", type: "findings", enabled: true },
      { id: "ws-sales", title: "Sales Comparison Approach", type: "findings", enabled: true },
      { id: "ws-income", title: "Income Approach", type: "findings", enabled: true },
      { id: "ws-conclusion", title: "Conclusion & Action Items", type: "conclusion", enabled: true },
      { id: "ws-cert", title: "Reviewer Certification", type: "certification", enabled: true },
    ],
    createdAt: NOW - 90 * 86400000,
  },
];
