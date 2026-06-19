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
    profile: "Commercial",
    isDefault: true,
    createdAt: NOW - 90 * 86400000,
    versions: [
      {
        id: "wv-commercial-1",
        version: 1,
        status: "archived",
        theme: "Navy",
        createdAt: NOW - 90 * 86400000,
        publishedAt: NOW - 88 * 86400000,
        sections: [
          { id: "ws1-summary", title: "Property & Value Summary", type: "summary", enabled: true },
          { id: "ws1-scope", title: "Scope & Compliance", type: "findings", enabled: true },
          { id: "ws1-sales", title: "Sales Comparison Approach", type: "findings", enabled: true },
          { id: "ws1-conclusion", title: "Conclusion & Action Items", type: "conclusion", enabled: true },
          { id: "ws1-cert", title: "Reviewer Certification", type: "certification", enabled: true },
        ],
      },
      {
        id: "wv-commercial-2",
        version: 2,
        status: "published",
        theme: "Navy",
        createdAt: NOW - 30 * 86400000,
        publishedAt: NOW - 28 * 86400000,
        sections: [
          { id: "ws-summary", title: "Property & Value Summary", type: "summary", enabled: true },
          { id: "ws-scope", title: "Scope & Compliance", type: "findings", enabled: true },
          { id: "ws-sales", title: "Sales Comparison Approach", type: "findings", enabled: true },
          { id: "ws-income", title: "Income Approach", type: "findings", enabled: true },
          { id: "ws-conclusion", title: "Conclusion & Action Items", type: "conclusion", enabled: true },
          { id: "ws-cert", title: "Reviewer Certification", type: "certification", enabled: true },
        ],
      },
    ],
  },
  {
    id: "wl-org-residential",
    orgId: "org-001",
    name: "Org Workbook Layout — Residential",
    profile: "Residential",
    isDefault: true,
    createdAt: NOW - 60 * 86400000,
    versions: [
      {
        id: "wv-residential-1",
        version: 1,
        status: "published",
        theme: "Navy",
        createdAt: NOW - 60 * 86400000,
        publishedAt: NOW - 58 * 86400000,
        sections: [
          { id: "wr-summary", title: "Subject & Value Summary", type: "summary", enabled: true },
          { id: "wr-scope", title: "Scope & Compliance", type: "findings", enabled: true },
          { id: "wr-sales", title: "Sales Comparison Approach", type: "findings", enabled: true },
          { id: "wr-photos", title: "Photos & Exhibits", type: "exhibits", enabled: true },
          { id: "wr-conclusion", title: "Conclusion & Action Items", type: "conclusion", enabled: true },
          { id: "wr-cert", title: "Reviewer Certification", type: "certification", enabled: true },
        ],
      },
    ],
  },
];
